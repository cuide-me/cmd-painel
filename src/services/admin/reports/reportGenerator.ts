/**
 * Report Generator Service
 * Generates report data from all dashboard modules
 */

import type {
  ReportData,
  ReportType,
  ReportConfig,
  ExecutiveSummaryReport
} from './types';
import { getDashboardData } from '../dashboard';
import { getGrowthDashboard } from '../growth';
import { getFinanceiroDashboard } from '../financeiro-v2';
import { getPipelineDashboard } from '../pipeline-v2';
import { getOverviewData } from '../overview/overview';
import { getAllAlerts } from '../overview/alerts';

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════

export async function generateReport(
  config: ReportConfig
): Promise<ReportData> {
  const { type, filters } = config;
  
  // Calculate date range
  const { startDate, endDate } = calculateDateRange(filters.dateRange, filters);
  
  // Generate based on type
  switch (type) {
    case 'executive_summary':
      return await generateExecutiveSummary(startDate, endDate);
    
    case 'operational_health':
      return await generateOperationalHealthReport(startDate, endDate);
    
    case 'alerts_summary':
      return await generateAlertsSummaryReport(startDate, endDate);
    
    case 'growth_metrics':
      return await generateGrowthReport(startDate, endDate);
    
    case 'financial_metrics':
      return await generateFinancialReport(startDate, endDate);
    
    case 'pipeline_analysis':
      return await generatePipelineReport(startDate, endDate);
    
    case 'custom':
      return await generateCustomReport(config, startDate, endDate);
    
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════

async function generateExecutiveSummary(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  // Fetch all dashboard data
  const [operational, growth, financial, pipeline] = await Promise.all([
    getDashboardData({ dateFrom: startDate, dateTo: endDate }),
    getGrowthDashboard(startDate, endDate),
    getFinanceiroDashboard({ dateFrom: startDate, dateTo: endDate }),
    getPipelineDashboard({ dateFrom: startDate, dateTo: endDate })
  ]);
  
  // Build executive summary
  const summary: ReportData['summary'] = [
    {
      label: 'MRR',
      value: financial.mrr.overview.currentMRR,
      change: financial.mrr.overview.mrrGrowth,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'ARR',
      value: financial.mrr.overview.currentARR,
      change: financial.mrr.overview.arrGrowth,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'Active Customers',
      value: operational.families.active + operational.professionals.active,
      change: calculateCustomerChange(operational),
      format: 'number'
    },
    {
      label: 'Churn Rate',
      value: financial.churn.overview.churnRate,
      change: financial.churn.overview.previousChurnRate - financial.churn.overview.churnRate,
      unit: '%',
      format: 'percentage'
    },
    {
      label: 'Pipeline Value',
      value: pipeline.metrics.overview.totalValue,
      change: calculatePipelineChange(pipeline),
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'Health Score',
      value: calculateOverallHealth(operational, growth, financial, pipeline),
      unit: '/100',
      format: 'number'
    }
  ];
  
  // Build charts
  const charts = [
    {
      id: 'mrr_trend',
      title: 'MRR Trend',
      type: 'line' as const,
      data: financial.mrr.history.map(h => ({
        date: h.date,
        value: h.mrr
      }))
    },
    {
      id: 'revenue_breakdown',
      title: 'Revenue Breakdown',
      type: 'pie' as const,
      data: [
        { label: 'New', value: financial.mrr.overview.newMRR },
        { label: 'Expansion', value: financial.mrr.overview.expansionMRR },
        { label: 'Existing', value: financial.mrr.overview.currentMRR - financial.mrr.overview.newMRR - financial.mrr.overview.expansionMRR }
      ]
    },
    {
      id: 'pipeline_funnel',
      title: 'Sales Funnel',
      type: 'funnel' as const,
      data: pipeline.metrics.funnel.stages
    }
  ];
  
  // Build insights
  const insights = [
    ...financial.insights.slice(0, 3),
    ...pipeline.insights.slice(0, 2),
    ...growth.insights.slice(0, 2)
  ].map(insight => ({
    type: insight.type,
    title: insight.title,
    description: insight.description,
    recommendation: insight.recommendation
  }));
  
  return {
    reportId: `exec_${Date.now()}`,
    reportType: 'executive_summary',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables: [],
    insights,
    rawData: {
      operational,
      growth,
      financial,
      pipeline
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// OPERATIONAL HEALTH REPORT
// ═══════════════════════════════════════════════════════════════

async function generateOperationalHealthReport(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const data = await getDashboardData({ dateFrom: startDate, dateTo: endDate });
  
  const summary: ReportData['summary'] = [
    {
      label: 'Total Professionals',
      value: data.professionals.total,
      format: 'number'
    },
    {
      label: 'Active Professionals',
      value: data.professionals.active,
      change: ((data.professionals.active / data.professionals.total) * 100) - 100,
      format: 'number'
    },
    {
      label: 'Total Families',
      value: data.families.total,
      format: 'number'
    },
    {
      label: 'Active Families',
      value: data.families.active,
      format: 'number'
    },
    {
      label: 'Active Matches',
      value: data.matches.active,
      format: 'number'
    },
    {
      label: 'Match Success Rate',
      value: data.matches.successRate,
      unit: '%',
      format: 'percentage'
    }
  ];
  
  const charts = [
    {
      id: 'professionals_trend',
      title: 'Professionals Growth',
      type: 'line' as const,
      data: data.professionals.trend || []
    },
    {
      id: 'families_trend',
      title: 'Families Growth',
      type: 'line' as const,
      data: data.families.trend || []
    }
  ];
  
  const tables = [
    {
      id: 'professionals_by_specialty',
      title: 'Professionals by Specialty',
      headers: ['Specialty', 'Count', 'Active', 'Active %'],
      rows: data.professionals.bySpecialty?.map(s => [
        s.specialty,
        s.total,
        s.active,
        `${((s.active / s.total) * 100).toFixed(1)}%`
      ]) || []
    }
  ];
  
  return {
    reportId: `oph_${Date.now()}`,
    reportType: 'operational_health',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables,
    insights: [],
    rawData: data
  };
}

// ═══════════════════════════════════════════════════════════════
// GROWTH METRICS REPORT
// ═══════════════════════════════════════════════════════════════

async function generateGrowthReport(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const data = await getGrowthDashboard(startDate, endDate);
  
  const summary: ReportData['summary'] = [
    {
      label: 'New Users',
      value: data.acquisition.newUsers,
      change: data.acquisition.growthRate,
      format: 'number'
    },
    {
      label: 'Activation Rate',
      value: data.activation.activationRate,
      unit: '%',
      format: 'percentage'
    },
    {
      label: 'Retention Rate',
      value: data.retention.currentRetention,
      unit: '%',
      format: 'percentage'
    },
    {
      label: 'Revenue per User',
      value: data.revenue.arpu,
      unit: 'R$',
      format: 'currency'
    }
  ];
  
  const charts = [
    {
      id: 'acquisition_trend',
      title: 'User Acquisition',
      type: 'line' as const,
      data: data.acquisition.trend
    },
    {
      id: 'retention_cohorts',
      title: 'Retention Cohorts',
      type: 'area' as const,
      data: data.retention.cohorts
    }
  ];
  
  return {
    reportId: `grw_${Date.now()}`,
    reportType: 'growth_metrics',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables: [],
    insights: data.insights,
    rawData: data
  };
}

// ═══════════════════════════════════════════════════════════════
// FINANCIAL METRICS REPORT
// ═══════════════════════════════════════════════════════════════

async function generateFinancialReport(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const data = await getFinanceiroDashboard({ dateFrom: startDate, dateTo: endDate });
  
  const summary: ReportData['summary'] = [
    {
      label: 'Current MRR',
      value: data.mrr.overview.currentMRR,
      change: data.mrr.overview.mrrGrowth,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'ARR',
      value: data.mrr.overview.currentARR,
      change: data.mrr.overview.arrGrowth,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'Net Revenue Retention',
      value: data.mrr.overview.netRevenueRetention,
      unit: '%',
      format: 'percentage'
    },
    {
      label: 'Customer LTV',
      value: data.ltv.predictive.ltv,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'LTV:CAC Ratio',
      value: data.ltv.predictive.ltvToCacRatio,
      format: 'number'
    },
    {
      label: 'Churn Rate',
      value: data.churn.overview.churnRate,
      unit: '%',
      format: 'percentage'
    }
  ];
  
  const charts = [
    {
      id: 'mrr_waterfall',
      title: 'MRR Movement',
      type: 'bar' as const,
      data: [
        { label: 'Starting MRR', value: data.mrr.overview.previousMRR },
        { label: 'New', value: data.mrr.overview.newMRR },
        { label: 'Expansion', value: data.mrr.overview.expansionMRR },
        { label: 'Contraction', value: -data.mrr.overview.contractionMRR },
        { label: 'Churn', value: -data.mrr.overview.churnedMRR },
        { label: 'Ending MRR', value: data.mrr.overview.currentMRR }
      ]
    },
    {
      id: 'ltv_by_segment',
      title: 'LTV by Segment',
      type: 'bar' as const,
      data: data.ltv.bySegment.map(s => ({
        label: s.segment,
        value: s.ltv
      }))
    },
    {
      id: 'churn_trend',
      title: 'Churn Trend',
      type: 'line' as const,
      data: data.churn.history.map(h => ({
        date: h.month,
        value: h.churnRate
      }))
    }
  ];
  
  const tables = [
    {
      id: 'cohort_revenue',
      title: 'Revenue by Cohort',
      headers: ['Cohort', 'Customers', 'MRR', 'LTV'],
      rows: data.cohortAnalysis?.map(c => [
        c.cohort,
        c.customers,
        `R$ ${c.mrr.toLocaleString('pt-BR')}`,
        `R$ ${c.ltv.toLocaleString('pt-BR')}`
      ]) || []
    }
  ];
  
  return {
    reportId: `fin_${Date.now()}`,
    reportType: 'financial_metrics',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables,
    insights: data.insights,
    rawData: data
  };
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE ANALYSIS REPORT
// ═══════════════════════════════════════════════════════════════

async function generatePipelineReport(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const data = await getPipelineDashboard({ dateFrom: startDate, dateTo: endDate });
  
  const summary: ReportData['summary'] = [
    {
      label: 'Total Pipeline Value',
      value: data.metrics.overview.totalValue,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'Weighted Value',
      value: data.metrics.overview.weightedValue,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'Sales Velocity',
      value: data.velocity.current.currentVelocity,
      change: data.velocity.current.velocityChange,
      unit: 'R$/day',
      format: 'currency'
    },
    {
      label: 'Win Rate',
      value: data.metrics.winLoss.winRate,
      unit: '%',
      format: 'percentage'
    },
    {
      label: 'Avg Deal Size',
      value: data.metrics.overview.averageValue,
      unit: 'R$',
      format: 'currency'
    },
    {
      label: 'Avg Sales Cycle',
      value: data.metrics.time.averageCycleTime,
      unit: ' days',
      format: 'number'
    }
  ];
  
  const charts = [
    {
      id: 'pipeline_by_stage',
      title: 'Pipeline by Stage',
      type: 'funnel' as const,
      data: data.metrics.funnel.stages
    },
    {
      id: 'velocity_trend',
      title: 'Sales Velocity Trend',
      type: 'line' as const,
      data: data.velocity.trends
    },
    {
      id: 'conversion_rates',
      title: 'Stage Conversion Rates',
      type: 'bar' as const,
      data: data.conversion.stageConversions.map(s => ({
        label: s.fromStage,
        value: s.conversionRate
      }))
    }
  ];
  
  const tables = [
    {
      id: 'at_risk_deals',
      title: 'At-Risk Deals',
      headers: ['Deal', 'Value', 'Stage', 'Days in Stage', 'Risk Factors'],
      rows: data.health.atRiskDeals.slice(0, 10).map(d => [
        d.dealName,
        `R$ ${d.value.toLocaleString('pt-BR')}`,
        d.stage,
        d.daysInStage,
        d.riskFactors.join(', ')
      ])
    }
  ];
  
  return {
    reportId: `pip_${Date.now()}`,
    reportType: 'pipeline_analysis',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables,
    insights: data.insights,
    rawData: data
  };
}

// ═══════════════════════════════════════════════════════════════
// ALERTS SUMMARY REPORT
// ═══════════════════════════════════════════════════════════════

async function generateAlertsSummaryReport(
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  const alerts = await getAllAlerts();
  
  // Filter by date range
  const periodAlerts = alerts.filter(a => {
    const alertDate = new Date(a.createdAt);
    return alertDate >= startDate && alertDate <= endDate;
  });
  
  const summary: ReportData['summary'] = [
    {
      label: 'Total Alerts',
      value: periodAlerts.length,
      format: 'number'
    },
    {
      label: 'Critical',
      value: periodAlerts.filter(a => a.severity === 'critical').length,
      format: 'number'
    },
    {
      label: 'High Priority',
      value: periodAlerts.filter(a => a.severity === 'high').length,
      format: 'number'
    },
    {
      label: 'Resolved',
      value: periodAlerts.filter(a => a.status === 'resolved').length,
      format: 'number'
    }
  ];
  
  const charts = [
    {
      id: 'alerts_by_severity',
      title: 'Alerts by Severity',
      type: 'pie' as const,
      data: [
        { label: 'Critical', value: periodAlerts.filter(a => a.severity === 'critical').length },
        { label: 'High', value: periodAlerts.filter(a => a.severity === 'high').length },
        { label: 'Medium', value: periodAlerts.filter(a => a.severity === 'medium').length },
        { label: 'Low', value: periodAlerts.filter(a => a.severity === 'low').length }
      ]
    }
  ];
  
  const tables = [
    {
      id: 'top_alerts',
      title: 'Top Active Alerts',
      headers: ['Title', 'Severity', 'Category', 'Created', 'Status'],
      rows: periodAlerts.slice(0, 20).map(a => [
        a.title,
        a.severity,
        a.category,
        new Date(a.createdAt).toLocaleDateString('pt-BR'),
        a.status
      ])
    }
  ];
  
  return {
    reportId: `alt_${Date.now()}`,
    reportType: 'alerts_summary',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables,
    insights: [],
    rawData: { alerts: periodAlerts }
  };
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM REPORT
// ═══════════════════════════════════════════════════════════════

async function generateCustomReport(
  config: ReportConfig,
  startDate: Date,
  endDate: Date
): Promise<ReportData> {
  // Custom reports use config.sections to determine what to include
  const summary: ReportData['summary'] = [];
  const charts: ReportData['charts'] = [];
  const tables: ReportData['tables'] = [];
  
  // Fetch data based on selected metrics
  const dataSources: Record<string, any> = {};
  
  if (config.metrics.some(m => m.startsWith('mrr') || m.startsWith('arr'))) {
    dataSources.financial = await getFinanceiroDashboard({ dateFrom: startDate, dateTo: endDate });
  }
  
  if (config.metrics.some(m => m.startsWith('pipeline'))) {
    dataSources.pipeline = await getPipelineDashboard({ dateFrom: startDate, dateTo: endDate });
  }
  
  if (config.metrics.some(m => m.startsWith('growth'))) {
    dataSources.growth = await getGrowthDashboard(startDate, endDate);
  }
  
  // Build sections based on config
  for (const section of config.sections) {
    if (section.type === 'kpi') {
      // Add KPI metrics to summary
      summary.push({
        label: section.title,
        value: 0, // Extract from dataSources based on config
        format: 'number'
      });
    } else if (section.type === 'chart') {
      charts.push({
        id: section.id,
        title: section.title,
        type: 'line',
        data: []
      });
    }
  }
  
  return {
    reportId: `cst_${Date.now()}`,
    reportType: 'custom',
    generatedAt: new Date(),
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    charts,
    tables,
    insights: [],
    rawData: dataSources
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function calculateDateRange(
  range: string,
  filters: any
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;
  
  switch (range) {
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    
    case 'last_90_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    
    case 'last_quarter':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    
    case 'custom':
      startDate = filters.customDateFrom ? new Date(filters.customDateFrom) : new Date(now.setDate(now.getDate() - 30));
      endDate.setTime(filters.customDateTo ? new Date(filters.customDateTo).getTime() : endDate.getTime());
      break;
    
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
  }
  
  return { startDate, endDate };
}

function calculateCustomerChange(operational: any): number {
  // Calculate customer growth %
  const current = operational.families.active + operational.professionals.active;
  const previous = operational.families.previous + operational.professionals.previous;
  
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function calculatePipelineChange(pipeline: any): number {
  // Calculate pipeline value change %
  const current = pipeline.metrics.overview.totalValue;
  const previous = pipeline.metrics.overview.previousValue || current;
  
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateOverallHealth(
  operational: any,
  growth: any,
  financial: any,
  pipeline: any
): number {
  // Calculate weighted overall health score (0-100)
  const weights = {
    operational: 0.25,
    growth: 0.25,
    financial: 0.30,
    pipeline: 0.20
  };
  
  const operationalScore = operational.healthScore || 70;
  const growthScore = growth.healthScore || 70;
  const financialScore = financial.healthScore || 70;
  const pipelineScore = pipeline.health?.overallHealth || 70;
  
  return Math.round(
    operationalScore * weights.operational +
    growthScore * weights.growth +
    financialScore * weights.financial +
    pipelineScore * weights.pipeline
  );
}
