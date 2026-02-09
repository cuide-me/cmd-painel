/**
 * Types for Alerts module
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertItem {
  id: string;
  label: string;
  description?: string;
  metadata?: Record<string, string | number | null | undefined>;
}

export interface AlertGroup {
  id: string;
  title: string;
  severity: AlertSeverity;
  source: string;
  description?: string;
  count: number;
  items: AlertItem[];
}

export interface AlertsResponse {
  windowDays: number;
  alerts: AlertGroup[];
  timestamp: string;
}
