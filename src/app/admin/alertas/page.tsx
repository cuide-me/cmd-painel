'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { Section, Card, Button, Table, LoadingSkeleton, EmptyState, Badge } from '@/components/admin/AdminLayout';
import type { AlertSeverity, AlertStatus, AlertType, AlertsResponse } from '@/services/admin/alerts';

type AlertsFiltersState = {
  severityFilter: AlertSeverity | 'all';
  typeFilter: AlertType | 'all';
  statusFilter: AlertStatus | 'all';
  searchTerm?: string;
};

const severityOrder: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const DEFAULT_FILTERS: AlertsFiltersState = {
  severityFilter: 'all',
  typeFilter: 'all',
  statusFilter: 'all',
  searchTerm: undefined,
};

function getSeverityBadge(severity: AlertSeverity) {
  if (severity === 'critical') return <Badge variant="error">Critico</Badge>;
  if (severity === 'high') return <Badge variant="warning">Alto</Badge>;
  if (severity === 'medium') return <Badge variant="warning">Medio</Badge>;
  if (severity === 'low') return <Badge variant="info">Baixo</Badge>;
  return <Badge variant="info">Info</Badge>;
}

function getFreshnessBadge(status: 'fresh' | 'stale' | 'unavailable') {
  if (status === 'fresh') return <Badge variant="success">Fresh</Badge>;
  if (status === 'stale') return <Badge variant="warning">Stale</Badge>;
  return <Badge variant="error">Unavailable</Badge>;
}

function getStatusBadge(status: AlertStatus) {
  if (status === 'resolved') return <Badge variant="success">Resolvido</Badge>;
  if (status === 'acknowledged') return <Badge variant="info">Reconhecido</Badge>;
  return <Badge variant="error">Aberto</Badge>;
}

export default function AdminAlertasPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);
  const [filters, setFilters] = useState<AlertsFiltersState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('window', String(windowDays));
      if (filters.severityFilter !== 'all') params.set('severity', filters.severityFilter);
      if (filters.typeFilter !== 'all') params.set('type', filters.typeFilter);
      if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
      if (filters.searchTerm) params.set('q', filters.searchTerm);

      const response = await authFetch(`/api/admin/alertas?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao carregar alertas');
      const result: AlertsResponse = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [windowDays, filters]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAlerts();
    }
  }, [authLoading, isAdmin, fetchAlerts]);

  if (authLoading) {
    return (
      <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
        <EmptyState icon="🔒" title="Acesso restrito" description="Voce precisa estar autenticado como admin." />
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Alertas" subtitle="Painel dedicado" icon="🚨">
        <EmptyState icon="⚠" title="Erro ao carregar" description={error || 'Erro desconhecido'} action="Tentar novamente" onAction={fetchAlerts} />
      </AdminLayout>
    );
  }

  const alerts = [...data.items].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    const dateA = new Date(a.lastDetectedAt).getTime();
    const dateB = new Date(b.lastDetectedAt).getTime();
    return dateB - dateA;
  });

  const applySearch = () => {
    setFilters((prev) => ({
      ...prev,
      searchTerm: searchInput.trim() || undefined,
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <AdminLayout title="Alertas" subtitle="Trilha operacional" icon="🚨">
      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <p className="text-slate-500">Total</p>
            <p className="text-lg font-semibold text-slate-900">{data.summary.total}</p>
          </div>
          <div>
            <p className="text-slate-500">Abertos</p>
            <p className="text-lg font-semibold text-red-700">{data.summary.open}</p>
          </div>
          <div>
            <p className="text-slate-500">Criticos</p>
            <p className="text-lg font-semibold text-red-700">{data.summary.bySeverity.critical}</p>
          </div>
          <div>
            <p className="text-slate-500">Ultima atualizacao</p>
            <p className="text-sm font-medium text-slate-900">{new Date(data.timestamp).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value={7}>Janela 7 dias</option>
            <option value={30}>Janela 30 dias</option>
            <option value={90}>Janela 90 dias</option>
          </select>

          <select
            value={filters.severityFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, severityFilter: e.target.value as AlertsFiltersState['severityFilter'] }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value="all">Severidade: todas</option>
            <option value="critical">Critico</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Baixo</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filters.typeFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, typeFilter: e.target.value as AlertsFiltersState['typeFilter'] }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value="all">Tipo: todos</option>
            <option value="liquidity">Liquidez</option>
            <option value="quality">Qualidade</option>
            <option value="support">Suporte</option>
            <option value="financial">Financeiro</option>
            <option value="data">Dados</option>
            <option value="other">Outros</option>
          </select>

          <select
            value={filters.statusFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, statusFilter: e.target.value as AlertsFiltersState['statusFilter'] }))}
            className="px-3 py-2 text-sm border border-slate-300 rounded"
          >
            <option value="all">Status: todos</option>
            <option value="open">Aberto</option>
            <option value="acknowledged">Reconhecido</option>
            <option value="resolved">Resolvido</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applySearch();
              }
            }}
            placeholder="Busca por alerta, item afetado ou contexto"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded"
          />
          <Button variant="secondary" size="sm" onClick={applySearch}>Buscar</Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar</Button>
        </div>
      </Card>

      <Card padding="md" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="border border-slate-200 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600">Jobs</span>
              {getFreshnessBadge(data.freshness.jobs.status)}
            </div>
            <p className="text-xs text-slate-500">{data.freshness.jobs.reason || 'Sem observacoes'}</p>
          </div>
          <div className="border border-slate-200 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600">Tickets</span>
              {getFreshnessBadge(data.freshness.tickets.status)}
            </div>
            <p className="text-xs text-slate-500">{data.freshness.tickets.reason || 'Sem observacoes'}</p>
          </div>
          <div className="border border-slate-200 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600">Stripe</span>
              {getFreshnessBadge(data.freshness.stripe.status)}
            </div>
            <p className="text-xs text-slate-500">{data.freshness.stripe.reason || 'Sem observacoes'}</p>
          </div>
        </div>
      </Card>

      {alerts.length === 0 && (
        <EmptyState icon="✅" title="Nenhum alerta" description="Nao ha alertas para os filtros atuais." />
      )}

      {alerts.map((alert) => (
        <Section key={alert.id} title={alert.title}>
          <Card padding="md" className="mb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900">{alert.title}</div>
                <div className="text-xs text-slate-500">{alert.description || 'Sem descricao'}</div>
                <div className="text-xs text-slate-400 mt-1">Fonte: {alert.source} • Tipo: {alert.type}</div>
                <div className="text-xs text-slate-400 mt-1">Recencia: {new Date(alert.lastDetectedAt).toLocaleString('pt-BR')}</div>
                {alert.actionHint && <div className="text-xs text-slate-500 mt-1">Acao sugerida: {alert.actionHint}</div>}
              </div>
              <div className="flex items-center gap-2">
                {getSeverityBadge(alert.severity)}
                {getStatusBadge(alert.status)}
                <Badge variant="neutral">{alert.count}</Badge>
              </div>
            </div>
          </Card>

          <Table
            headers={['Item afetado', 'Contexto', 'Regiao', 'Ocorrido em', 'Metadata']}
            rows={alert.affectedItems.map((item) => [
              item.label,
              item.context || 'Nao informado',
              item.region || 'Nao informado',
              item.occurredAt ? new Date(item.occurredAt).toLocaleString('pt-BR') : 'Nao informado',
              item.metadata
                ? Object.entries(item.metadata)
                    .map(([k, v]) => `${k}: ${v ?? 'NA'}`)
                    .join(' | ')
                : 'Nao informado',
            ])}
            compact
          />
        </Section>
      ))}
    </AdminLayout>
  );
}
