'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import type { KpiDashboardResponse } from '@/services/admin/kpiDashboardTypes';
import type { AlertSeverity, AlertsResponse } from '@/services/admin/alerts';
import { AlertSummaryCard, AlertsExecutiveSummary } from '@/modules/alerts/components/AlertsExecutiveSummary';
import { AlertsFiltersPanel, type AlertsFiltersState } from '@/modules/alerts/components/AlertsFiltersPanel';
import { AffectedItemsList, DashboardAlertsList, OperationalAlertsList } from '@/modules/alerts/components/AlertsResults';

const DEFAULT_FILTERS: AlertsFiltersState = {
  severityFilter: 'all',
  typeFilter: 'all',
  statusFilter: 'all',
  searchTerm: undefined,
};

const severityOrder: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function freshnessClass(status: 'fresh' | 'stale' | 'unavailable') {
  if (status === 'fresh') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'stale') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sem registro';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem registro';
  return parsed.toLocaleString('pt-BR');
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
    </div>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AdminAlertasPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<KpiDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);
  const [filters, setFilters] = useState<AlertsFiltersState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('window', String(windowDays));
      if (filters.severityFilter !== 'all') params.set('severity', filters.severityFilter);
      if (filters.typeFilter !== 'all') params.set('type', filters.typeFilter);
      if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
      if (filters.searchTerm) params.set('q', filters.searchTerm);

      const [alertsResponse, dashboardResponse] = await Promise.all([
        authFetch(`/api/admin/alertas?${params.toString()}`),
        authFetch(`/api/admin/dashboard-v3?window=${windowDays}`),
      ]);

      if (!alertsResponse.ok) throw new Error('Erro ao carregar alertas operacionais');
      if (!dashboardResponse.ok) throw new Error('Erro ao carregar alertas da home');

      const [alertsPayload, dashboardPayload]: [AlertsResponse, KpiDashboardResponse] = await Promise.all([
        alertsResponse.json(),
        dashboardResponse.json(),
      ]);

      setAlertsData(alertsPayload);
      setDashboardData(dashboardPayload);
    } catch (requestError) {
      console.error('[AdminAlertasPage] Falha ao carregar alertas:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [filters, windowDays]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData();
    }
  }, [authLoading, fetchData, isAdmin]);

  const sortedOperationalAlerts = useMemo(() => {
    if (!alertsData) return [];
    return [...alertsData.items].sort((left, right) => {
      const severityDiff = severityOrder[left.severity] - severityOrder[right.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(right.lastDetectedAt).getTime() - new Date(left.lastDetectedAt).getTime();
    });
  }, [alertsData]);

  const dashboardPriorityAlerts = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.alerts.items.filter((alert) => alert.severity !== 'info');
  }, [dashboardData]);

  const openOperationalAlerts = useMemo(() => sortedOperationalAlerts.filter((alert) => alert.status === 'open'), [sortedOperationalAlerts]);
  const cancellationAndRefundAlerts = useMemo(
    () => sortedOperationalAlerts.filter((alert) => alert.type === 'trust_experience' || alert.title.toLowerCase().includes('cancel') || alert.title.toLowerCase().includes('reembolso')),
    [sortedOperationalAlerts]
  );
  const liquidityAlerts = useMemo(() => sortedOperationalAlerts.filter((alert) => alert.type === 'liquidity_marketplace'), [sortedOperationalAlerts]);

  const applySearch = () => {
    setFilters((previous) => ({
      ...previous,
      searchTerm: searchInput.trim() || undefined,
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters(DEFAULT_FILTERS);
  };

  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-950">Acesso restrito</h2>
        <p className="mt-2 text-sm text-slate-600">Somente administradores podem acessar o painel de alertas.</p>
        <Link href="/admin/login" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Fazer login
        </Link>
      </div>
    );
  }

  if (!alertsData || !dashboardData) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-lg font-semibold text-red-700">Alertas indisponiveis</h2>
        <p className="mt-2 text-sm text-red-700">Nao foi possivel carregar o painel de alertas. {error ? `Detalhe: ${error}` : ''}</p>
        <button onClick={fetchData} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Voltar para home
              </Link>
              <Link href="/admin/funil" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Ver funil
              </Link>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bloco 6</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Alertas e excecoes reais</h1>
            <p className="mt-2 text-sm text-slate-600">
              Esta tela prioriza severidade clara, acao sugerida e evidencia operacional. Nao ha grafico decorativo: o foco e excecao acionavel, cancelamento, reembolso, cobertura e falha financeira.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={windowDays}
              onChange={(event) => setWindowDays(Number(event.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value={7}>Janela 7 dias</option>
              <option value={14}>Janela 14 dias</option>
              <option value={30}>Janela 30 dias</option>
              <option value={60}>Janela 60 dias</option>
              <option value={90}>Janela 90 dias</option>
            </select>
            <button onClick={fetchData} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Atualizar leitura
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>Total operacional filtrado: {alertsData.summary.total.toLocaleString('pt-BR')}</span>
          <span>Gerado em: {formatDateTime(alertsData.timestamp)}</span>
          <span>Home e trilha detalhada estao sincronizadas na mesma janela</span>
        </div>
      </header>

      <SectionBlock
        title="Leitura executiva de excecao"
        description="Cards para priorizacao rapida. Eles nao substituem a lista detalhada, apenas orientam o que precisa de acao imediata."
      >
        <AlertsExecutiveSummary
          openAlerts={alertsData.summary.open}
          criticalAlerts={alertsData.summary.bySeverity.critical}
          cancellationAndRefundAlerts={cancellationAndRefundAlerts.length}
          liquidityAlerts={liquidityAlerts.length}
        />
      </SectionBlock>

      <SectionBlock
        title="Saude das fontes"
        description="Visibilidade sobre a recencia das bases que alimentam excecao operacional. Quando a fonte degrada, a tela avisa em vez de fingir normalidade."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className={`rounded-2xl border p-4 ${freshnessClass(alertsData.freshness.jobs.status)}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Jobs</h3>
              <span className="text-xs font-medium">{alertsData.freshness.jobs.status}</span>
            </div>
            <p className="mt-2 text-sm">Base transacional de match, cancelamento e cobertura operacional.</p>
            <p className="mt-2 text-xs">{alertsData.freshness.jobs.reason || 'Sem observacoes'}</p>
            <p className="mt-2 text-[11px]">Ultima leitura: {formatDateTime(alertsData.freshness.jobs.lastSuccessAt)}</p>
          </article>
          <article className={`rounded-2xl border p-4 ${freshnessClass(alertsData.freshness.tickets.status)}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Tickets</h3>
              <span className="text-xs font-medium">{alertsData.freshness.tickets.status}</span>
            </div>
            <p className="mt-2 text-sm">Base de reclamacoes e excecoes de suporte que exigem tratativa humana.</p>
            <p className="mt-2 text-xs">{alertsData.freshness.tickets.reason || 'Sem observacoes'}</p>
            <p className="mt-2 text-[11px]">Ultima leitura: {formatDateTime(alertsData.freshness.tickets.lastSuccessAt)}</p>
          </article>
          <article className={`rounded-2xl border p-4 ${freshnessClass(alertsData.freshness.stripe.status)}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Stripe</h3>
              <span className="text-xs font-medium">{alertsData.freshness.stripe.status}</span>
            </div>
            <p className="mt-2 text-sm">Base financeira para pendencia, falha e atraso de pagamento.</p>
            <p className="mt-2 text-xs">{alertsData.freshness.stripe.reason || 'Sem observacoes'}</p>
            <p className="mt-2 text-[11px]">Ultima leitura: {formatDateTime(alertsData.freshness.stripe.lastSuccessAt)}</p>
          </article>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Alertas coerentes com a home"
        description="A mesma camada de excecao mostrada na home aparece aqui primeiro, para manter coerencia entre os blocos e a trilha detalhada."
      >
        <DashboardAlertsList alerts={dashboardPriorityAlerts} />
      </SectionBlock>

      <SectionBlock
        title="Filtros operacionais"
        description="Os filtros atuam sobre a lista detalhada de excecoes reais. Nao existe grafico sintetico aqui porque o objetivo e decidir o que atacar, nao criar volume visual."
      >
        <AlertsFiltersPanel
          filters={filters}
          searchInput={searchInput}
          onFiltersChange={setFilters}
          onSearchInputChange={setSearchInput}
          onSearch={applySearch}
          onClear={clearFilters}
        />
      </SectionBlock>

      <SectionBlock
        title="Fila priorizada de excecoes"
        description="Lista principal para acao. Severidade, bloco afetado, contexto e acao sugerida aparecem acima de qualquer detalhe secundario."
      >
        <OperationalAlertsList alerts={sortedOperationalAlerts} />
      </SectionBlock>

      <SectionBlock
        title="Itens afetados"
        description="Tabela operacional detalhada apenas para leitura de caso e priorizacao fina. Ela complementa os cards, nao compete com eles."
      >
        <AffectedItemsList alerts={sortedOperationalAlerts} />
      </SectionBlock>

      <SectionBlock
        title="Coerencia com os blocos da home"
        description="Mapeamento explicito para evitar nomenclatura solta, visualizacao generica ou leitura desconectada da home."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AlertSummaryCard label="Home -> funil" value={dashboardPriorityAlerts.length} tone="neutral" helper="Alertas canonicos herdados da home para manter a mesma hierarquia de excecao." />
          <AlertSummaryCard label="Operacionais abertos" value={openOperationalAlerts.length} tone="critical" helper="Fila real de excecoes ainda sem fechamento operacional." />
          <AlertSummaryCard label="Pagamento e financeiro" value={alertsData.summary.byType.payment_financial} tone="warning" helper="Falha, pendencia e friccao de pagamento alinhadas ao Bloco 3 e ao Bloco 5." />
          <AlertSummaryCard label="Liquidez e marketplace" value={alertsData.summary.byType.liquidity_marketplace} tone="info" helper="Sem proposta, fila e cobertura insuficiente alinhadas ao Bloco 4." />
        </div>
      </SectionBlock>
    </div>
  );
}