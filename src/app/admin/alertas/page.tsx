'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import type { KpiDashboardResponse, AlertItem as DashboardAlertItem } from '@/services/admin/kpiDashboardTypes';
import type { AlertSeverity, AlertStatus, AlertType, AlertsResponse, OperationalAlert } from '@/services/admin/alerts';

type AlertsFiltersState = {
  severityFilter: AlertSeverity | 'all';
  typeFilter: AlertType | 'all';
  statusFilter: AlertStatus | 'all';
  searchTerm?: string;
};

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

function severityClass(severity: AlertSeverity | DashboardAlertItem['severity']) {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function statusClass(status: AlertStatus) {
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'acknowledged') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function freshnessClass(status: 'fresh' | 'stale' | 'unavailable') {
  if (status === 'fresh') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'stale') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function severityLabel(severity: AlertSeverity | DashboardAlertItem['severity']) {
  if (severity === 'critical') return 'Critico';
  if (severity === 'warning') return 'Atencao';
  return 'Informativo';
}

function statusLabel(status: AlertStatus) {
  if (status === 'resolved') return 'Resolvido';
  if (status === 'acknowledged') return 'Reconhecido';
  return 'Aberto';
}

function typeLabel(type: AlertType) {
  if (type === 'liquidity_marketplace') return 'Liquidez e marketplace';
  if (type === 'trust_experience') return 'Confianca e experiencia';
  if (type === 'service_desk_support') return 'Service desk e suporte';
  if (type === 'payment_financial') return 'Pagamento e financeiro';
  if (type === 'data_integrity') return 'Integridade de dados';
  return 'Outras excecoes';
}

function sourceLabel(source: OperationalAlert['source']) {
  if (source === 'jobs') return 'Firebase jobs';
  if (source === 'tickets') return 'Tickets';
  return 'Stripe';
}

function blockLabelForDashboardAlert(alert: DashboardAlertItem): string {
  if (alert.metricId === 'requests_without_proposal_rate') return 'Bloco 4 — Liquidez e marketplace';
  if (alert.metricId === 'refund_rate' || alert.metricId === 'cancellation_rate') return 'Bloco 5 — Confianca e experiencia';
  if (alert.metricId === 'proposal_acceptance_rate' || alert.metricId === 'avg_accept_to_payment_hours') return 'Bloco 3 — Saude operacional';
  return 'Bloco 6 — Alertas e excecoes';
}

function blockLabelForOperationalAlert(alert: OperationalAlert): string {
  if (alert.type === 'liquidity_marketplace') return 'Bloco 4 — Liquidez e marketplace';
  if (alert.type === 'trust_experience') return 'Bloco 5 — Confianca e experiencia';
  if (alert.type === 'payment_financial') {
    return alert.title.toLowerCase().includes('reembolso')
      ? 'Bloco 5 — Confianca e experiencia'
      : 'Bloco 3 — Saude operacional';
  }
  if (alert.type === 'service_desk_support') return 'Bloco 6 — Alertas e excecoes';
  if (alert.type === 'data_integrity') return 'Integridade da base';
  return 'Outras excecoes';
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

function SummaryCard({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: string | number;
  tone: 'neutral' | 'critical' | 'warning' | 'info';
  helper: string;
}) {
  const toneClass =
    tone === 'critical'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'info'
          ? 'border-sky-200 bg-sky-50 text-sky-700'
          : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs">{helper}</p>
    </article>
  );
}

function DashboardAlertCard({ alert }: { alert: DashboardAlertItem }) {
  return (
    <article className={`rounded-2xl border border-l-4 bg-slate-50 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-slate-400'} border-slate-200`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>
              {severityLabel(alert.severity)}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              {blockLabelForDashboardAlert(alert)}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{alert.description}</p>
          <p className="mt-2 text-xs text-slate-500">Fonte: {alert.source.join(' + ')}</p>
        </div>
        <div className="max-w-sm text-sm text-slate-700">
          <p className="font-medium text-slate-900">Acao esperada</p>
          <p className="mt-1">{alert.expectedAction}</p>
        </div>
      </div>
    </article>
  );
}

function OperationalAlertCard({ alert }: { alert: OperationalAlert }) {
  return (
    <article className={`rounded-2xl border border-l-4 bg-slate-50 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-slate-400'} border-slate-200`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>
              {severityLabel(alert.severity)}
            </span>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(alert.status)}`}>
              {statusLabel(alert.status)}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              {blockLabelForOperationalAlert(alert)}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{alert.description || 'Sem descricao adicional.'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>Tipo: {typeLabel(alert.type)}</span>
            <span>Fonte: {sourceLabel(alert.source)}</span>
            <span>Ultima deteccao: {formatDateTime(alert.lastDetectedAt)}</span>
            <span>Ocorrencias: {alert.count.toLocaleString('pt-BR')}</span>
          </div>
          {alert.actionHint ? <p className="mt-3 text-sm text-slate-700"><span className="font-medium text-slate-900">Acao sugerida:</span> {alert.actionHint}</p> : null}
        </div>
      </div>
    </article>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Abertos" value={alertsData.summary.open} tone="critical" helper="Excecoes operacionais ainda sem resolucao." />
          <SummaryCard label="Criticos" value={alertsData.summary.bySeverity.critical} tone="critical" helper="Itens com impacto mais alto e resposta prioritaria." />
          <SummaryCard label="Cancelamento e reembolso" value={cancellationAndRefundAlerts.length} tone="warning" helper="Sinais diretos de friccao, quebra de confianca ou perda financeira." />
          <SummaryCard label="Sem proposta e liquidez" value={liquidityAlerts.length} tone="info" helper="Fila, cobertura insuficiente e gargalo de matching." />
        </div>
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
        <div className="space-y-3">
          {dashboardPriorityAlerts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhum alerta prioritario vindo da home nesta janela.
            </div>
          ) : (
            dashboardPriorityAlerts.map((alert) => <DashboardAlertCard key={alert.id} alert={alert} />)
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Filtros operacionais"
        description="Os filtros atuam sobre a lista detalhada de excecoes reais. Nao existe grafico sintetico aqui porque o objetivo e decidir o que atacar, nao criar volume visual."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={filters.severityFilter}
            onChange={(event) => setFilters((previous) => ({ ...previous, severityFilter: event.target.value as AlertsFiltersState['severityFilter'] }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">Severidade: todas</option>
            <option value="critical">Critico</option>
            <option value="warning">Atencao</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filters.typeFilter}
            onChange={(event) => setFilters((previous) => ({ ...previous, typeFilter: event.target.value as AlertsFiltersState['typeFilter'] }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">Tipo: todos</option>
            <option value="liquidity_marketplace">Liquidez e marketplace</option>
            <option value="trust_experience">Confianca e experiencia</option>
            <option value="payment_financial">Pagamento e financeiro</option>
            <option value="service_desk_support">Service desk e suporte</option>
            <option value="data_integrity">Integridade de dados</option>
            <option value="other_exceptions">Outras excecoes</option>
          </select>

          <select
            value={filters.statusFilter}
            onChange={(event) => setFilters((previous) => ({ ...previous, statusFilter: event.target.value as AlertsFiltersState['statusFilter'] }))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">Status: todos</option>
            <option value="open">Aberto</option>
            <option value="acknowledged">Reconhecido</option>
            <option value="resolved">Resolvido</option>
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applySearch();
              }}
              placeholder="Buscar titulo, contexto ou regiao"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button onClick={applySearch} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Buscar
            </button>
            <button onClick={clearFilters} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Limpar
            </button>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Fila priorizada de excecoes"
        description="Lista principal para acao. Severidade, bloco afetado, contexto e acao sugerida aparecem acima de qualquer detalhe secundario."
      >
        <div className="space-y-3">
          {sortedOperationalAlerts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhuma excecao operacional para os filtros atuais.
            </div>
          ) : (
            sortedOperationalAlerts.map((alert) => <OperationalAlertCard key={alert.id} alert={alert} />)
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Itens afetados"
        description="Tabela operacional detalhada apenas para leitura de caso e priorizacao fina. Ela complementa os cards, nao compete com eles."
      >
        {sortedOperationalAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Nenhum item afetado para exibir na tabela detalhada.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedOperationalAlerts.map((alert) => (
              <div key={`${alert.id}-details`} className="overflow-x-auto rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(alert.severity)}`}>
                      {severityLabel(alert.severity)}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      {typeLabel(alert.type)}
                    </span>
                  </div>
                </div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Item afetado</th>
                      <th className="px-3 py-3">Contexto</th>
                      <th className="px-3 py-3">Regiao</th>
                      <th className="px-3 py-3">Ocorrido em</th>
                      <th className="px-3 py-3">Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alert.affectedItems.map((item) => (
                      <tr key={`${alert.id}-${item.id}`} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-3 text-slate-900">{item.label}</td>
                        <td className="px-3 py-3 text-slate-700">{item.context || 'Nao informado'}</td>
                        <td className="px-3 py-3 text-slate-700">{item.region || 'Nao informado'}</td>
                        <td className="px-3 py-3 text-slate-700">{formatDateTime(item.occurredAt)}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {item.metadata
                            ? Object.entries(item.metadata)
                                .map(([key, value]) => `${key}: ${value ?? 'NA'}`)
                                .join(' | ')
                            : 'Nao informado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock
        title="Coerencia com os blocos da home"
        description="Mapeamento explicito para evitar nomenclatura solta, visualizacao generica ou leitura desconectada da home."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Home -> funil" value={dashboardPriorityAlerts.length} tone="neutral" helper="Alertas canonicos herdados da home para manter a mesma hierarquia de excecao." />
          <SummaryCard label="Operacionais abertos" value={openOperationalAlerts.length} tone="critical" helper="Fila real de excecoes ainda sem fechamento operacional." />
          <SummaryCard label="Pagamento e financeiro" value={alertsData.summary.byType.payment_financial} tone="warning" helper="Falha, pendencia e friccao de pagamento alinhadas ao Bloco 3 e ao Bloco 5." />
          <SummaryCard label="Liquidez e marketplace" value={alertsData.summary.byType.liquidity_marketplace} tone="info" helper="Sem proposta, fila e cobertura insuficiente alinhadas ao Bloco 4." />
        </div>
      </SectionBlock>
    </div>
  );
}