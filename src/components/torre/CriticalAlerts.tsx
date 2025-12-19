/**
 * ────────────────────────────────────────────────────────────────────────────
 * CRITICAL ALERTS - Alertas em Destaque
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';
import { AlertBanner } from '@/components/shared';

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category: string;
  module: string;
}

export interface CriticalAlertsProps {
  alerts: Alert[];
  loading?: boolean;
  onAlertClick?: (alert: Alert) => void;
}

export function CriticalAlerts({ 
  alerts, 
  loading = false,
  onAlertClick,
}: CriticalAlertsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Alertas Críticos</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 bg-gray-50 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show top 5 critical/high alerts
  const criticalAlerts = alerts
    .filter(a => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 5);

  if (criticalAlerts.length === 0) {
    return (
      <div className="border rounded-lg p-8 bg-green-50 border-green-200 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Tudo funcionando perfeitamente!
        </h3>
        <p className="text-sm text-green-700">
          Nenhum alerta crítico no momento. Continue o ótimo trabalho!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Alertas Críticos
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({criticalAlerts.length} ativos)
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {criticalAlerts.map((alert) => (
          <AlertBanner
            key={alert.id}
            severity={alert.severity}
            title={`[${alert.module}] ${alert.title}`}
            message={alert.message}
            action={
              onAlertClick
                ? {
                    label: 'Ver detalhes →',
                    onClick: () => onAlertClick(alert),
                  }
                : undefined
            }
          />
        ))}
      </div>

      {alerts.length > criticalAlerts.length && (
        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todos os {alerts.length} alertas →
          </button>
        </div>
      )}
    </div>
  );
}
