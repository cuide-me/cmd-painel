'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import type {
  AlertItem,
  DashboardMetric,
  FunnelStep,
  KpiDashboardResponse,
  SourceFreshness,
  TimeWindow,
} from '@/services/admin/kpiDashboardTypes';

export const dynamic = 'force-dynamic';

function statusClass(status: DashboardMetric['status'] | AlertItem['severity']): string {
  if (status === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function freshnessClass(status: SourceFreshness['status']): string {
  if (status === 'fresh') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'stale') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function formatValue(metric: DashboardMetric): string {
  if (metric.value === null) return 'Indisponivel';
  if (typeof metric.value === 'string') return metric.value;

  if (metric.unit === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(metric.value);
  }

  const formatted = metric.value.toLocaleString('pt-BR', {
    minimumFractionDigits: metric.unit ? 1 : 0,
    maximumFractionDigits: metric.unit ? 1 : 0,
  });

  return metric.unit ? `${formatted} ${metric.unit}` : formatted;
}

function formatPercentage(value: number | null): string {
  if (value === null) return 'Indisponivel';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
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

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const comparison = metric.comparison;
  const hasComparison = comparison && comparison.changePercent !== null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatValue(metric)}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(metric.status)}`}>
          {metric.scope}
        </span>
      </div>
      {hasComparison ? (
        <p className="mt-2 text-xs text-slate-500">
          {comparison.direction === 'up' ? 'Variacao para cima' : comparison.direction === 'down' ? 'Variacao para baixo' : 'Variacao estavel'}{' '}
          {Math.abs(comparison.changePercent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
        </p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">Fonte: {metric.source.join(' + ')}</p>
      <p className="mt-2 text-xs text-slate-600">{metric.definition}</p>
      <p className="mt-2 text-xs text-slate-600">Decisao: {metric.decision}</p>
      <p className="mt-1 text-xs text-slate-600">Acao: {metric.expectedAction}</p>
      {metric.note ? <p className="mt-2 text-xs text-slate-500">Obs.: {metric.note}</p> : null}
    </article>
  );
}

function SourceIntegrityBanner({
  freshness,
  historyNote,
  limitations,
}: {
  freshness: KpiDashboardResponse['freshness'];
  historyNote: string;
  limitations: string[];
}) {
  const unavailable = Object.values(freshness).filter((item) => item.status === 'unavailable').length;
  const stale = Object.values(freshness).filter((item) => item.status === 'stale').length;

  let title = 'Fontes principais disponiveis';
  let subtitle = 'O painel combina eventos oficiais do GA4 com operacao em Firebase e pagamentos no Stripe.';

  if (unavailable > 0) {
    title = 'Uma ou mais fontes estao indisponiveis';
    subtitle = 'Blocos dependentes dessas fontes podem aparecer como indisponiveis para evitar leitura enganosa.';
  } else if (stale > 0) {
    title = 'Parte das fontes esta desatualizada';
    subtitle = 'Use os blocos abaixo com cautela enquanto a recencia nao normaliza.';
  }

  return (
    <section className={`rounded-2xl border p-5 ${unavailable > 0 ? 'border-red-200 bg-red-50' : stale > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-700">{subtitle}</p>
          <p className="mt-3 text-sm text-slate-700">{historyNote}</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {limitations.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.entries(freshness).map(([source, info]) => (
            <div key={source} className={`rounded-xl border px-3 py-3 ${freshnessClass(info.status)}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">{source}</p>
              <p className="mt-1 text-sm font-medium">{info.status}</p>
              <p className="mt-1 text-xs">{info.reason || 'Sem observacoes'}</p>
              <p className="mt-2 text-[11px]">Ultima leitura: {formatDateTime(info.lastSuccessAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminKpiDashboardPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<KpiDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoading((current) => current || data === null);
    setError(null);

    try {
      const response = await authFetch(`/api/admin/dashboard-v3?window=${timeWindow}`);
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || `Erro ${response.status}`);
      }

      const payload: KpiDashboardResponse = await response.json();
      setData(payload);
      setLastUpdated(new Date());
    } catch (requestError) {
      console.error('[AdminKpiDashboard] Falha ao carregar painel:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  }, [data, isAdmin, timeWindow]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [fetchData, isAdmin]);

  const highPriorityAlerts = useMemo(() => {
    if (!data) return [];
    return data.alerts.items.filter((item) => item.severity !== 'info');
  }, [data]);

  if (authLoading || (isLoading && !data)) {
    return <LoadingState />;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-950">Acesso restrito</h2>
        <p className="mt-2 text-sm text-slate-600">Somente administradores podem acessar o painel de KPI.</p>
        <Link href="/admin/login" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Fazer login
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-lg font-semibold text-red-700">Dados indisponiveis</h2>
        <p className="mt-2 text-sm text-red-700">
          Nao foi possivel carregar o painel de KPI. {error ? `Detalhe: ${error}` : ''}
        </p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cuide-me</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Painel de KPI e Operacao</h1>
            <p className="mt-2 text-sm text-slate-600">
              Leitura executiva e operacional baseada na fonte real do produto: taxonomia canonica do GA4, operacao em Firebase e pagamentos no Stripe.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link href="/admin/jobs" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Ver atendimentos
              </Link>
              <Link href="/admin/alertas" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Ver alertas
              </Link>
              <Link href="/admin/users" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Ver usuarios
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeWindow}
              onChange={(event) => setTimeWindow(Number(event.target.value) as TimeWindow)}
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
          <span>Janela atual: {data.window} dias</span>
          <span>Gerado em: {formatDateTime(data.timestamp)}</span>
          <span>Ultima atualizacao local: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : 'Sem registro'}</span>
          {error ? <span className="text-red-600">Erro de leitura anterior: {error}</span> : null}
        </div>
      </header>

      <SourceIntegrityBanner
        freshness={data.freshness}
        historyNote={data.dataQuality.historyNote}
        limitations={data.dataQuality.limitations}
      />

      <SectionBlock
        title="Bloco 1 — Visao executiva"
        description="KPIs centrais do periodo para leitura rapida de volume, conversao e fechamento."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.executive.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Bloco 2 — Funil principal da plataforma"
        description={data.funnel.summary}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3">Evento tecnico</th>
                <th className="px-3 py-3">Volume</th>
                <th className="px-3 py-3">Conversao etapa anterior</th>
                <th className="px-3 py-3">Conversao desde cadastro</th>
              </tr>
            </thead>
            <tbody>
              {data.funnel.steps.map((step: FunnelStep) => (
                <tr key={step.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3 font-medium text-slate-900">{step.label}</td>
                  <td className="px-3 py-3 text-slate-600">{step.technicalNames.join(' + ')}</td>
                  <td className="px-3 py-3 text-slate-900">
                    {step.value === null ? 'Indisponivel' : step.value.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{formatPercentage(step.conversionFromPrevious)}</td>
                  <td className="px-3 py-3 text-slate-700">{formatPercentage(step.conversionFromStart)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Bloco 3 — Saude operacional"
        description="Taxas, tempos e gargalos que mostram onde a operacao trava e onde a conversao precisa de intervencao."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr,1fr]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.operationalHealth.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Gargalos por etapa</h3>
            <div className="mt-3 space-y-3">
              {data.operationalHealth.bottlenecks.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {item.volume.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Acao: {item.expectedAction}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Bloco 4 — Liquidez e marketplace"
        description="Leitura da relacao entre demanda criada, oferta enviada, cobertura de proposta e pressao regional."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr,1fr]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.liquidity.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Concentracao por regiao</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2">Regiao</th>
                    <th className="px-2 py-2">Solic.</th>
                    <th className="px-2 py-2">Sem prop.</th>
                    <th className="px-2 py-2">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {data.liquidity.regions.map((region) => (
                    <tr key={region.region} className="border-b border-slate-100">
                      <td className="px-2 py-2 text-slate-900">{region.region}</td>
                      <td className="px-2 py-2 text-slate-700">{region.requestsCreated.toLocaleString('pt-BR')}</td>
                      <td className="px-2 py-2 text-slate-700">
                        {region.requestsWithoutProposal.toLocaleString('pt-BR')} ({formatPercentage(region.withoutProposalRate)})
                      </td>
                      <td className="px-2 py-2 text-slate-700">{region.matchedJobs.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Bloco 5 — Confianca e experiencia"
        description="Sinais de satisfacao, reembolso, cancelamento, validacao critica e busca por ajuda."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.trust.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Bloco 6 — Alertas e excecoes"
        description={highPriorityAlerts.length > 0 ? 'Itens que pedem acao imediata ou monitoramento reforcado.' : 'Nenhum alerta prioritario ativo nesta janela.'}
      >
        <div className="space-y-3">
          {data.alerts.items.map((alert) => (
            <article key={alert.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(alert.severity)}`}>
                      {alert.severity}
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
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Taxonomia visivel no painel"
        description="Nomes amigaveis em portugues e mapeamento de eventos legados que nao devem mais ser usados na camada visual."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Tecnico</th>
                  <th className="px-3 py-3">Nome amigavel</th>
                </tr>
              </thead>
              <tbody>
                {data.taxonomy.friendlyLabels.map((item) => (
                  <tr key={item.technicalName} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3 text-slate-900">{item.technicalName}</td>
                    <td className="px-3 py-3 text-slate-700">
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Antes</th>
                  <th className="px-3 py-3">Agora</th>
                  <th className="px-3 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.taxonomy.legacyRenames.map((item) => (
                  <tr key={item.oldName} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3 text-slate-900">{item.oldName}</td>
                    <td className="px-3 py-3 text-slate-900">{item.newName}</td>
                    <td className="px-3 py-3 text-slate-600">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionBlock>
    </div>
  );
}