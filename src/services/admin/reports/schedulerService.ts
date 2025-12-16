/**
 * Scheduler & Delivery Service
 * Manages report scheduling, execution, and delivery
 */

import type {
  ReportConfig,
  ReportExecution,
  ReportSchedule,
  DeliveryConfig,
  ReportData
} from './types';
import { generateReport } from './reportGenerator';
import { exportReport, generateEmailHTML } from './exportService';
import { getFirebaseAdmin, getFirestore } from '@/lib/server/firebaseAdmin';

// ═══════════════════════════════════════════════════════════════
// SCHEDULING
// ═══════════════════════════════════════════════════════════════

export async function scheduleReport(config: ReportConfig): Promise<ReportSchedule> {
  const db = getFirestore();
  
  // Calculate next run time
  const nextRun = calculateNextRun(config.frequency, new Date());
  
  const schedule: ReportSchedule = {
    id: `sched_${Date.now()}`,
    reportConfigId: config.id,
    reportId: config.id,
    frequency: config.frequency,
    timeOfDay: '09:00', // Default
    timezone: 'America/Sao_Paulo',
    nextRun,
    enabled: true,
    paused: false,
    deliveryChannels: ['email'],
    executionCount: 0,
    successCount: 0,
    failureCount: 0
  };
  
  // Save to Firestore
  await db.collection('report_schedules').doc(schedule.id).set({
    ...schedule,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return schedule;
}

export async function getScheduledReports(): Promise<ReportSchedule[]> {
  const db = getFirestore();
  
  const snapshot = await db
    .collection('report_schedules')
    .where('enabled', '==', true)
    .where('paused', '==', false)
    .orderBy('nextRun', 'asc')
    .get();
  
  return snapshot.docs.map((doc: any) => doc.data() as ReportSchedule);
}

export async function processScheduledReports(): Promise<void> {
  const now = new Date();
  const schedules = await getScheduledReports();
  
  // Find schedules that should run now
  const dueSchedules = schedules.filter(s => new Date(s.nextRun) <= now);
  
  console.log(`Found ${dueSchedules.length} reports due for execution`);
  
  // Execute each due report
  for (const schedule of dueSchedules) {
    try {
      await executeScheduledReport(schedule);
    } catch (error) {
      console.error(`Failed to execute scheduled report ${schedule.id}:`, error);
      await updateScheduleStatus(schedule.id, 'failure', String(error));
    }
  }
}

async function executeScheduledReport(schedule: ReportSchedule): Promise<void> {
  const db = getFirestore();
  
  // Get report config
  const configDoc = await db.collection('report_configs').doc(schedule.reportConfigId).get();
  
  if (!configDoc.exists) {
    throw new Error(`Report config ${schedule.reportConfigId} not found`);
  }
  
  const config = configDoc.data() as ReportConfig;
  
  // Execute report
  const execution = await executeReport(config);
  
  // Update schedule
  const nextRun = calculateNextRun(schedule.frequency, new Date());
  
  await db.collection('report_schedules').doc(schedule.id).update({
    lastRun: new Date(),
    nextRun,
    executionCount: schedule.executionCount + 1,
    successCount: schedule.successCount + (execution.status === 'completed' ? 1 : 0),
    failureCount: schedule.failureCount + (execution.status === 'failed' ? 1 : 0),
    lastStatus: execution.status === 'completed' ? 'success' : 'failure',
    lastError: execution.error || null,
    updatedAt: new Date()
  });
}

function calculateNextRun(frequency: string, from: Date): Date {
  const next = new Date(from);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    
    default:
      next.setDate(next.getDate() + 1);
  }
  
  // Set to 9 AM
  next.setHours(9, 0, 0, 0);
  
  return next;
}

async function updateScheduleStatus(
  scheduleId: string,
  status: 'success' | 'failure',
  error?: string
): Promise<void> {
  const db = getFirestore();
  
  await db.collection('report_schedules').doc(scheduleId).update({
    lastStatus: status,
    lastError: error || null,
    updatedAt: new Date()
  });
}

// ═══════════════════════════════════════════════════════════════
// REPORT EXECUTION
// ═══════════════════════════════════════════════════════════════

export async function executeReport(config: ReportConfig): Promise<ReportExecution> {
  const db = getFirestore();
  
  const execution: ReportExecution = {
    id: `exec_${Date.now()}`,
    reportConfigId: config.id,
    reportId: config.id,
    reportName: config.name,
    status: 'pending',
    startedAt: new Date(),
    startTime: new Date(),
    retryCount: 0,
    format: config.format
  };
  
  // Save initial execution record
  await db.collection('report_executions').doc(execution.id).set(execution);
  
  try {
    // Update to running
    execution.status = 'running';
    await db.collection('report_executions').doc(execution.id).update({ status: 'running' });
    
    // Generate report
    const reportData = await generateReport(config);
    
    // Export to requested format
    const exported = await exportReport(reportData, config.format, {
      format: config.format,
      pdf: {
        orientation: 'portrait',
        pageSize: 'A4',
        includeCharts: true,
        includeTables: true,
        includeInsights: true,
        headerText: config.name,
        footerText: 'Cuide-me Torre de Controle'
      },
      csv: {
        delimiter: ',',
        includeHeaders: true,
        encoding: 'utf-8'
      }
    });
    
    // Upload file (in production: use Cloud Storage)
    const fileUrl = await uploadReportFile(execution.id, exported.buffer, exported.filename);
    
    // Deliver report
    const deliveryStatus = await deliverReport(config, reportData, fileUrl);
    
    // Update execution record
    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.fileUrl = fileUrl;
    execution.fileSize = exported.buffer.length;
    execution.deliveryStatus = deliveryStatus;
    
    await db.collection('report_executions').doc(execution.id).update({
      status: 'completed',
      completedAt: execution.completedAt,
      duration: execution.duration,
      fileUrl,
      fileSize: execution.fileSize,
      deliveryStatus
    });
    
    // Update report config
    await db.collection('report_configs').doc(config.id).update({
      lastRun: new Date()
    });
    
    return execution;
    
  } catch (error) {
    console.error('Report execution failed:', error);
    
    execution.status = 'failed';
    execution.error = String(error);
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    
    await db.collection('report_executions').doc(execution.id).update({
      status: 'failed',
      error: execution.error,
      completedAt: execution.completedAt,
      duration: execution.duration
    });
    
    throw error;
  }
}

async function uploadReportFile(
  executionId: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  // In production: Upload to Cloud Storage (GCS, S3, etc.)
  // For now, return a mock URL
  const mockUrl = `https://storage.cuide.me/reports/${executionId}/${filename}`;
  
  console.log(`Report file would be uploaded to: ${mockUrl}`);
  console.log(`File size: ${buffer.length} bytes`);
  
  return mockUrl;
}

// ═══════════════════════════════════════════════════════════════
// DELIVERY
// ═══════════════════════════════════════════════════════════════

async function deliverReport(
  config: ReportConfig,
  reportData: ReportData,
  fileUrl: string
): Promise<ReportExecution['deliveryStatus']> {
  const deliveryStatus: ReportExecution['deliveryStatus'] = {
    method: config.deliveryMethod,
    recipients: config.recipients,
    failed: []
  };
  
  try {
    switch (config.deliveryMethod) {
      case 'email':
        await deliverViaEmail(config, reportData, fileUrl);
        break;
      
      case 'slack':
        await deliverViaSlack(config, reportData, fileUrl);
        break;
      
      case 'webhook':
        await deliverViaWebhook(config, reportData, fileUrl);
        break;
      
      case 'download':
        // No delivery needed, just store the file
        break;
    }
    
    deliveryStatus.deliveredAt = new Date();
    
  } catch (error) {
    deliveryStatus.error = String(error);
    deliveryStatus.failed = config.recipients;
  }
  
  return deliveryStatus;
}

// ═══════════════════════════════════════════════════════════════
// EMAIL DELIVERY
// ═══════════════════════════════════════════════════════════════

async function deliverViaEmail(
  config: ReportConfig,
  reportData: ReportData,
  fileUrl: string
): Promise<void> {
  // In production: Use SendGrid, AWS SES, or similar
  
  const emailHTML = generateEmailHTML(reportData, fileUrl);
  
  const emailData = {
    to: config.recipients,
    subject: `${config.name} - ${new Date().toLocaleDateString('pt-BR')}`,
    html: emailHTML,
    attachmentUrl: fileUrl
  };
  
  console.log('Email would be sent:', {
    to: emailData.to,
    subject: emailData.subject,
    attachmentUrl: emailData.attachmentUrl
  });
  
  // Mock successful delivery
  // await sendEmailViaProvider(emailData);
}

// ═══════════════════════════════════════════════════════════════
// SLACK DELIVERY
// ═══════════════════════════════════════════════════════════════

async function deliverViaSlack(
  config: ReportConfig,
  reportData: ReportData,
  fileUrl: string
): Promise<void> {
  // In production: Use Slack Webhook API
  
  const slackMessage = {
    channel: config.recipients[0], // First recipient as channel
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: config.name
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Period:* ${formatDate(reportData.periodStart)} - ${formatDate(reportData.periodEnd)}\n*Generated:* ${formatDate(reportData.generatedAt)}`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Key Metrics:*\n' + reportData.summary.slice(0, 5).map(m => 
            `• ${m.label}: *${formatMetricValue(m.value, m.format, m.unit)}*${m.change !== undefined ? ` (${m.change > 0 ? '↑' : '↓'} ${Math.abs(m.change).toFixed(1)}%)` : ''}`
          ).join('\n')
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Full Report'
            },
            url: fileUrl
          }
        ]
      }
    ]
  };
  
  console.log('Slack message would be sent:', slackMessage);
  
  // Mock successful delivery
  // await sendSlackWebhook(webhookUrl, slackMessage);
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOK DELIVERY
// ═══════════════════════════════════════════════════════════════

async function deliverViaWebhook(
  config: ReportConfig,
  reportData: ReportData,
  fileUrl: string
): Promise<void> {
  // In production: HTTP POST to webhook URL
  
  const webhookPayload = {
    reportId: reportData.reportId,
    reportType: reportData.reportType,
    generatedAt: reportData.generatedAt,
    periodStart: reportData.periodStart,
    periodEnd: reportData.periodEnd,
    fileUrl,
    summary: reportData.summary,
    insights: reportData.insights
  };
  
  console.log('Webhook would be called:', {
    url: config.recipients[0], // First recipient as webhook URL
    payload: webhookPayload
  });
  
  // Mock successful delivery
  // await fetch(webhookUrl, { method: 'POST', body: JSON.stringify(webhookPayload) });
}

// ═══════════════════════════════════════════════════════════════
// REPORT HISTORY
// ═══════════════════════════════════════════════════════════════

export async function getReportExecutions(
  reportConfigId?: string,
  limit: number = 50
): Promise<ReportExecution[]> {
  const db = getFirestore();
  
  let query = db.collection('report_executions')
    .orderBy('startedAt', 'desc')
    .limit(limit);
  
  if (reportConfigId) {
    query = query.where('reportConfigId', '==', reportConfigId) as any;
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map((doc: any) => doc.data() as ReportExecution);
}

export async function getReportExecution(executionId: string): Promise<ReportExecution | null> {
  const db = getFirestore();
  
  const doc = await db.collection('report_executions').doc(executionId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as ReportExecution;
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

export async function cleanupOldReports(retentionDays: number = 90): Promise<number> {
  const db = getFirestore();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const snapshot = await db
    .collection('report_executions')
    .where('completedAt', '<', cutoffDate)
    .get();
  
  let deletedCount = 0;
  
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    deletedCount++;
  }
  
  console.log(`Cleaned up ${deletedCount} old report executions`);
  
  return deletedCount;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatMetricValue(
  value: number | string,
  format?: string,
  unit?: string
): string {
  if (typeof value === 'string') {
    return value;
  }
  
  switch (format) {
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'number':
      return value.toLocaleString('pt-BR');
    
    default:
      return `${value.toLocaleString('pt-BR')}${unit || ''}`;
  }
}
