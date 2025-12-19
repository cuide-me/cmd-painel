/**
 * Pipeline V2 Types
 */

export interface PipelineStage {
  name: string;
  count: number;
  value: number;
  conversionRate?: number;
}

export interface PipelineMetrics {
  stages: PipelineStage[];
  totalLeads: number;
  totalValue: number;
  overallConversionRate: number;
  timestamp: string;
}

export interface PipelineFilters {
  startDate?: string;
  endDate?: string;
  source?: string;
  status?: string;
}
