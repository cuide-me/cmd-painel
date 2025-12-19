/**
 * ────────────────────────────────────────────────────────────────────────────
 * NORTH STAR METRICS - KPIs Principais
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';
import { MetricCard } from '@/components/shared';

export interface NorthStarMetricsProps {
  metrics: {
    mrr: { value: number; change: number };
    activeUsers: { value: number; change: number };
    nps: { value: number; change: number };
    churnRate: { value: number; change: number };
  };
  loading?: boolean;
}

export function NorthStarMetrics({ metrics, loading = false }: NorthStarMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="MRR (Receita Recorrente)"
        value={`R$ ${(metrics.mrr.value / 1000).toFixed(0)}k`}
        change={{
          value: metrics.mrr.change,
          label: 'vs mês anterior',
          isPositive: metrics.mrr.change > 0,
        }}
        icon={<span className="text-xl">💰</span>}
        color="green"
        loading={loading}
      />

      <MetricCard
        title="Usuários Ativos"
        value={metrics.activeUsers.value.toLocaleString('pt-BR')}
        change={{
          value: metrics.activeUsers.change,
          label: 'vs mês anterior',
          isPositive: metrics.activeUsers.change > 0,
        }}
        icon={<span className="text-xl">👥</span>}
        color="blue"
        loading={loading}
      />

      <MetricCard
        title="NPS Score"
        value={metrics.nps.value.toFixed(0)}
        subtitle="Net Promoter Score"
        change={{
          value: Math.abs(metrics.nps.change),
          label: 'vs trimestre anterior',
          isPositive: metrics.nps.change > 0,
        }}
        icon={<span className="text-xl">⭐</span>}
        color={metrics.nps.value > 50 ? 'green' : metrics.nps.value > 30 ? 'yellow' : 'red'}
        loading={loading}
      />

      <MetricCard
        title="Taxa de Churn"
        value={`${metrics.churnRate.value.toFixed(1)}%`}
        subtitle="Cancelamentos mensais"
        change={{
          value: Math.abs(metrics.churnRate.change),
          label: 'vs mês anterior',
          isPositive: metrics.churnRate.change < 0, // Lower is better
        }}
        icon={<span className="text-xl">📉</span>}
        color={metrics.churnRate.value < 3 ? 'green' : metrics.churnRate.value < 5 ? 'yellow' : 'red'}
        loading={loading}
      />
    </div>
  );
}
