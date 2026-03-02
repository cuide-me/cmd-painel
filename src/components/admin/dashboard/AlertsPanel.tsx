/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ALERTS PANEL - Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Painel de alertas operacionais com destaque para jobs sem match
 */

'use client';

import React, { useState } from 'react';
import type { OperationalMetrics, OperationalAlert, AlertSeverity } from '@/services/admin/dashboardV3Types';

interface AlertsPanelProps {
  operational: OperationalMetrics;
  onViewAll?: () => void;
}

const SEVERITY_CONFIG: Record<AlertSeverity, { 
  bg: string; 
  border: string; 
  icon: string; 
  text: string;
  badge: string;
}> = {
  critical: { 
    bg: 'bg-red-50', 
    border: 'border-red-300', 
    icon: '🚨', 
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
  high: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-300', 
    icon: '⚠️', 
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-700',
  },
  medium: { 
    bg: 'bg-amber-50', 
    border: 'border-amber-300', 
    icon: '⚡', 
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    icon: 'ℹ️', 
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
  },
  info: { 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    icon: '📋', 
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600',
  },
};

function AlertItem({ alert, expanded, onToggle }: { 
  alert: OperationalAlert; 
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = SEVERITY_CONFIG[alert.severity];
  
  return (
    <div className={`rounded-lg border-2 ${config.bg} ${config.border} overflow-hidden transition-all`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/30 transition-colors"
      >
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${config.text}`}>{alert.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
              {alert.count}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">{alert.description}</p>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/50">
          {/* Affected items */}
          {alert.affectedItems && alert.affectedItems.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-600 mb-2">Itens afetados:</div>
              <div className="space-y-2">
                {alert.affectedItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white/50 rounded text-sm"
                  >
                    <span className="font-medium text-gray-700">{item.label}</span>
                    {item.metadata && (
                      <span className="text-xs text-gray-500">
                        {item.metadata.region && `${item.metadata.region}`}
                        {item.metadata.hoursWaiting && ` • ${item.metadata.hoursWaiting}h aguardando`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {alert.actions && alert.actions.length > 0 && (
            <div className="mt-4 flex gap-2">
              {alert.actions.map((action, idx) => (
                <a
                  key={idx}
                  href={action.href}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {action.label}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertCounter({ label, count, severity }: { label: string; count: number; severity: AlertSeverity }) {
  const config = SEVERITY_CONFIG[severity];
  if (count === 0) return null;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
      <span>{config.icon}</span>
      <span className={`text-sm font-medium ${config.text}`}>{count}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

export function AlertsPanel({ operational, onViewAll }: AlertsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    operational.alerts.items[0]?.id || null
  );

  const totalAlerts = operational.alerts.critical + operational.alerts.high + 
                      operational.alerts.medium + operational.alerts.low;

  if (totalAlerts === 0) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">✅</span>
          <div>
            <h3 className="text-lg font-semibold text-emerald-800">Tudo em ordem!</h3>
            <p className="text-sm text-emerald-600">Nenhum alerta ativo no momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alertas Ativos</h2>
          <p className="text-sm text-gray-600">{totalAlerts} alertas requerem atenção</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertCounter label="críticos" count={operational.alerts.critical} severity="critical" />
          <AlertCounter label="altos" count={operational.alerts.high} severity="high" />
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {operational.alerts.items.slice(0, 5).map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            expanded={expandedId === alert.id}
            onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
          />
        ))}
      </div>

      {/* View all */}
      {operational.alerts.items.length > 5 && onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-4 w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Ver todos os {operational.alerts.items.length} alertas →
        </button>
      )}
    </div>
  );
}
