/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD STATS COMPONENT
 * ═══════════════════════════════════════════════════════
 * Grid de KPIs principais do dashboard
 */

'use client';

import React from 'react';
import { KpiCard } from './ui';
import { formatCurrencyCompact, formatPercent, formatDateTime } from '@/lib/admin/formatters';
import type { DashboardMetrics } from '@/services/admin/dashboard';

interface DashboardStatsProps {
  metrics: DashboardMetrics;
}

export function DashboardStats({ metrics }: DashboardStatsProps) {
  const lastUpdate = formatDateTime(metrics.timestamp);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Demanda */}
      <KpiCard
        title="Demanda (Famílias)"
        value={metrics.demanda.value}
        unit="famílias"
        status={metrics.demanda.status}
        dataSource="Firebase:jobs"
        lastUpdate={lastUpdate}
        subtitle={`Últimos ${metrics.windowDays} dias`}
      />

      {/* Oferta */}
      <KpiCard
        title="Oferta (Cuidadores)"
        value={metrics.oferta.value}
        unit="cuidadores"
        status={metrics.oferta.status}
        dataSource="Firebase:jobs"
        lastUpdate={lastUpdate}
        subtitle={`Últimos ${metrics.windowDays} dias`}
      />

      {/* Taxa de Match */}
      <KpiCard
        title="Taxa de Match"
        value={formatPercent(metrics.taxaMatch.value)}
        status={metrics.taxaMatch.status}
        dataSource="Firebase:jobs"
        lastUpdate={lastUpdate}
        subtitle="Jobs com profissional atribuído"
      />

      {/* GMV Mensal */}
      <KpiCard
        title="GMV Mensal"
        value={formatCurrencyCompact(metrics.gmvMensal.value)}
        status={metrics.gmvMensal.status}
        dataSource="Stripe:charges"
        lastUpdate={lastUpdate}
        subtitle="Mês atual (charges succeeded)"
      />

      {/* Ticket Médio */}
      <KpiCard
        title="Ticket Médio"
        value={formatCurrencyCompact(metrics.ticketMedio.value)}
        dataSource="Stripe + Firebase"
        lastUpdate={lastUpdate}
        subtitle="Valor médio por job concluído"
      />

      {/* Jobs Ativos */}
      <KpiCard
        title="Jobs Ativos"
        value={metrics.jobsAtivos.value}
        unit="jobs"
        status={metrics.jobsAtivos.value > 0 ? 'ok' : 'warning'}
        dataSource="Firebase:jobs"
        lastUpdate={lastUpdate}
        subtitle="Pending + Matched + Active"
      />
    </div>
  );
}
