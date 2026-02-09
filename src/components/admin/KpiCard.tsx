/**
 * ═══════════════════════════════════════════════════════
 * COMPONENTE - KPI Card
 * ═══════════════════════════════════════════════════════
 */

import React from 'react';
import type { KpiCard } from '@/services/admin/torreDeControleTypes';
import { StatusPill, TrendIndicator, Badge } from './StatusPill';

interface KpiCardProps {
  kpi: KpiCard;
  onClick?: () => void;
}

export function KpiCardComponent({ kpi, onClick }: KpiCardProps) {
  const hasClickAction = Boolean(onClick || kpi.breakdown?.length);
  
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${
        hasClickAction ? 'cursor-pointer hover:border-blue-400 hover:shadow-md transition-all' : ''
      }`}
      onClick={onClick}
      role={hasClickAction ? 'button' : undefined}
      tabIndex={hasClickAction ? 0 : undefined}
      aria-label={`${kpi.title}: ${kpi.value}${kpi.unit ? ' ' + kpi.unit : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
        {kpi.status && <StatusPill status={kpi.status} />}
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-gray-900">
          {kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-sm text-gray-500">{kpi.unit}</span>
        )}
      </div>

      {/* Trend */}
      {kpi.trend && (
        <div className="mb-3">
          <TrendIndicator trend={kpi.trend} value={kpi.change} />
        </div>
      )}

      {/* Sub-métricas */}
      {kpi.subMetrics && kpi.subMetrics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {kpi.subMetrics.map((sub, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{sub.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {sub.value}
                  {sub.unit && ` ${sub.unit}`}
                </span>
                {sub.badge && <Badge label={sub.badge} variant="warning" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador de drill-down */}
      {hasClickAction && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-blue-600 font-medium">
            Ver detalhes por região →
          </span>
        </div>
      )}
    </div>
  );
}
