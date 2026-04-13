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

const TIME_METRIC_IDS = [
  'avg_request_to_proposal_hours',
  'avg_proposal_to_accept_hours',
  'avg_accept_to_payment_hours',
] as const;

const FUNNEL_ALERT_IDS = new Set([
  'proposal_acceptance_rate',
  'requests_without_proposal_rate',
  'cancellation_rate',
  'avg_accept_to_payment_hours',
]);

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

function severityLabel(status: DashboardMetric['status'] | AlertItem['severity']): string {
  if (status === 'critical') return 'Critico';
  if (status === 'warning') return 'Atencao';
  if (status === 'ok') return 'Saudavel';
  return 'Informativo';
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

function getNumericMetricValue(metric: DashboardMetric): number | null {
  return typeof metric.value === 'number' && Number.isFinite(metric.value) ? metric.value : null;
}

function getComparisonLabel(comparison?: DashboardMetric['comparison']): string | null {
  if (!comparison || comparison.changePercent === null) return null;

  const direction =
    comparison.direction === 'up'
      ? 'subiu'
      : comparison.direction === 'down'
        ? 'caiu'
        : 'ficou estavel';

  return `${direction} ${Math.abs(comparison.changePercent).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}% vs janela anterior`;
}

function sortMetricsByOrder(metrics: DashboardMetric[], order: readonly string[]): DashboardMetric[] {
  return [...metrics].sort((left, right) => {
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    return normalizedLeft - normalizedRight;
  });
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
      <div className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-56 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-56 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
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
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatValue(metric)}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(metric.status)}`}>
          {severityLabel(metric.status)}
        </span>
      </div>
      {metric.comparison?.changePercent !== null ? (
        <p className="mt-2 text-xs text-slate-500">{getComparisonLabel(metric.comparison)}</p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">Fonte: {metric.source.join(' + ')}</p>
      <p className="mt-2 text-xs text-slate-600">{metric.definition}</p>
      <p className="mt-2 text-xs text-slate-600">Decisao: {metric.decision}</p>
      <p className="mt-1 text-xs text-slate-600">Acao: {metric.expectedAction}</p>
      {metric.note ? <p className="mt-2 text-xs text-slate-500">Obs.: {metric.note}</p> : null}
    </article>
  );
}

function SourceCard({
  title,
  freshness,
  description,
}: {
  title: string;
  freshness: SourceFreshness;
  description: string;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${freshnessClass(freshness.status)}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
        <span className="text-xs font-medium">{freshness.status}</span>
      </div>
      <p className="mt-2 text-sm">{description}</p>
      <p className="mt-2 text-xs">{freshness.reason || 'Sem observacoes'}</p>
      <p className="mt-2 text-[11px]">Ultima leitura: {formatDateTime(freshness.lastSuccessAt)}</p>
    </article>
  );
}

function FunnelVisual({ steps }: { steps: FunnelStep[] }) {
  const maxValue = Math.max(...steps.map((step) => step.value || 0), 0);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const width = maxValue > 0 ? Math.max(20, ((step.value || 0) / maxValue) * 100) : 20;

        return (
          <article key={step.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{index + 1}. {step.label}</p>
                <p className="text-xs text-slate-500">{step.technicalNames.join(' + ')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-950">{step.value === null ? 'Indisponivel' : step.value.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-500">Conv. etapa: {formatPercentage(step.conversionFromPrevious)}</p>
              </div>
            </div>
            <div className="px-2">
              <div className="mx-auto rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm" style={{ width: `${width}%` }}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">{step.label}</span>
                  <span>{step.value === null ? 'Indisponivel' : step.value.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StepBarList({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ id: string; label: string; value: number | null; helper: string }>;
  tone: 'emerald' | 'rose' | 'sky';
}) {
  const barColor = tone === 'emerald' ? 'bg-emerald-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-sky-600';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.helper}</p>
              </div>
              <span className="font-semibold text-slate-950">{tone === 'sky' ? item.value?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) ?? 'Indisponivel' : formatPercentage(item.value)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={barColor} style={{ width: `${Math.max(0, Math.min(item.value ?? 0, 100))}%`, height: '100%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminFunnelPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<KpiDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`/api/admin/dashboard-v3?window=${timeWindow}`);
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || `Erro ${response.status}`);
      }

      const payload: KpiDashboardResponse = await response.json();
      setData(payload);
    } catch (requestError) {
      console.error('[AdminFunnelPage] Falha ao carregar funil:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, timeWindow]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [fetchData, isAdmin]);

  const conversionItems = useMemo(() => {
    if (!data) return [];
    return data.funnel.steps.slice(1).map((step) => ({
      id: step.id,
      label: step.label,
      value: step.conversionFromPrevious,
      helper: `Volume atual da etapa: ${step.value === null ? 'indisponivel' : step.value.toLocaleString('pt-BR')}`,
    }));
  }, [data]);

  const dropoffItems = useMemo(() => {
    if (!data) return [];
    return data.funnel.steps.slice(1).map((step) => ({
      id: step.id,
      label: step.label,
      value: step.conversionFromPrevious === null ? null : Number((100 - step.conversionFromPrevious).toFixed(1)),
      helper: 'Abandono estimado entre a etapa anterior e esta etapa.',
    }));
  }, [data]);

  const timingMetrics = useMemo(() => {
    if (!data) return [];
    return sortMetricsByOrder(
      data.operationalHealth.metrics.filter((metric) => TIME_METRIC_IDS.includes(metric.id as (typeof TIME_METRIC_IDS)[number])),
      TIME_METRIC_IDS
    );
  }, [data]);

  const timingItems = useMemo(() => {
    const numericValues = timingMetrics.map(getNumericMetricValue).filter((value): value is number => value !== null);
    const maxValue = Math.max(...numericValues, 0);

    return timingMetrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      value: maxValue > 0 && getNumericMetricValue(metric) !== null ? Number((((getNumericMetricValue(metric) || 0) / maxValue) * 100).toFixed(1)) : 0,
      helper: `${formatValue(metric)} • ${metric.expectedAction}`,
    }));
  }, [timingMetrics]);

  const funnelAlerts = useMemo(() => {
    if (!data) return [];
    return data.alerts.items.filter((item) => (item.metricId ? FUNNEL_ALERT_IDS.has(item.metricId) : item.severity !== 'info'));
  }, [data]);

  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-950">Acesso restrito</h2>
        <p className="mt-2 text-sm text-slate-600">Somente administradores podem acessar o funil oficial de contratacao.</p>
        <Link href="/admin/login" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Fazer login
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-lg font-semibold text-red-700">Funil indisponivel</h2>
        <p className="mt-2 text-sm text-red-700">Nao foi possivel carregar a leitura do funil. {error ? `Detalhe: ${error}` : ''}</p>
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
              <Link href="/admin/alertas" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                Ver alertas
              </Link>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bloco 2</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Funil oficial de contratacao</h1>
            <p className="mt-2 text-sm text-slate-600">
              Esta tela representa apenas o fluxo canonico de contratacao: selecao de profissional, inicio de solicitacao, criacao da solicitacao, proposta, aceite, pagamento e encerramento.
            </p>
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
          <span>Taxonomia: sequencia canonica do produto</span>
        </div>
      </header>

      <SectionBlock
        title="Integridade da leitura"
        description="O funil depende principalmente do GA4 canonico, mas gargalos temporais e excecoes tambem usam Firebase e Stripe para nao mascarar travamentos reais."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SourceCard title="GA4" freshness={data.freshness.ga4} description="Base oficial das etapas do funil de contratacao." />
          <SourceCard title="Firebase" freshness={data.freshness.firebase} description="Base operacional de timestamps, jobs e gargalos transacionais." />
          <SourceCard title="Stripe" freshness={data.freshness.stripe} description="Confirma fechamento financeiro e atraso entre aceite e pagamento." />
        </div>
      </SectionBlock>

      <SectionBlock
        title="Funil protagonista"
        description="Visual principal do fluxo de contratacao. Nada aqui mistura funil amplo de plataforma com etapas fora da jornada oficial."
      >
        <FunnelVisual steps={data.funnel.steps} />
      </SectionBlock>

      <SectionBlock
        title="Conversao e abandono por etapa"
        description="Barras complementares para responder onde a jornada converte e onde ela trava, sem substituir o funil principal."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <StepBarList title="Conversao por etapa" items={conversionItems} tone="emerald" />
          <StepBarList title="Abandono por etapa" items={dropoffItems} tone="rose" />
        </div>
      </SectionBlock>

      <SectionBlock
        title="Tempos e gargalos reais"
        description="Tempos entram apenas quando sustentados por timestamp real. Eles sao agregados pela janela selecionada e nao representam analise por coorte. O objetivo aqui e apontar friccao operacional acionavel, nao criar grafico decorativo."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr,1fr]">
          <StepBarList title="Tempo relativo por etapa" items={timingItems} tone="sky" />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Excecoes que travam o fim do funil</h3>
            <div className="mt-4 space-y-3">
              {data.operationalHealth.bottlenecks.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {severityLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Volume: {item.volume.toLocaleString('pt-BR')}</p>
                  <p className="mt-1 text-xs text-slate-600">Acao: {item.expectedAction}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {timingMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Leitura temporal agregada na janela ativa. Se for necessario comparar cohortes, isso precisa entrar como analise propria e nao como extensao desta tela.
        </p>
      </SectionBlock>

      <SectionBlock
        title="Alertas acionaveis ligados ao funil"
        description="A mesma logica de excecao da home aparece aqui em profundidade, com foco em cobertura, aceite, cancelamento e pagamento."
      >
        <div className="space-y-3">
          {funnelAlerts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhum alerta prioritario de funil nesta janela.
            </div>
          ) : (
            funnelAlerts.map((alert) => (
              <article
                key={alert.id}
                className={`rounded-2xl border border-slate-200 border-l-4 bg-slate-50 p-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-slate-400'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(alert.severity)}`}>
                        {severityLabel(alert.severity)}
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
            ))
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Taxonomia canonica visivel"
        description="Esta tela mantem a mesma nomenclatura da home. Qualquer nome legado fica explicitamente fora da leitura principal."
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Etapa</th>
                <th className="px-3 py-3">Evento tecnico</th>
                <th className="px-3 py-3">Conv. etapa anterior</th>
                <th className="px-3 py-3">Conv. desde o inicio</th>
              </tr>
            </thead>
            <tbody>
              {data.funnel.steps.map((step) => (
                <tr key={step.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3 text-slate-900">
                    <p className="font-medium">{step.label}</p>
                    {step.note ? <p className="mt-1 text-xs text-slate-500">{step.note}</p> : null}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{step.technicalNames.join(' + ')}</td>
                  <td className="px-3 py-3 text-slate-700">{formatPercentage(step.conversionFromPrevious)}</td>
                  <td className="px-3 py-3 text-slate-700">{formatPercentage(step.conversionFromStart)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBlock>
    </div>
  );
}