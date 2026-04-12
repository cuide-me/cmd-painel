export type TimeWindow = 7 | 14 | 30 | 60 | 90;
export type DataSourceKey = 'ga4' | 'firebase' | 'stripe';
export type HealthStatus = 'ok' | 'warning' | 'critical' | 'info';

export interface SourceFreshness {
  source: DataSourceKey;
  status: 'fresh' | 'stale' | 'unavailable';
  lastSuccessAt: string | null;
  reason: string | null;
}

export interface MetricComparison {
  previousValue: number | null;
  changePercent: number | null;
  direction: 'up' | 'down' | 'stable';
}

export interface DashboardMetric {
  id: string;
  label: string;
  technicalName?: string;
  value: number | string | null;
  unit?: '%' | 'h' | 'BRL';
  status: HealthStatus;
  source: DataSourceKey[];
  scope: 'executivo' | 'operacional' | 'diagnostico';
  definition: string;
  businessGoal: string;
  decision: string;
  expectedAction: string;
  note?: string;
  comparison?: MetricComparison;
}

export interface FunnelStep {
  id: string;
  label: string;
  technicalNames: string[];
  value: number | null;
  source: DataSourceKey[];
  conversionFromPrevious: number | null;
  conversionFromStart: number | null;
  note?: string;
}

export interface Bottleneck {
  id: string;
  label: string;
  volume: number;
  description: string;
  expectedAction: string;
  source: DataSourceKey[];
  status: HealthStatus;
}

export interface RegionSnapshot {
  region: string;
  cidade?: string;
  estado?: string;
  requestsCreated: number;
  requestsWithoutProposal: number;
  matchedJobs: number;
  completedJobs: number;
  withoutProposalRate: number | null;
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source: DataSourceKey[];
  expectedAction: string;
  metricId?: string;
}

export interface KpiDashboardResponse {
  timestamp: string;
  window: TimeWindow;
  cached: boolean;
  freshness: Record<DataSourceKey, SourceFreshness>;
  executive: {
    metrics: DashboardMetric[];
  };
  funnel: {
    steps: FunnelStep[];
    summary: string;
  };
  operationalHealth: {
    metrics: DashboardMetric[];
    bottlenecks: Bottleneck[];
  };
  liquidity: {
    metrics: DashboardMetric[];
    regions: RegionSnapshot[];
  };
  trust: {
    metrics: DashboardMetric[];
  };
  alerts: {
    items: AlertItem[];
  };
  taxonomy: {
    friendlyLabels: Array<{
      technicalName: string;
      label: string;
      description: string;
    }>;
    legacyRenames: Array<{
      oldName: string;
      newName: string;
      reason: string;
    }>;
  };
  dataQuality: {
    historyNote: string;
    limitations: string[];
  };
}
