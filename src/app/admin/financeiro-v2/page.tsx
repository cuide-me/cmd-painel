'use client';

import { useState, useEffect } from 'react';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import { FinanceiroDashboard } from '@/services/admin/financeiro-v2/types';
import { authFetch } from '@/lib/client/authFetch';

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
      const response = await authFetch(`/api/admin/financeiro-v2?${params}`);
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
        <EmptyState icon="⚠️" title="Erro ao carregar" description={error || 'Erro desconhecido'} action="Tentar novamente" onAction={fetchDashboard} />
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
          value={`R$ ${(mrr.currentMRR / 1000).toFixed(0)}k`}
          icon="💵"
          trend={mrr.mrrGrowthRate > 0 ? 'up' : 'down'}
          change={mrr.mrrGrowthRate}
          tooltip="Monthly Recurring Revenue - Receita recorrente mensal de todas assinaturas ativas do Stripe"
        />
        <StatCard
          label="ARR"
          value={`R$ ${(mrr.currentMRR * 12 / 1000).toFixed(0)}k`}
          icon="📊"
          trend={mrr.mrrGrowthRate > 0 ? 'up' : 'down'}
          change={mrr.mrrGrowthRate}
          tooltip="Annual Recurring Revenue - Projeção anualizada do MRR (MRR × 12 meses)"
        />
        <StatCard
          label="Quick Ratio"
          value={mrr.quickRatio.toFixed(1)}
          icon="⚡"
          tooltip="Razão entre MRR ganho (novo + expansão) e MRR perdido (contração + churn). Acima de 4 é excelente!"
        />
        <StatCard
          label="NRR"
          value={`${mrr.netRevenueRetention.toFixed(0)}%`}
          icon="🔄"
          tooltip="Net Revenue Retention - Percentual de receita retida incluindo expansões. Acima de 100% indica crescimento na base existente"
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
                <p className="text-2xl font-bold text-slate-900">{dashboard.summary.customerCount}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">MRR</p>
                <p className="text-2xl font-bold text-slate-900">R$ {(dashboard.summary.mrr / 1000).toFixed(0)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">ARPU</p>
                <p className="text-2xl font-bold text-slate-900">R$ {dashboard.summary.arpu.toFixed(0)}</p>
              </Card>
            </div>
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
                <p className="text-xl font-bold text-green-600">+R$ {(mrr.newMRR / 1000).toFixed(1)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Expansion MRR</p>
                <p className="text-xl font-bold text-blue-600">+R$ {(mrr.expansionMRR / 1000).toFixed(1)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Contraction MRR</p>
                <p className="text-xl font-bold text-orange-600">-R$ {(mrr.contractionMRR / 1000).toFixed(1)}k</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-slate-600 mb-1">Churned MRR</p>
                <p className="text-xl font-bold text-red-600">-R$ {(mrr.churnedMRR / 1000).toFixed(1)}k</p>
              </Card>
            </div>
          </Section>
        </>
      )}
    </AdminLayout>
  );
}
