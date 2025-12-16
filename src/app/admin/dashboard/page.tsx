'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Button, LoadingSkeleton } from '@/components/admin/AdminLayout';
import DashboardFilters from '@/components/admin/v2/DashboardFilters';
import FamiliesBlock from '@/components/admin/v2/FamiliesBlock';
import ProfessionalsBlock from '@/components/admin/v2/ProfessionalsBlock';
import FinanceBlock from '@/components/admin/v2/FinanceBlock';
import type { DashboardData, DashboardFilterPreset, DashboardDateGrouping } from '@/services/admin/dashboard';

export default function AdminDashboardV2() {
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [filters, setFilters] = useState<{
    preset: DashboardFilterPreset;
    grouping: DashboardDateGrouping;
    startDate?: Date;
    endDate?: Date;
  }>({
    preset: 'this_month',
    grouping: 'day',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('preset', filters.preset);
      params.set('grouping', filters.grouping);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());

      const response = await authFetch(`/api/admin/dashboard-v2?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar dados');

      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!authReady) return;
    fetchData();
  }, [authReady, filters, fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 300000); // 5 min
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading && !data) {
    return (
      <AdminLayout title="Dashboard V2" subtitle="Visão Integrada" icon="📱">
        <LoadingSkeleton lines={6} />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Dashboard V2" subtitle="Visão Integrada" icon="📱">
        <Card padding="lg">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm text-slate-600 mb-4">{error || 'Erro ao carregar'}</p>
            <Button variant="primary" onClick={fetchData}>Tentar Novamente</Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard V2" subtitle="Visão Integrada" icon="📱">
      {/* Filters */}
      <Card padding="md" className="mb-6">
        <DashboardFilters
          onFilterChange={(newFilters) => setFilters(f => ({ ...f, ...newFilters }))}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Atualizado: {lastUpdate?.toLocaleTimeString('pt-BR') || '-'}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (5min)
          </label>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Famílias Ativas"
          value={data.families.metrics.totalActive}
          icon="👨‍👩‍👧‍👦"
          trend={data.families.metrics.growthRate > 0 ? 'up' : 'down'}
          change={data.families.metrics.growthRate}
        />
        <StatCard
          label="Profissionais Ativos"
          value={data.professionals.metrics.totalActive}
          icon="👨‍⚕️"
          trend={data.professionals.metrics.growthRate > 0 ? 'up' : 'down'}
          change={data.professionals.metrics.growthRate}
        />
        <StatCard
          label="MRR Total"
          value={`R$ ${(data.finance.metrics.mrr / 1000).toFixed(0)}k`}
          icon="💰"
          trend={data.finance.metrics.mrrGrowthRate > 0 ? 'up' : 'down'}
          change={data.finance.metrics.mrrGrowthRate}
        />
        <StatCard
          label="Churn Rate"
          value={`${data.finance.metrics.churnRate.toFixed(1)}%`}
          icon="📉"
          trend={data.finance.metrics.churnRate < 5 ? 'up' : 'down'}
          change={-data.finance.metrics.churnRate}
        />
      </div>

      {/* Main Content Blocks */}
      <Section title="Famílias">
        <FamiliesBlock data={data.families} />
      </Section>

      <Section title="Profissionais">
        <ProfessionalsBlock data={data.professionals} />
      </Section>

      <Section title="Financeiro">
        <FinanceBlock data={data.finance} />
      </Section>

      {/* Demanda & Oferta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Demanda">
          <Card padding="md">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Solicitações Ativas:</span>
                <span className="font-semibold text-slate-900">{data.demand.activeRequests}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Taxa de Match:</span>
                <span className="font-semibold text-slate-900">{data.demand.matchRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Tempo Médio:</span>
                <span className="font-semibold text-slate-900">{data.demand.averageMatchTime}h</span>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Oferta">
          <Card padding="md">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Disponibilidade:</span>
                <span className="font-semibold text-slate-900">{data.supply.availability.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Utilização:</span>
                <span className="font-semibold text-slate-900">{data.supply.utilizationRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Capacidade:</span>
                <span className="font-semibold text-slate-900">{data.supply.capacity} slots</span>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </AdminLayout>
  );
}
