'use client';

import { useState, useEffect } from 'react';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import { FinanceiroDashboard } from '@/services/admin/financeiro-v2/types';

export default function FinanceiroV2Page() {
  const [dashboard, setDashboard] = useState<FinanceiroDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'mrr' | 'ltv' | 'churn' | 'forecast'>('overview');
  const [segment, setSegment] = useState('all');

  useEffect(() => {
    fetchDashboard();
  }, [segment]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (segment !== 'all') params.append('segment', segment);
      const response = await fetch(`/api/admin/financeiro-v2?${params}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Erro ao carregar');
      setDashboard(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Financeiro V2" subtitle="Sprint 4 - MRR, LTV, Churn" icon="💰">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <AdminLayout title="Financeiro V2" subtitle="Sprint 4 - MRR, LTV, Churn" icon="💰">
        <EmptyState icon="⚠️" title="Erro ao carregar" description={error} action="Tentar novamente" onAction={fetchDashboard} />
      </AdminLayout>
    );
  }

  const mrr = dashboard.mrr;
  const ltv = dashboard.ltv;
  const churn = dashboard.churn;
  const forecast = dashboard.forecast;

  return (
    <AdminLayout title="Financeiro V2" subtitle="Sprint 4 - MRR, LTV, Churn, Forecast" icon="💰">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="MRR"
          value={`R$ ${(mrr.current / 1000).toFixed(0)}k`}
          icon="💵"
          trend={mrr.growth > 0 ? 'up' : 'down'}
          change={mrr.growth}
        />
        <StatCard
          label="ARR"
          value={`R$ ${(mrr.arr / 1000).toFixed(0)}k`}
          icon="📊"
          trend="up"
          change={mrr.growth * 12}
        />
        <StatCard
          label="LTV Médio"
          value={`R$ ${(ltv.average / 1000).toFixed(1)}k`}
          icon="💎"
        />
        <StatCard
          label="Churn Rate"
          value={`${churn.rate.toFixed(1)}%`}
          icon="📉"
          trend={churn.rate < 5 ? 'up' : 'down'}
          change={-churn.rate}
        />
      </div>

      {/* Segment Filter */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600">Segmento:</span>
          <div className="flex gap-2">
            {['all', 'enterprise', 'smb', 'individual'].map(seg => (
              <button
                key={seg}
                onClick={() => setSegment(seg)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  segment === seg
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {seg === 'all' ? 'Todos' : seg.charAt(0).toUpperCase() + seg.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card padding="none" className="mb-6">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'mrr', label: 'MRR Analysis', icon: '💵' },
            { id: 'ltv', label: 'LTV', icon: '💎' },
            { id: 'churn', label: 'Churn', icon: '📉' },
            { id: 'forecast', label: 'Forecast', icon: '🔮' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedView === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Overview */}
      {selectedView === 'overview' && (
        <>
          <Section title="Resumo Financeiro">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Clientes Ativos</p>
                <p className="text-2xl font-bold text-slate-900">{dashboard.activeCustomers}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Receita Total (30d)</p>
                <p className="text-2xl font-bold text-slate-900">R$ {(dashboard.totalRevenue / 1000).toFixed(0)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Ticket Médio</p>
                <p className="text-2xl font-bold text-slate-900">R$ {dashboard.averageTicket.toFixed(0)}</p>
              </Card>
            </div>
          </Section>

          <Section title="Tendências">
            <Card padding="md">
              <div className="space-y-3">
                {forecast.trends.map((trend: any, i: number) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{trend.metric}</p>
                      <p className="text-xs text-slate-600">{trend.description}</p>
                    </div>
                    <Badge variant={trend.status === 'positive' ? 'success' : trend.status === 'negative' ? 'error' : 'warning'}>
                      {trend.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </>
      )}

      {/* MRR Details */}
      {selectedView === 'mrr' && (
        <>
          <Section title="MRR Breakdown">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Novo MRR</p>
                <p className="text-xl font-bold text-green-600">+R$ {(mrr.new / 1000).toFixed(1)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Expansion MRR</p>
                <p className="text-xl font-bold text-blue-600">+R$ {(mrr.expansion / 1000).toFixed(1)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Contraction MRR</p>
                <p className="text-xl font-bold text-orange-600">-R$ {(mrr.contraction / 1000).toFixed(1)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Churned MRR</p>
                <p className="text-xl font-bold text-red-600">-R$ {(mrr.churned / 1000).toFixed(1)}k</p>
              </Card>
            </div>
          </Section>

          <Section title="Movimentação Mensal">
            <Table
              headers={['Mês', 'Início', 'Novo', 'Expansion', 'Churn', 'Final', 'Growth']}
              data={mrr.monthlyData?.slice(0, 12).map((m: any) => [
                m.month,
                `R$ ${(m.start / 1000).toFixed(0)}k`,
                `R$ ${(m.new / 1000).toFixed(0)}k`,
                `R$ ${(m.expansion / 1000).toFixed(0)}k`,
                `R$ ${(m.churn / 1000).toFixed(0)}k`,
                `R$ ${(m.end / 1000).toFixed(0)}k`,
                `${m.growth > 0 ? '+' : ''}${m.growth.toFixed(1)}%`
              ]) || []}
              compact
            />
          </Section>
        </>
      )}

      {/* LTV Details */}
      {selectedView === 'ltv' && (
        <>
          <Section title="LTV por Segmento">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ltv.bySegment?.map((seg: any, i: number) => (
                <Card key={i} padding="md">
                  <p className="text-xs text-slate-600 mb-1">{seg.segment}</p>
                  <p className="text-2xl font-bold text-slate-900">R$ {(seg.value / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-slate-600 mt-2">CAC: R$ {seg.cac.toFixed(0)}</p>
                  <p className="text-xs font-medium text-green-600">Ratio: {seg.ltvCacRatio.toFixed(1)}x</p>
                </Card>
              )) || []}
            </div>
          </Section>
        </>
      )}

      {/* Churn Details */}
      {selectedView === 'churn' && (
        <>
          <Section title="Análise de Churn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Churn Rate</p>
                <p className="text-2xl font-bold text-slate-900">{churn.rate.toFixed(2)}%</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Clientes Perdidos</p>
                <p className="text-2xl font-bold text-slate-900">{churn.customersLost}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">MRR Perdido</p>
                <p className="text-2xl font-bold text-red-600">R$ {(churn.mrrLost / 1000).toFixed(0)}k</p>
              </Card>
            </div>
          </Section>

          <Section title="Motivos de Churn">
            <Table
              headers={['Motivo', 'Quantidade', 'MRR Impacto', '%']}
              data={churn.reasons?.map((r: any) => [
                r.reason,
                r.count,
                `R$ ${(r.mrrImpact / 1000).toFixed(1)}k`,
                `${r.percentage.toFixed(1)}%`
              ]) || []}
              compact
            />
          </Section>
        </>
      )}

      {/* Forecast */}
      {selectedView === 'forecast' && (
        <>
          <Section title="Projeção de Receita (12 meses)">
            <Table
              headers={['Mês', 'MRR Projetado', 'Novos Clientes', 'Churn Estimado', 'Confiança']}
              data={forecast.months?.slice(0, 12).map((m: any) => [
                m.month,
                `R$ ${(m.projected / 1000).toFixed(0)}k`,
                m.newCustomers,
                `${m.churnRate.toFixed(1)}%`,
                `${m.confidence}%`
              ]) || []}
              compact
            />
          </Section>

          <Section title="Cenários">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {forecast.scenarios?.map((scenario: any, i: number) => (
                <Card key={i} padding="md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900">{scenario.name}</p>
                    <Badge variant={scenario.type === 'optimistic' ? 'success' : scenario.type === 'pessimistic' ? 'error' : 'info'}>
                      {scenario.type}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-1">R$ {(scenario.value / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-slate-600">{scenario.description}</p>
                </Card>
              )) || []}
            </div>
          </Section>
        </>
      )}
    </AdminLayout>
  );
}
