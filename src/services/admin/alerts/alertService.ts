/**
 * Alert Management Service
 * Core service for managing intelligent alerts with actions, SLA tracking, and analytics
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import {
  IntelligentAlert,
  AlertAction,
  AlertFilters,
  AlertsOverview,
  AlertStatistics,
  CreateAlertRequest,
  AlertActionRequest,
  AlertStatus,
  AlertSeverity,
  AlertCategory,
} from './types';
import {
  calculatePriority,
  calculateSLA,
  shouldEscalate,
  sortAlertsByPriority,
  groupAlertsByPriority,
  calculateImpactScore,
  recommendActions,
} from './prioritization';

const ALERTS_COLLECTION = 'intelligent_alerts';
const ALERT_ACTIONS_COLLECTION = 'alert_actions';

/**
 * Create a new intelligent alert
 */
export async function createAlert(request: CreateAlertRequest): Promise<IntelligentAlert> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // Calculate priority and impact
  const priority = calculatePriority({
    severity: request.severity,
    category: request.category,
    impactScore: request.impactScore,
    estimatedRevenueLoss: request.estimatedRevenueLoss,
    affectedUsers: request.affectedUsers,
    trend: request.trend,
  });
  
  const detectedAt = new Date();
  const sla = calculateSLA(request.severity, priority, detectedAt);
  
  // If no recommended actions provided, generate them
  const recommendedActions = request.recommendedActions.length > 0
    ? request.recommendedActions
    : recommendActions({
        category: request.category,
        severity: request.severity,
        sourceMetric: request.sourceMetric,
      });
  
  const alert: Omit<IntelligentAlert, 'id'> = {
    severity: request.severity,
    category: request.category,
    status: 'active',
    priority,
    title: request.title,
    message: request.message,
    detectedAt,
    lastUpdatedAt: detectedAt,
    affectedEntity: request.affectedEntity,
    impactScore: request.impactScore,
    estimatedRevenueLoss: request.estimatedRevenueLoss,
    affectedUsers: request.affectedUsers,
    recommendedActions,
    automatedActionsAvailable: request.automatedActionsAvailable || false,
    actions: [],
    sla,
    sourceMetric: request.sourceMetric,
    metricValue: request.metricValue,
    metricThreshold: request.metricThreshold,
    trend: request.trend,
    tags: request.tags || [],
    metadata: request.metadata,
  };
  
  const docRef = await db.collection(ALERTS_COLLECTION).add(alert);
  
  return {
    id: docRef.id,
    ...alert,
  };
}

/**
 * Perform an action on an alert (acknowledge, assign, resolve, etc.)
 */
export async function performAlertAction(request: AlertActionRequest): Promise<IntelligentAlert> {
  getFirebaseAdmin();
  const db = getFirestore();
  const alertRef = db.collection(ALERTS_COLLECTION).doc(request.alertId);
  const alertDoc = await alertRef.get();
  
  if (!alertDoc.exists) {
    throw new Error(`Alert ${request.alertId} not found`);
  }
  
  const alert = { id: alertDoc.id, ...alertDoc.data() } as IntelligentAlert;
  
  // Create action record
  const action: Omit<AlertAction, 'id'> = {
    alertId: request.alertId,
    actionType: request.actionType,
    performedBy: request.performedBy,
    performedAt: new Date(),
    notes: request.notes,
    assignedTo: request.assignedTo,
    metadata: request.metadata,
  };
  
  const actionRef = await db.collection(ALERT_ACTIONS_COLLECTION).add(action);
  const actionWithId: AlertAction = { id: actionRef.id, ...action };
  
  // Update alert based on action type
  const updates: Partial<IntelligentAlert> = {
    lastUpdatedAt: new Date(),
    actions: [...alert.actions, actionWithId],
  };
  
  switch (request.actionType) {
    case 'acknowledge':
      updates.status = 'acknowledged';
      updates.sla = {
        ...alert.sla,
        acknowledgedAt: new Date(),
      };
      break;
      
    case 'assign':
      if (request.assignedTo) {
        updates.assignedTo = request.assignedTo;
        updates.status = 'acknowledged';
      }
      break;
      
    case 'resolve':
      updates.status = 'resolved';
      updates.sla = {
        ...alert.sla,
        resolvedAt: new Date(),
      };
      break;
      
    case 'dismiss':
      updates.status = 'dismissed';
      break;
      
    case 'escalate':
      updates.sla = {
        ...alert.sla,
        escalatedAt: new Date(),
      };
      updates.status = 'in_progress';
      break;
      
    case 'comment':
      // Just adds to action history, no status change
      break;
  }
  
  await alertRef.update(updates);
  
  return {
    ...alert,
    ...updates,
  } as IntelligentAlert;
}

/**
 * Get all alerts with optional filtering
 */
export async function getAlerts(filters?: AlertFilters): Promise<IntelligentAlert[]> {
  getFirebaseAdmin();
  const db = getFirestore();
  let query: FirebaseFirestore.Query = db.collection(ALERTS_COLLECTION);
  
  // Apply filters
  if (filters?.severity && filters.severity.length > 0) {
    query = query.where('severity', 'in', filters.severity);
  }
  
  if (filters?.category && filters.category.length > 0) {
    query = query.where('category', 'in', filters.category);
  }
  
  if (filters?.status && filters.status.length > 0) {
    query = query.where('status', 'in', filters.status);
  }
  
  if (filters?.assignedTo) {
    query = query.where('assignedTo', '==', filters.assignedTo);
  }
  
  if (filters?.dateFrom) {
    query = query.where('detectedAt', '>=', filters.dateFrom);
  }
  
  if (filters?.dateTo) {
    query = query.where('detectedAt', '<=', filters.dateTo);
  }
  
  const snapshot = await query.get();
  let alerts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as IntelligentAlert[];
  
  // Apply client-side filters
  if (filters?.priority && filters.priority.length > 0) {
    alerts = alerts.filter(alert => filters.priority!.includes(alert.priority));
  }
  
  if (filters?.overdueOnly) {
    alerts = alerts.filter(alert => alert.sla.isOverdue);
  }
  
  if (filters?.unassignedOnly) {
    alerts = alerts.filter(alert => !alert.assignedTo);
  }
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    alerts = alerts.filter(alert =>
      alert.title.toLowerCase().includes(searchLower) ||
      alert.message.toLowerCase().includes(searchLower) ||
      alert.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  return sortAlertsByPriority(alerts);
}

/**
 * Get alerts overview with statistics and priority queues
 */
export async function getAlertsOverview(): Promise<AlertsOverview> {
  const allAlerts = await getAlerts();
  const activeAlerts = allAlerts.filter(a => a.status !== 'resolved' && a.status !== 'dismissed');
  
  // Count by status
  const byStatus: Record<AlertStatus, number> = {
    active: 0,
    acknowledged: 0,
    in_progress: 0,
    resolved: 0,
    dismissed: 0,
  };
  allAlerts.forEach(alert => {
    byStatus[alert.status]++;
  });
  
  // Count by severity
  const bySeverity: Record<AlertSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  activeAlerts.forEach(alert => {
    bySeverity[alert.severity]++;
  });
  
  // Count by category
  const byCategory: Record<AlertCategory, number> = {
    operational: 0,
    financial: 0,
    quality: 0,
    growth: 0,
    retention: 0,
    performance: 0,
    system: 0,
  };
  activeAlerts.forEach(alert => {
    byCategory[alert.category]++;
  });
  
  // SLA metrics
  const overdueSLA = activeAlerts.filter(a => a.sla.isOverdue).length;
  
  const acknowledgedAlerts = allAlerts.filter(a => a.sla.acknowledgedAt);
  const averageResponseTime = acknowledgedAlerts.length > 0
    ? acknowledgedAlerts.reduce((sum, alert) => {
        const responseTime = alert.sla.acknowledgedAt!.getTime() - alert.detectedAt.getTime();
        return sum + responseTime / 60000; // Convert to minutes
      }, 0) / acknowledgedAlerts.length
    : 0;
  
  const resolvedAlerts = allAlerts.filter(a => a.sla.resolvedAt);
  const averageResolutionTime = resolvedAlerts.length > 0
    ? resolvedAlerts.reduce((sum, alert) => {
        const resolutionTime = alert.sla.resolvedAt!.getTime() - alert.detectedAt.getTime();
        return sum + resolutionTime / 60000; // Convert to minutes
      }, 0) / resolvedAlerts.length
    : 0;
  
  const slaCompliantAlerts = resolvedAlerts.filter(alert => {
    const resolutionTime = (alert.sla.resolvedAt!.getTime() - alert.detectedAt.getTime()) / 60000;
    return resolutionTime <= alert.sla.resolutionTime;
  });
  const slaComplianceRate = resolvedAlerts.length > 0
    ? (slaCompliantAlerts.length / resolvedAlerts.length) * 100
    : 0;
  
  // Priority queues
  const highPriority = activeAlerts.filter(a => a.priority <= 2);
  const requiresAttention = activeAlerts.filter(a => a.sla.isOverdue || a.sla.escalatedAt);
  
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentlyResolved = allAlerts.filter(
    a => a.status === 'resolved' && a.sla.resolvedAt && a.sla.resolvedAt >= last24h
  );
  
  // Trends
  const new24h = allAlerts.filter(a => a.detectedAt >= last24h).length;
  const resolved24h = recentlyResolved.length;
  const escalated24h = allAlerts.filter(
    a => a.sla.escalatedAt && a.sla.escalatedAt >= last24h
  ).length;
  
  // Top categories
  const categoryEntries = Object.entries(byCategory)
    .map(([category, count]) => ({ category: category as AlertCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Response time by category
  const responseTimeByCategory: Record<AlertCategory, number> = {} as any;
  Object.keys(byCategory).forEach(category => {
    const categoryAlerts = acknowledgedAlerts.filter(a => a.category === category);
    responseTimeByCategory[category as AlertCategory] = categoryAlerts.length > 0
      ? categoryAlerts.reduce((sum, alert) => {
          const responseTime = alert.sla.acknowledgedAt!.getTime() - alert.detectedAt.getTime();
          return sum + responseTime / 60000;
        }, 0) / categoryAlerts.length
      : 0;
  });
  
  // Resolution time by category
  const resolutionTimeByCategory: Record<AlertCategory, number> = {} as any;
  Object.keys(byCategory).forEach(category => {
    const categoryResolved = resolvedAlerts.filter(a => a.category === category);
    resolutionTimeByCategory[category as AlertCategory] = categoryResolved.length > 0
      ? categoryResolved.reduce((sum, alert) => {
          const resolutionTime = alert.sla.resolvedAt!.getTime() - alert.detectedAt.getTime();
          return sum + resolutionTime / 60000;
        }, 0) / categoryResolved.length
      : 0;
  });
  
  return {
    total: allAlerts.length,
    byStatus,
    bySeverity,
    byCategory,
    overdueSLA,
    averageResponseTime,
    averageResolutionTime,
    slaComplianceRate,
    highPriority: sortAlertsByPriority(highPriority).slice(0, 10),
    requiresAttention: sortAlertsByPriority(requiresAttention).slice(0, 10),
    recentlyResolved: recentlyResolved.slice(0, 10),
    new24h,
    resolved24h,
    escalated24h,
    topCategories: categoryEntries,
    responseTimeByCategory,
    resolutionTimeByCategory,
  };
}

/**
 * Get detailed statistics about alerts
 */
export async function getAlertStatistics(): Promise<AlertStatistics> {
  const allAlerts = await getAlerts();
  const activeAlerts = allAlerts.filter(a => a.status !== 'resolved' && a.status !== 'dismissed');
  const resolvedAlerts = allAlerts.filter(a => a.status === 'resolved');
  
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Calculate averages
  const acknowledgedAlerts = allAlerts.filter(a => a.sla.acknowledgedAt);
  const avgTimeToAcknowledge = acknowledgedAlerts.length > 0
    ? acknowledgedAlerts.reduce((sum, alert) => {
        const time = (alert.sla.acknowledgedAt!.getTime() - alert.detectedAt.getTime()) / 60000;
        return sum + time;
      }, 0) / acknowledgedAlerts.length
    : 0;
  
  const avgTimeToResolve = resolvedAlerts.length > 0
    ? resolvedAlerts.reduce((sum, alert) => {
        const time = (alert.sla.resolvedAt!.getTime() - alert.detectedAt.getTime()) / 60000;
        return sum + time;
      }, 0) / resolvedAlerts.length
    : 0;
  
  // First time resolution rate (resolved without escalation)
  const firstTimeResolved = resolvedAlerts.filter(a => !a.sla.escalatedAt);
  const firstTimeResolutionRate = resolvedAlerts.length > 0
    ? (firstTimeResolved.length / resolvedAlerts.length) * 100
    : 0;
  
  // SLA metrics
  const slaBreaches = resolvedAlerts.filter(alert => {
    const resolutionTime = (alert.sla.resolvedAt!.getTime() - alert.detectedAt.getTime()) / 60000;
    return resolutionTime > alert.sla.resolutionTime;
  }).length;
  
  const slaComplianceRate = resolvedAlerts.length > 0
    ? ((resolvedAlerts.length - slaBreaches) / resolvedAlerts.length) * 100
    : 0;
  
  const overdueAlerts = activeAlerts.filter(a => a.sla.isOverdue).length;
  
  // By assignee
  const byAssignee: Record<string, { active: number; resolved: number; avgResolutionTime: number }> = {};
  
  allAlerts.forEach(alert => {
    if (alert.assignedTo) {
      if (!byAssignee[alert.assignedTo]) {
        byAssignee[alert.assignedTo] = {
          active: 0,
          resolved: 0,
          avgResolutionTime: 0,
        };
      }
      
      if (alert.status === 'resolved') {
        byAssignee[alert.assignedTo].resolved++;
        const resolutionTime = (alert.sla.resolvedAt!.getTime() - alert.detectedAt.getTime()) / 60000;
        byAssignee[alert.assignedTo].avgResolutionTime += resolutionTime;
      } else if (alert.status !== 'dismissed') {
        byAssignee[alert.assignedTo].active++;
      }
    }
  });
  
  // Calculate average resolution time per assignee
  Object.values(byAssignee).forEach(stats => {
    if (stats.resolved > 0) {
      stats.avgResolutionTime = stats.avgResolutionTime / stats.resolved;
    }
  });
  
  return {
    totalAlerts: allAlerts.length,
    activeAlerts: activeAlerts.length,
    resolvedAlerts: resolvedAlerts.length,
    avgTimeToAcknowledge,
    avgTimeToResolve,
    firstTimeResolutionRate,
    slaBreaches,
    slaComplianceRate,
    overdueAlerts,
    last7Days: {
      created: allAlerts.filter(a => a.detectedAt >= last7Days).length,
      resolved: resolvedAlerts.filter(a => a.sla.resolvedAt && a.sla.resolvedAt >= last7Days).length,
      escalated: allAlerts.filter(a => a.sla.escalatedAt && a.sla.escalatedAt >= last7Days).length,
    },
    last30Days: {
      created: allAlerts.filter(a => a.detectedAt >= last30Days).length,
      resolved: resolvedAlerts.filter(a => a.sla.resolvedAt && a.sla.resolvedAt >= last30Days).length,
      escalated: allAlerts.filter(a => a.sla.escalatedAt && a.sla.escalatedAt >= last30Days).length,
    },
    byAssignee: Object.keys(byAssignee).length > 0 ? byAssignee : undefined,
  };
}

/**
 * Auto-escalate alerts that have exceeded SLA
 */
export async function autoEscalateAlerts(): Promise<number> {
  const activeAlerts = await getAlerts({
    status: ['active', 'acknowledged', 'in_progress'],
  });
  
  let escalatedCount = 0;
  
  for (const alert of activeAlerts) {
    if (shouldEscalate(alert)) {
      await performAlertAction({
        alertId: alert.id,
        actionType: 'escalate',
        performedBy: 'system',
        notes: 'Auto-escalated due to SLA breach',
      });
      escalatedCount++;
    }
  }
  
  return escalatedCount;
}

/**
 * Get a single alert by ID
 */
export async function getAlertById(alertId: string): Promise<IntelligentAlert | null> {
  getFirebaseAdmin();
  const db = getFirestore();
  const doc = await db.collection(ALERTS_COLLECTION).doc(alertId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data(),
  } as IntelligentAlert;
}
