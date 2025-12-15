/**
 * ────────────────────────────────────
 * COMPONENTE: KPI Card
 * ────────────────────────────────────
 * Card visual para exibir KPIs com status e trend
 */

import type { Kpi } from '@/services/admin/torre/types';

interface KpiCardProps {
  kpi: Kpi;
  onClick?: () => void;
}

export default function KpiCard({ kpi, onClick }: KpiCardProps) {
  const statusColors = {
    healthy: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
  };

  const statusIndicators = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${statusColors[kpi.status]}
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
      `}
      onClick={onClick}
      title={kpi.tooltip}
    >
      {/* Status indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusIndicators[kpi.status]}`} />

      {/* Label */}
      <div className="text-sm font-medium opacity-80 mb-1">
        {kpi.label}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">
          {kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-sm opacity-70">
            {kpi.unit}
          </span>
        )}
      </div>

      {/* Trend */}
      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendColors[kpi.trend]}`}>
        <span className="text-lg">{trendIcons[kpi.trend]}</span>
        {kpi.trendValue !== undefined && (
          <span>{Math.abs(kpi.trendValue)}%</span>
        )}
      </div>

      {/* Actionable info */}
      <div className="mt-3 pt-3 border-t border-current opacity-60 text-xs">
        {kpi.actionable}
      </div>
    </div>
  );
}
