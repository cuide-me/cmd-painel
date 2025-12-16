/**
 * Reports Service - Main Orchestrator
 * Central hub for all report operations
 */

import type {
  ReportConfig,
  ReportExecution,
  ReportSchedule,
  ReportsDashboard,
  ReportTemplate,
  REPORT_TEMPLATES
} from './types';
import { generateReport } from './reportGenerator';
import { exportReport } from './exportService';
import {
  scheduleReport,
  executeReport,
  getReportExecutions,
  getScheduledReports,
  processScheduledReports,
  cleanupOldReports
} from './schedulerService';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

// Re-export for convenience
export * from './types';
export { generateReport } from './reportGenerator';
export { exportReport, generateEmailHTML } from './exportService';
export {
  scheduleReport,
  executeReport,
  getReportExecutions,
  getScheduledReports,
  processScheduledReports,
  cleanupOldReports
} from './schedulerService';

// ═══════════════════════════════════════════════════════════════
// REPORT CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

export async function createReportConfig(
  config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ReportConfig> {
  const db = getFirebaseAdmin().firestore();
  
  const newConfig: ReportConfig = {
    ...config,
    id: `rpt_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection('report_configs').doc(newConfig.id).set(newConfig);
  
  // If scheduled, create schedule
  if (newConfig.frequency !== 'on_demand' && newConfig.enabled) {
    await scheduleReport(newConfig);
  }
  
  return newConfig;
}

export async function updateReportConfig(
  reportId: string,
  updates: Partial<ReportConfig>
): Promise<ReportConfig> {
  const db = getFirebaseAdmin().firestore();
  
  const doc = await db.collection('report_configs').doc(reportId).get();
  
  if (!doc.exists) {
    throw new Error(`Report config ${reportId} not found`);
  }
  
  const updated: ReportConfig = {
    ...doc.data() as ReportConfig,
    ...updates,
    updatedAt: new Date()
  };
  
  await db.collection('report_configs').doc(reportId).update({
    ...updates,
    updatedAt: new Date()
  });
  
  // Update schedule if frequency changed
  if (updates.frequency && updated.frequency !== 'on_demand') {
    await scheduleReport(updated);
  }
  
  return updated;
}

export async function deleteReportConfig(reportId: string): Promise<void> {
  const db = getFirebaseAdmin().firestore();
  
  // Delete config
  await db.collection('report_configs').doc(reportId).delete();
  
  // Delete associated schedules
  const schedules = await db
    .collection('report_schedules')
    .where('reportConfigId', '==', reportId)
    .get();
  
  for (const doc of schedules.docs) {
    await doc.ref.delete();
  }
}

export async function getReportConfig(reportId: string): Promise<ReportConfig | null> {
  const db = getFirebaseAdmin().firestore();
  
  const doc = await db.collection('report_configs').doc(reportId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as ReportConfig;
}

export async function listReportConfigs(userId?: string): Promise<ReportConfig[]> {
  const db = getFirebaseAdmin().firestore();
  
  let query = db.collection('report_configs').orderBy('createdAt', 'desc');
  
  if (userId) {
    query = query.where('createdBy', '==', userId) as any;
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => doc.data() as ReportConfig);
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getReportsDashboard(): Promise<ReportsDashboard> {
  const db = getFirebaseAdmin().firestore();
  
  // Fetch all data in parallel
  const [reportsSnapshot, schedulesSnapshot, executionsSnapshot] = await Promise.all([
    db.collection('report_configs').get(),
    db.collection('report_schedules').where('enabled', '==', true).get(),
    db.collection('report_executions').orderBy('startedAt', 'desc').limit(50).get()
  ]);
  
  const reports = reportsSnapshot.docs.map(doc => doc.data() as ReportConfig);
  const schedules = schedulesSnapshot.docs.map(doc => doc.data() as ReportSchedule);
  const executions = executionsSnapshot.docs.map(doc => doc.data() as ReportExecution);
  
  // Calculate statistics
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const executionsThisMonth = executions.filter(e => 
    new Date(e.startedAt) >= thisMonthStart
  );
  
  const completedExecutions = executionsThisMonth.filter(e => e.status === 'completed');
  
  const successRate = executionsThisMonth.length > 0
    ? (completedExecutions.length / executionsThisMonth.length) * 100
    : 100;
  
  const averageGenerationTime = completedExecutions.length > 0
    ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length / 1000
    : 0;
  
  // Calculate storage
  const totalSize = executions.reduce((sum, e) => sum + (e.fileSize || 0), 0);
  const oldestExecution = executions.length > 0
    ? new Date(Math.min(...executions.map(e => new Date(e.startedAt).getTime())))
    : new Date();
  
  return {
    reports,
    recentExecutions: executions.slice(0, 20),
    stats: {
      totalReports: reports.length,
      activeSchedules: schedules.length,
      executionsThisMonth: executionsThisMonth.length,
      successRate,
      averageGenerationTime
    },
    availableTemplates: await getReportTemplates(),
    storage: {
      usedBytes: totalSize,
      limitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      oldestReport: oldestExecution,
      fileCount: executions.length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════

export async function getReportTemplates(): Promise<ReportTemplate[]> {
  // In production: Fetch from database
  // For now, return hardcoded templates from types.ts
  const { REPORT_TEMPLATES } = await import('./types');
  return REPORT_TEMPLATES;
}

export async function createReportFromTemplate(
  templateId: string,
  customization: Partial<ReportConfig>
): Promise<ReportConfig> {
  const templates = await getReportTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  const config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'> = {
    name: customization.name || template.name,
    type: template.type,
    description: customization.description || template.description,
    frequency: customization.frequency || 'weekly',
    enabled: customization.enabled !== undefined ? customization.enabled : true,
    format: customization.format || 'pdf',
    deliveryMethod: customization.deliveryMethod || 'email',
    recipients: customization.recipients || [],
    sections: customization.sections || template.defaultSections,
    metrics: customization.metrics || template.defaultMetrics,
    filters: customization.filters || {
      dateRange: 'last_30_days'
    },
    createdBy: customization.createdBy || 'system'
  };
  
  return await createReportConfig(config);
}

// ═══════════════════════════════════════════════════════════════
// ON-DEMAND REPORTS
// ═══════════════════════════════════════════════════════════════

export async function generateOnDemandReport(
  reportId: string
): Promise<{ execution: ReportExecution; downloadUrl: string }> {
  const config = await getReportConfig(reportId);
  
  if (!config) {
    throw new Error(`Report config ${reportId} not found`);
  }
  
  const execution = await executeReport(config);
  
  return {
    execution,
    downloadUrl: execution.fileUrl || ''
  };
}

// ═══════════════════════════════════════════════════════════════
// CRON JOB HANDLER
// ═══════════════════════════════════════════════════════════════

/**
 * Main cron job handler - should be called periodically (e.g., every hour)
 * Processes all scheduled reports that are due
 */
export async function runScheduledReportsJob(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  console.log('Starting scheduled reports job...');
  
  const startTime = Date.now();
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  try {
    const schedules = await getScheduledReports();
    const now = new Date();
    
    const dueSchedules = schedules.filter(s => new Date(s.nextRun) <= now);
    
    console.log(`Found ${dueSchedules.length} reports due for execution`);
    
    for (const schedule of dueSchedules) {
      processed++;
      
      try {
        const config = await getReportConfig(schedule.reportConfigId);
        
        if (!config) {
          console.error(`Report config ${schedule.reportConfigId} not found`);
          failed++;
          continue;
        }
        
        await executeReport(config);
        successful++;
        
      } catch (error) {
        console.error(`Failed to execute report ${schedule.reportConfigId}:`, error);
        failed++;
      }
    }
    
    // Cleanup old reports (keep last 90 days)
    const deletedCount = await cleanupOldReports(90);
    console.log(`Cleaned up ${deletedCount} old reports`);
    
  } catch (error) {
    console.error('Scheduled reports job failed:', error);
  }
  
  const duration = Date.now() - startTime;
  console.log(`Scheduled reports job completed in ${duration}ms`);
  console.log(`Processed: ${processed}, Successful: ${successful}, Failed: ${failed}`);
  
  return { processed, successful, failed };
}

// ═══════════════════════════════════════════════════════════════
// STATISTICS & ANALYTICS
// ═══════════════════════════════════════════════════════════════

export async function getReportStatistics(reportId: string): Promise<{
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  lastExecution?: ReportExecution;
  executionTrend: { date: Date; count: number; successRate: number }[];
}> {
  const executions = await getReportExecutions(reportId, 100);
  
  const successful = executions.filter(e => e.status === 'completed');
  const successRate = executions.length > 0
    ? (successful.length / executions.length) * 100
    : 0;
  
  const averageDuration = successful.length > 0
    ? successful.reduce((sum, e) => sum + (e.duration || 0), 0) / successful.length / 1000
    : 0;
  
  // Group by day for trend
  const trend = new Map<string, { count: number; successful: number }>();
  
  for (const exec of executions) {
    const date = new Date(exec.startedAt).toISOString().split('T')[0];
    
    if (!trend.has(date)) {
      trend.set(date, { count: 0, successful: 0 });
    }
    
    const entry = trend.get(date)!;
    entry.count++;
    
    if (exec.status === 'completed') {
      entry.successful++;
    }
  }
  
  const executionTrend = Array.from(trend.entries()).map(([date, data]) => ({
    date: new Date(date),
    count: data.count,
    successRate: (data.successful / data.count) * 100
  }));
  
  return {
    totalExecutions: executions.length,
    successRate,
    averageDuration,
    lastExecution: executions[0],
    executionTrend
  };
}
