/**
 * Types for Funnel module
 */

export interface FunnelStage {
  id: string;
  label: string;
  source: string;
  description?: string;
  value: number | null;
  available: boolean;
  missingReason?: string;
  conversionFromPrev?: number | null;
  dropOff?: number | null;
}

export interface FunnelMetrics {
  windowDays: number;
  stages: FunnelStage[];
  timestamp: string;
}
