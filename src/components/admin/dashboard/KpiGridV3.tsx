/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KPI GRID V3 - Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Grid de KPIs principais com trends e sparklines
 */

'use client';

import React from 'react';
import type { 
  LiquidityMetrics, 
  FinancialMetrics, 
  QualityMetrics,
  TrendDirection 
} from '@/services/admin/dashboardV3Types';

interface KpiGridProps {
  liquidity: LiquidityMetrics;
  financial: FinancialMetrics;
  quality: QualityMetrics;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: TrendDirection;
  changePercent?: number;
  subMetrics?: Array<{ label: string; value: string | number; unit?: string }>;
  status?: 'ok' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

const TrendBadge = ({ direction, value }: { direction: TrendDirection; value?: number }) => {
  const config = {
    up: { icon: '↑', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    down: { icon: '↓', bg: 'bg-red-100', text: 'text-red-700' },
    stable: { icon: '→', bg: 'bg-gray-100', text: 'text-gray-600' },
  };
  const c = config[direction];
  
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.icon}
      {value !== undefined && ` ${Math.abs(value).toFixed(1)}%`}
    </span>
  );
};

function MetricCard({ title, value, unit, trend, changePercent, subMetrics, status, icon }: MetricCardProps) {
  const statusColors = {
    ok: 'border-emerald-200 bg-emerald-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    critical: 'border-red-200 bg-red-50/50',
  };

  return (
    <div className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${
      status ? statusColors[status] : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>

      {/* Trend */}
      {trend && (
        <div className="mb-3">
          <TrendBadge direction={trend} value={changePercent} />
        </div>
      )}

      {/* Sub metrics */}
      {subMetrics && subMetrics.length > 0 && (
        <div className="pt-3 border-t border-gray-100 space-y-1.5">
          {subMetrics.map((sub, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-gray-500">{sub.label}</span>
              <span className="font-medium text-gray-700">
                {sub.value}{sub.unit && ` ${sub.unit}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export function KpiGridV3({ liquidity, financial, quality }: KpiGridProps) {
  // Determinar status baseado em thresholds
  const matchTimeStatus = liquidity.avgMatchTime.hours > 48 ? 'critical' : 
                          liquidity.avgMatchTime.hours > 24 ? 'warning' : 'ok';
  const cancelStatus = quality.cancellations.rate > 20 ? 'critical' :
                       quality.cancellations.rate > 10 ? 'warning' : 'ok';
  const ratingStatus = quality.avgRating.overall < 3.5 ? 'critical' :
                       quality.avgRating.overall < 4.0 ? 'warning' : 'ok';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Liquidez */}
      <MetricCard
        title="Famílias Ativas"
        value={liquidity.activeFamilies.count}
        unit="famílias"
        trend={liquidity.activeFamilies.trend}
        changePercent={liquidity.activeFamilies.changePercent}
        subMetrics={[
          { label: 'Top região', value: liquidity.activeFamilies.byRegion[0]?.label || 'N/A' },
        ]}
        icon={
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      <MetricCard
        title="Cuidadores Ativos"
        value={liquidity.activeCaregivers.count}
        unit="cuidadores"
        trend={liquidity.activeCaregivers.trend}
        changePercent={liquidity.activeCaregivers.changePercent}
        subMetrics={[
          { label: 'Disponibilidade', value: liquidity.activeCaregivers.availabilityRate, unit: '%' },
        ]}
        icon={
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
      />

      <MetricCard
        title="Taxa de Match"
        value={liquidity.matchRate.percent.toFixed(1)}
        unit="%"
        trend={liquidity.matchRate.trend}
        changePercent={liquidity.matchRate.changePercent}
        status={liquidity.matchRate.percent < 60 ? 'warning' : 'ok'}
        subMetrics={[
          { label: 'Ratio D/O', value: liquidity.demandSupplyRatio.overall.toFixed(2) },
        ]}
        icon={
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <MetricCard
        title="Tempo Médio Match"
        value={liquidity.avgMatchTime.hours.toFixed(0)}
        unit="horas"
        trend={liquidity.avgMatchTime.trend}
        changePercent={liquidity.avgMatchTime.changePercent}
        status={matchTimeStatus}
        subMetrics={[
          { label: 'P90', value: liquidity.avgMatchTime.percentiles.p90.toFixed(0), unit: 'h' },
        ]}
        icon={
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Financeiro */}
      <MetricCard
        title="GMV (MTD)"
        value={formatCurrency(financial.gmv.mtd)}
        trend={financial.gmv.trend}
        changePercent={financial.gmv.changePercent}
        subMetrics={[
          { label: 'Projeção', value: formatCurrency(financial.gmv.projection.estimated) },
          { label: 'Mês anterior', value: formatCurrency(financial.gmv.lastMonth) },
        ]}
        icon={
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <MetricCard
        title="Ticket Médio"
        value={formatCurrency(financial.avgTicket.value)}
        trend={financial.avgTicket.trend}
        changePercent={financial.avgTicket.changePercent}
        icon={
          <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        }
      />

      {/* Qualidade */}
      <MetricCard
        title="Avaliação Média"
        value={quality.avgRating.overall.toFixed(1)}
        unit="★"
        trend={quality.avgRating.trend}
        changePercent={quality.avgRating.changePercent}
        status={ratingStatus}
        subMetrics={[
          { label: '5 estrelas', value: quality.avgRating.distribution.stars5 },
          { label: 'Total avaliações', value: Object.values(quality.avgRating.distribution).reduce((a, b) => a + b, 0) },
        ]}
        icon={
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
      />

      <MetricCard
        title="Taxa Cancelamento"
        value={quality.cancellations.rate.toFixed(1)}
        unit="%"
        trend={quality.cancellations.trend}
        changePercent={quality.cancellations.changePercent}
        status={cancelStatus}
        subMetrics={[
          { label: 'Por família', value: quality.cancellations.byInitiator.family },
          { label: 'Por cuidador', value: quality.cancellations.byInitiator.caregiver },
        ]}
        icon={
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      />
    </div>
  );
}
