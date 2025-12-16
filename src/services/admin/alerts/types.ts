/**
 * Intelligent Alerts System Types
 * Sprint 2: Sistema de alertas com priorização, rastreamento de ações e SLA
 */

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertCategory = 
  | 'operational' 
  | 'financial' 
  | 'quality' 
  | 'growth' 
  | 'retention' 
  | 'performance'
  | 'system';

export type AlertStatus = 'active' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';

export type AlertPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest, 5 = lowest

export interface AlertAction {
  id: string;
  alertId: string;
  actionType: 'acknowledge' | 'assign' | 'comment' | 'resolve' | 'dismiss' | 'escalate';
  performedBy: string; // User ID
  performedAt: Date;
  notes?: string;
  assignedTo?: string; // User ID for assignment
  metadata?: Record<string, any>;
}

export interface AlertSLA {
  responseTime: number; // minutes until must be acknowledged
  resolutionTime: number; // minutes until must be resolved
  escalationTime: number; // minutes until auto-escalation
  acknowledgedAt?: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  escalatedAt?: Date;
  isOverdue: boolean;
  minutesUntilEscalation: number;
}

export interface IntelligentAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  status: AlertStatus;
  priority: AlertPriority;
  
  // Core Alert Data
  title: string;
  message: string;
  detectedAt: Date;
  lastUpdatedAt: Date;
  
  // Context & Impact
  affectedEntity?: {
    type: 'professional' | 'family' | 'match' | 'transaction' | 'system';
    id: string;
    name?: string;
  };
  impactScore: number; // 0-100
  estimatedRevenueLoss?: number; // R$ per day/month
  affectedUsers?: number;
  
  // Recommendations
  recommendedActions: string[];
  automatedActionsAvailable: boolean;
  
  // Tracking
  actions: AlertAction[];
  assignedTo?: string; // User ID
  sla: AlertSLA;
  
  // Related Data
  relatedAlerts?: string[]; // IDs of related alerts
  sourceMetric?: string;
  metricValue?: number;
  metricThreshold?: number;
  trend?: 'improving' | 'stable' | 'degrading';
  
  // Metadata
  tags: string[];
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  enabled: boolean;
  
  // Trigger Conditions
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  timeWindow?: number; // minutes
  consecutiveViolations?: number; // number of times threshold must be violated
  
  // Alert Configuration
  priority: AlertPriority;
  responseSLA: number; // minutes
  resolutionSLA: number; // minutes
  escalationSLA: number; // minutes
  
  // Actions
  autoAcknowledge?: boolean;
  autoAssignTo?: string; // User ID or team
  recommendedActions: string[];
  
  // Metadata
  createdAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

export interface AlertsOverview {
  total: number;
  byStatus: Record<AlertStatus, number>;
  bySeverity: Record<AlertSeverity, number>;
  byCategory: Record<AlertCategory, number>;
  
  // SLA Metrics
  overdueSLA: number;
  averageResponseTime: number; // minutes
  averageResolutionTime: number; // minutes
  slaComplianceRate: number; // percentage
  
  // Priority Queue
  highPriority: IntelligentAlert[]; // Priority 1-2
  requiresAttention: IntelligentAlert[]; // Overdue or escalated
  recentlyResolved: IntelligentAlert[]; // Last 24h
  
  // Trends
  new24h: number;
  resolved24h: number;
  escalated24h: number;
  
  // Performance
  topCategories: Array<{ category: AlertCategory; count: number }>;
  responseTimeByCategory: Record<AlertCategory, number>;
  resolutionTimeByCategory: Record<AlertCategory, number>;
}

export interface AlertFilters {
  severity?: AlertSeverity[];
  category?: AlertCategory[];
  status?: AlertStatus[];
  priority?: AlertPriority[];
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  overdueOnly?: boolean;
  unassignedOnly?: boolean;
}

export interface AlertActionRequest {
  alertId: string;
  actionType: AlertAction['actionType'];
  performedBy: string;
  notes?: string;
  assignedTo?: string;
  metadata?: Record<string, any>;
}

export interface CreateAlertRequest {
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  affectedEntity?: IntelligentAlert['affectedEntity'];
  impactScore: number;
  estimatedRevenueLoss?: number;
  affectedUsers?: number;
  recommendedActions: string[];
  automatedActionsAvailable?: boolean;
  sourceMetric?: string;
  metricValue?: number;
  metricThreshold?: number;
  trend?: IntelligentAlert['trend'];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AlertStatistics {
  // Volume
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  
  // Efficiency
  avgTimeToAcknowledge: number; // minutes
  avgTimeToResolve: number; // minutes
  firstTimeResolutionRate: number; // percentage
  
  // SLA Performance
  slaBreaches: number;
  slaComplianceRate: number;
  overdueAlerts: number;
  
  // By Time Period
  last7Days: {
    created: number;
    resolved: number;
    escalated: number;
  };
  last30Days: {
    created: number;
    resolved: number;
    escalated: number;
  };
  
  // By Team Member (if assignedTo)
  byAssignee?: Record<string, {
    active: number;
    resolved: number;
    avgResolutionTime: number;
  }>;
}
