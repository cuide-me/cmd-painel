/**
 * ═══════════════════════════════════════════════════════
 * KPI CARD COMPONENT
 * ═══════════════════════════════════════════════════════
 * Card para exibir métricas principais do dashboard
 */

import React from 'react';
import { adminTheme, getStatusColors, getTrendIcon, getTrendColor } from '@/lib/admin/designSystem';

export interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'ok' | 'warning' | 'critical' | 'info';
  subtitle?: string;
  dataSource: string;
  lastUpdate?: string;
  onClick?: () => void;
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  status = 'info',
  subtitle,
  dataSource,
  lastUpdate,
  onClick,
  loading = false,
}: KpiCardProps) {
  const statusColors = getStatusColors(status);
  const isClickable = !!onClick;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border-l-4 ${statusColors.border} p-6 animate-pulse`}>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border-l-4 
        ${statusColors.border}
        ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}
        p-6
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Título */}
      <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
        {title}
      </h3>

      {/* Valor Principal */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-bold text-gray-900">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Trend (se existir) */}
      {trend && trendValue !== undefined && (
        <div className="flex items-center gap-1 mb-2">
          <span className={`font-semibold ${getTrendColor(trend)}`}>
            {getTrendIcon(trend)} {Math.abs(trendValue)}%
          </span>
          <span className="text-xs text-gray-500">vs período anterior</span>
        </div>
      )}

      {/* Subtitle (contexto adicional) */}
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2 mb-3">
          {subtitle}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 my-4"></div>

      {/* Metadata (fonte e última atualização) */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span title="Fonte dos dados">
          📊 {dataSource}
        </span>
        {lastUpdate && (
          <span title="Última atualização">
            🕐 {lastUpdate}
          </span>
        )}
      </div>
    </div>
  );
}
