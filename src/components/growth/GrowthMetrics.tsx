/**
 * ────────────────────────────────────────────────────────────────────────────
 * GROWTH METRICS - Cards de Métricas de Crescimento
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';
import { MetricCard } from '@/components/shared';

export interface GrowthMetricsProps {
  metrics: {
    cac: { value: number; change: number };
    ltv: { value: number; change: number };
    ltvCacRatio: { value: number; change: number };
    paybackPeriod: { value: number; change: number };
  };
  loading?: boolean;
}

export function GrowthMetrics({ metrics, loading = false }: GrowthMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="CAC (Custo de Aquisição)"
        value={`R$ ${metrics.cac.value.toFixed(0)}`}
        subtitle="Por cliente"
        change={{
          value: Math.abs(metrics.cac.change),
          label: 'vs mês anterior',
          isPositive: metrics.cac.change < 0, // Lower is better
        }}
        icon={<span className="text-xl">💸</span>}
        color={metrics.cac.value < 50 ? 'green' : metrics.cac.value < 100 ? 'yellow' : 'red'}
        loading={loading}
      />

      <MetricCard
        title="LTV (Valor do Cliente)"
        value={`R$ ${metrics.ltv.value.toFixed(0)}`}
        subtitle="Lifetime value"
        change={{
          value: metrics.ltv.change,
          label: 'vs mês anterior',
          isPositive: metrics.ltv.change > 0,
        }}
        icon={<span className="text-xl">💎</span>}
        color="blue"
        loading={loading}
      />

      <MetricCard
        title="LTV/CAC Ratio"
        value={`${metrics.ltvCacRatio.value.toFixed(1)}x`}
        subtitle="Retorno sobre aquisição"
        change={{
          value: metrics.ltvCacRatio.change,
          label: 'vs mês anterior',
          isPositive: metrics.ltvCacRatio.change > 0,
        }}
        icon={<span className="text-xl">📊</span>}
        color={
          metrics.ltvCacRatio.value > 3
            ? 'green'
            : metrics.ltvCacRatio.value > 2
            ? 'yellow'
            : 'red'
        }
        loading={loading}
      />

      <MetricCard
        title="Payback Period"
        value={`${metrics.paybackPeriod.value.toFixed(1)} meses`}
        subtitle="Tempo de retorno"
        change={{
          value: Math.abs(metrics.paybackPeriod.change),
          label: 'vs mês anterior',
          isPositive: metrics.paybackPeriod.change < 0, // Lower is better
        }}
        icon={<span className="text-xl">⏱️</span>}
        color={
          metrics.paybackPeriod.value < 6
            ? 'green'
            : metrics.paybackPeriod.value < 12
            ? 'yellow'
            : 'red'
        }
        loading={loading}
      />
    </div>
  );
}
