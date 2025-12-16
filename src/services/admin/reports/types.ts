/**
 * Automated Reports & Exports - Types
 * Sprint 6: Report generation, scheduling, PDF/CSV exports
 */

// ═══════════════════════════════════════════════════════════════
// REPORT TYPES
// ═══════════════════════════════════════════════════════════════

export type ReportType = 
  | 'executive_summary'    // High-level overview
  | 'operational_health'   // Sprint 1 dashboard
  | 'alerts_summary'       // Sprint 2 dashboard
  | 'growth_metrics'       // Sprint 3 dashboard
  | 'financial_metrics'    // Sprint 4 dashboard
  | 'pipeline_analysis'    // Sprint 5 dashboard
  | 'custom';              // User-defined

export type ReportFormat = 'pdf' | 'csv' | 'json' | 'excel';

export type ReportFrequency = 
  | 'daily' 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'on_demand';

// ═══════════════════════════════════════════════════════════════
// REPORT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  
  // Scheduling
  frequency: ReportFrequency;
  enabled: boolean;
  nextRun?: Date;
  lastRun?: Date;
  
  // Format & delivery
  format: ReportFormat;
  deliveryMethod: 'email' | 'slack' | 'download' | 'webhook';
  recipients: string[]; // Emails or Slack channels
  
  // Content configuration
  sections: ReportSection[];
  metrics: string[]; // Which metrics to include
  
  // Filters
  filters: {
    dateRange: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_quarter' | 'custom';
    customDateFrom?: Date;
    customDateTo?: Date;
    segments?: string[];
    tags?: string[];
  };
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'kpi' | 'chart' | 'table' | 'text' | 'insight' | 'funnel';
  order: number;
  config: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════
// REPORT EXECUTION
// ═══════════════════════════════════════════════════════════════

export interface ReportExecution {
  id: string;
  reportConfigId: string;
  reportName: string;
  
  // Status
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  
  // Result
  fileUrl?: string;
  fileSize?: number; // bytes
  format: ReportFormat;
  
  // Error handling
  error?: string;
  retryCount: number;
  
  // Delivery status
  deliveryStatus?: {
    method: string;
    recipients: string[];
    deliveredAt?: Date;
    failed?: string[];
    error?: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY REPORT
// ═══════════════════════════════════════════════════════════════

export interface ExecutiveSummaryReport {
  // Header
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  
  // Key Metrics Overview
  keyMetrics: {
    // Growth
    mrr: {
      current: number;
      change: number; // %
      target: number;
      status: 'on_track' | 'at_risk' | 'behind';
    };
    arr: {
      current: number;
      change: number;
      target: number;
      status: 'on_track' | 'at_risk' | 'behind';
    };
    
    // Customers
    activeCustomers: {
      count: number;
      change: number;
      churnRate: number;
    };
    
    // Pipeline
    pipelineValue: {
      total: number;
      weighted: number;
      coverage: number; // ratio
    };
    
    // Health
    overallHealthScore: number; // 0-100
  };
  
  // Executive Insights (top 5)
  topInsights: {
    type: 'success' | 'warning' | 'critical' | 'opportunity';
    title: string;
    summary: string;
    impact: number; // R$ value
    recommendation: string;
  }[];
  
  // Performance by Area
  areaPerformance: {
    area: string;
    score: number; // 0-100
    trend: 'up' | 'down' | 'stable';
    highlights: string[];
    concerns: string[];
  }[];
  
  // Goals & Targets
  goalsProgress: {
    goal: string;
    target: number;
    current: number;
    progress: number; // %
    status: 'on_track' | 'at_risk' | 'achieved' | 'missed';
    daysRemaining?: number;
  }[];
  
  // Next Actions (prioritized)
  nextActions: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    owner?: string;
    dueDate?: Date;
    estimatedImpact: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// REPORT DATA (Generic structure for all report types)
// ═══════════════════════════════════════════════════════════════

export interface ReportData {
  // Metadata
  reportId: string;
  reportType: ReportType;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  
  // Summary KPIs (top-level metrics)
  summary: {
    label: string;
    value: number | string;
    change?: number;
    unit?: string;
    format?: 'currency' | 'percentage' | 'number' | 'text';
  }[];
  
  // Charts data
  charts: {
    id: string;
    title: string;
    type: 'line' | 'bar' | 'pie' | 'area' | 'funnel';
    data: any[];
    config?: Record<string, any>;
  }[];
  
  // Tables data
  tables: {
    id: string;
    title: string;
    headers: string[];
    rows: any[][];
    totals?: any[];
  }[];
  
  // Insights
  insights: {
    type: 'success' | 'warning' | 'critical' | 'info' | 'opportunity';
    title: string;
    description: string;
    recommendation?: string;
  }[];
  
  // Raw data (for exports)
  rawData?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT OPTIONS
// ═══════════════════════════════════════════════════════════════

export interface ExportOptions {
  format: ReportFormat;
  
  // PDF options
  pdf?: {
    orientation: 'portrait' | 'landscape';
    pageSize: 'A4' | 'letter';
    includeCharts: boolean;
    includeTables: boolean;
    includeInsights: boolean;
    headerText?: string;
    footerText?: string;
    logo?: string; // URL or base64
  };
  
  // CSV options
  csv?: {
    delimiter: ',' | ';' | '\t';
    includeHeaders: boolean;
    encoding: 'utf-8' | 'latin1';
    tables?: string[]; // Which tables to export (optional - all if not specified)
  };
  
  // Excel options
  excel?: {
    sheetName: string;
    includeCharts: boolean;
    formatting: boolean;
    multiSheet: boolean; // One sheet per section
  };
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULING
// ═══════════════════════════════════════════════════════════════

export interface ReportSchedule {
  id: string;
  reportConfigId: string;
  
  frequency: ReportFrequency;
  
  // Timing
  timeOfDay?: string; // '09:00', '17:00'
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string; // 'America/Sao_Paulo'
  
  // Next execution
  nextRun: Date;
  lastRun?: Date;
  
  // Status
  enabled: boolean;
  paused: boolean;
  
  // History
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastStatus?: 'success' | 'failure';
  lastError?: string;
}

// ═══════════════════════════════════════════════════════════════
// DELIVERY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface DeliveryConfig {
  method: 'email' | 'slack' | 'webhook';
  
  // Email delivery
  email?: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string; // HTML template
    attachments: boolean;
  };
  
  // Slack delivery
  slack?: {
    channel: string; // '#general', '@user'
    webhookUrl: string;
    messageTemplate: string;
    includePreview: boolean;
    attachFile: boolean;
  };
  
  // Webhook delivery
  webhook?: {
    url: string;
    method: 'POST' | 'PUT';
    headers: Record<string, string>;
    authentication?: {
      type: 'bearer' | 'basic' | 'api_key';
      credentials: string;
    };
  };
}

// ═══════════════════════════════════════════════════════════════
// REPORT TEMPLATES
// ═══════════════════════════════════════════════════════════════

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  
  // Pre-configured sections
  defaultSections: ReportSection[];
  defaultMetrics: string[];
  
  // Template variables (for customization)
  variables: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'select';
    default: any;
    options?: any[]; // For select type
  }[];
  
  // Metadata
  category: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export interface ReportsDashboard {
  // Configured reports
  reports: ReportConfig[];
  
  // Recent executions
  recentExecutions: ReportExecution[];
  
  // Statistics
  stats: {
    totalReports: number;
    activeSchedules: number;
    executionsThisMonth: number;
    successRate: number; // %
    averageGenerationTime: number; // seconds
  };
  
  // Templates
  availableTemplates: ReportTemplate[];
  
  // Storage usage
  storage: {
    usedBytes: number;
    limitBytes: number;
    oldestReport: Date;
    fileCount: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive_weekly',
    name: 'Executive Summary - Weekly',
    type: 'executive_summary',
    description: 'High-level overview of key metrics and insights for executives',
    defaultSections: [
      { id: 's1', title: 'Key Metrics', type: 'kpi', order: 1, config: {} },
      { id: 's2', title: 'Top Insights', type: 'insight', order: 2, config: {} },
      { id: 's3', title: 'Goals Progress', type: 'chart', order: 3, config: {} }
    ],
    defaultMetrics: ['mrr', 'arr', 'customers', 'churn', 'pipeline'],
    variables: [],
    category: 'Executive',
    tags: ['weekly', 'executive', 'summary'],
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'financial_monthly',
    name: 'Financial Metrics - Monthly',
    type: 'financial_metrics',
    description: 'Complete financial analysis: MRR, ARR, LTV, Churn, Forecasting',
    defaultSections: [
      { id: 's1', title: 'MRR Analysis', type: 'chart', order: 1, config: {} },
      { id: 's2', title: 'Revenue Breakdown', type: 'table', order: 2, config: {} },
      { id: 's3', title: 'LTV & CAC', type: 'kpi', order: 3, config: {} },
      { id: 's4', title: 'Churn Analysis', type: 'chart', order: 4, config: {} }
    ],
    defaultMetrics: ['mrr', 'arr', 'ltv', 'cac', 'churn', 'nrr'],
    variables: [],
    category: 'Financial',
    tags: ['monthly', 'financial', 'revenue'],
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'pipeline_weekly',
    name: 'Sales Pipeline - Weekly',
    type: 'pipeline_analysis',
    description: 'Sales pipeline health, velocity, and conversion metrics',
    defaultSections: [
      { id: 's1', title: 'Pipeline Overview', type: 'kpi', order: 1, config: {} },
      { id: 's2', title: 'Sales Velocity', type: 'chart', order: 2, config: {} },
      { id: 's3', title: 'Conversion Funnel', type: 'funnel', order: 3, config: {} },
      { id: 's4', title: 'At-Risk Deals', type: 'table', order: 4, config: {} }
    ],
    defaultMetrics: ['pipeline_value', 'velocity', 'win_rate', 'avg_deal_size'],
    variables: [],
    category: 'Sales',
    tags: ['weekly', 'pipeline', 'sales'],
    isPublic: true,
    createdBy: 'system'
  }
];
