/**
 * Types for Alerts module
 */

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';
export type AlertType = 'liquidity' | 'quality' | 'support' | 'financial' | 'data' | 'other';
export type AlertSource = 'jobs' | 'tickets' | 'stripe';

export interface AlertAffectedItem {
  id: string;
  label: string;
  context?: string;
  region?: string;
  occurredAt?: string;
  metadata?: Record<string, string | number | null | undefined>;
}

export interface OperationalAlert {
  id: string;
  type: AlertType;
  status: AlertStatus;
  title: string;
  severity: AlertSeverity;
  source: AlertSource;
  description?: string;
  count: number;
  affectedItems: AlertAffectedItem[];
  firstDetectedAt?: string;
  lastDetectedAt: string;
  updatedAt: string;
  actionHint?: string;
}

export interface AlertsFreshness {
  source: AlertSource;
  status: 'fresh' | 'stale' | 'unavailable';
  lastSuccessAt?: string;
  delayMinutes?: number;
  reason?: string;
}

export interface AlertsFilters {
  severityFilter: AlertSeverity | 'all';
  typeFilter: AlertType | 'all';
  statusFilter: AlertStatus | 'all';
  searchTerm?: string;
}

export interface AlertsSummary {
  total: number;
  open: number;
  bySeverity: Record<AlertSeverity, number>;
  byType: Record<AlertType, number>;
}

export interface AlertsResponse {
  windowDays: number;
  timestamp: string;
  freshness: {
    jobs: AlertsFreshness;
    tickets: AlertsFreshness;
    stripe: AlertsFreshness;
  };
  filtersApplied: AlertsFilters;
  summary: AlertsSummary;
  items: OperationalAlert[];
}

export interface ListAlertsParams extends Partial<AlertsFilters> {
  windowDays?: number;
}
