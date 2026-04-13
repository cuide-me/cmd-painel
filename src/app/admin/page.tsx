'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import type {
  AlertItem,
  DashboardZoneKey,
  DashboardMetric,
  FunnelStep,
  KpiDashboardResponse,
  SourceFreshness,
  TimeWindow,
  ZoneUserDistributionItem,
} from '@/services/admin/kpiDashboardTypes';

export const dynamic = 'force-dynamic';

const PRIMARY_EXECUTIVE_ORDER = [
  'families_registered',
  'professionals_registered',
  'logins_completed',
  'care_requests_created',
  'proposals_sent',
  'payments_confirmed',
] as const;

const TRUST_FOCUS_ORDER = ['refunds_processed_trust', 'services_canceled_trust', 'ratings_submitted'] as const;

const TIME_METRIC_IDS = [
  'avg_request_to_proposal_hours',
  'avg_proposal_to_accept_hours',
  'avg_accept_to_payment_hours',
] as const;

const FUNNEL_START_STEP_ID = 'care_request_started';

const ZONE_COLORS: Record<DashboardZoneKey, string> = {
  norte: '#2563eb',
  sul: '#059669',
  leste: '#ea580c',
  oeste: '#dc2626',
};

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

function scopeLabel(scope: DashboardMetric['scope']): string {
  if (scope === 'executivo') return 'Leitura executiva';
  if (scope === 'operacional') return 'Leitura operacional';
  return 'Leitura diagnostica';
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

function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
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

function getComparisonWidth(comparison?: DashboardMetric['comparison']): number {
  if (!comparison || comparison.changePercent === null) return 0;
  return Math.min(Math.abs(comparison.changePercent), 100);
}

function getComparisonTone(comparison?: DashboardMetric['comparison']): string {
  if (!comparison || comparison.changePercent === null || comparison.direction === 'stable') return 'bg-slate-400';
  return comparison.direction === 'down' ? 'bg-rose-500' : 'bg-emerald-500';
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

function getFunnelStepsFromRequestStarted(steps: FunnelStep[]): FunnelStep[] {
  const startIndex = steps.findIndex((step) => step.id === FUNNEL_START_STEP_ID);
  return startIndex >= 0 ? steps.slice(startIndex) : steps;
}

function heatColor(value: number, max: number, tone: 'blue' | 'emerald' | 'rose'): string {
  const palette =
    tone === 'blue'
      ? [37, 99, 235]
      : tone === 'emerald'
        ? [5, 150, 105]
        : [225, 29, 72];

  const intensity = max > 0 ? value / max : 0;
  const alpha = 0.1 + intensity * 0.45;

  return `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, ${alpha.toFixed(2)})`;
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
  const comparisonLabel = getComparisonLabel(comparison);
  const comparisonWidth = getComparisonWidth(comparison);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{scopeLabel(metric.scope)}</p>
          <p className="text-sm font-medium text-slate-700">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatValue(metric)}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(metric.status)}`}>
          {severityLabel(metric.status)}
        </span>
      </div>

      {comparisonLabel ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>Mini tendencia de apoio</span>
            <span>{comparisonLabel}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${getComparisonTone(comparison)}`} style={{ width: `${comparisonWidth}%` }} />
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">Fonte: {metric.source.join(' + ')}</p>
      <p className="mt-2 text-xs text-slate-600">{metric.definition}</p>
      <p className="mt-2 text-xs text-slate-600">Decisao: {metric.decision}</p>
      <p className="mt-1 text-xs text-slate-600">Acao: {metric.expectedAction}</p>
      {metric.note ? <p className="mt-2 text-xs text-slate-500">Obs.: {metric.note}</p> : null}
    </article>
  );
}

function FunnelVisual({ steps }: { steps: FunnelStep[] }) {
  const maxValue = Math.max(...steps.map((step) => step.value || 0), 0);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const width = maxValue > 0 ? Math.max(22, ((step.value || 0) / maxValue) * 100) : 22;

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
  const maxSkyValue = tone === 'sky'
    ? Math.max(...items.map((item) => item.value ?? 0), 0)
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.id}>
            {(() => {
              const width = tone === 'sky'
                ? maxSkyValue > 0 && item.value !== null
                  ? Math.max(8, ((item.value || 0) / maxSkyValue) * 100)
                  : 0
                : Math.max(0, Math.min(item.value ?? 0, 100));

              return (
                <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.helper}</p>
              </div>
              <span className="font-semibold text-slate-950">
                {tone === 'sky'
                  ? item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ? `${item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h` : 'Indisponivel'
                  : formatPercentage(item.value)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={barColor} style={{ width: `${width}%`, height: '100%' }} />
            </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticBarList({ metrics }: { metrics: DashboardMetric[] }) {
  const numericValues = metrics.map(getNumericMetricValue).filter((value): value is number => value !== null);
  const maxValue = Math.max(...numericValues, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Tempo por etapa do funil</h3>
      <p className="mt-1 text-xs text-slate-500">Comparativo agregado na janela atual, sustentado por timestamp transacional. Nao representa analise por coorte.</p>
      <div className="mt-4 space-y-4">
        {metrics.map((metric) => {
          const value = getNumericMetricValue(metric);
          const width = maxValue > 0 && value !== null ? Math.max(8, (value / maxValue) * 100) : 0;

          return (
            <div key={metric.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{metric.label}</p>
                  <p className="text-xs text-slate-500">{metric.expectedAction}</p>
                </div>
                <span className="font-semibold text-slate-950">{formatValue(metric)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-sky-600" style={{ width: `${width}%` }} />
              </div>
              {metric.comparison?.changePercent !== null ? (
                <p className="mt-1 text-[11px] text-slate-500">{getComparisonLabel(metric.comparison)}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegionHeatmap({ regions }: { regions: KpiDashboardResponse['liquidity']['regions'] }) {
  const maxDemand = Math.max(...regions.map((region) => region.requestsCreated), 0);
  const maxGap = Math.max(...regions.map((region) => region.requestsWithoutProposal), 0);
  const maxMatch = Math.max(...regions.map((region) => region.matchedJobs), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Cobertura geografica real vs demanda</h3>
          <p className="mt-1 text-xs text-slate-500">Heatmap operacional por regiao observada. Azul mostra demanda, vermelho mostra gap e verde mostra cobertura com match.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">Protagonista do bloco</span>
      </div>

      <div className="mt-4 space-y-3">
        {regions.map((region) => (
          <article key={region.region} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{region.region}</h4>
                <p className="text-xs text-slate-500">Gap sem proposta: {formatPercentage(region.withoutProposalRate)}</p>
              </div>
              <span className="text-xs text-slate-500">{region.requestsCreated.toLocaleString('pt-BR')} solicitacoes</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: heatColor(region.requestsCreated, maxDemand, 'blue') }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Demanda</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{region.requestsCreated.toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: heatColor(region.requestsWithoutProposal, maxGap, 'rose') }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Sem proposta</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{region.requestsWithoutProposal.toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: heatColor(region.matchedJobs, maxMatch, 'emerald') }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-900">Com match</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{region.matchedJobs.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ZonePieTooltip({
  active,
  payload,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: ZoneUserDistributionItem; value?: number }>;
  valueLabel: string;
}) {
  const current = payload?.[0];

  if (!active || !current) {
    return null;
  }

  const zone = current.payload;
  const value = current.value || 0;
  const total = valueLabel === 'Profissionais'
    ? zone.professionals
    : zone.families;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{zone.label}</p>
      <p className="mt-1 text-xs text-slate-600">{valueLabel}: {formatCount(total)}</p>
    </div>
  );
}

function ZoneDistributionPieCard({
  title,
  description,
  zones,
  selectedZone,
  valueKey,
}: {
  title: string;
  description: string;
  zones: ZoneUserDistributionItem[];
  selectedZone: DashboardZoneKey | 'all';
  valueKey: 'professionals' | 'families';
}) {
  const chartData = zones.map((zone) => ({
    ...zone,
    value: zone[valueKey],
    fill: ZONE_COLORS[zone.zone],
  }));
  const total = chartData.reduce((sum, zone) => sum + zone.value, 0);
  const selectedItem = selectedZone === 'all'
    ? null
    : chartData.find((zone) => zone.zone === selectedZone) || null;
  const centerValue = selectedItem ? selectedItem.value : total;
  const centerLabel = selectedItem ? selectedItem.label : 'Base classificada';
  const centerShare = total > 0 && selectedItem
    ? `${((selectedItem.value / total) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    : '100,0%';

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <div className="relative mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={3}
            >
              {chartData.map((entry) => (
                <Cell
                  key={`${title}-${entry.zone}`}
                  fill={entry.fill}
                  fillOpacity={selectedZone === 'all' || entry.zone === selectedZone ? 1 : 0.28}
                />
              ))}
            </Pie>
            <Tooltip content={<ZonePieTooltip valueLabel={valueKey === 'professionals' ? 'Profissionais' : 'Familias'} />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{centerLabel}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{formatCount(centerValue)}</p>
            <p className="mt-1 text-xs text-slate-500">{selectedItem ? centerShare : `${formatCount(total)} no total`}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((zone) => (
          <div
            key={`${title}-legend-${zone.zone}`}
            className={`rounded-xl border px-3 py-2 ${selectedZone === 'all' || zone.zone === selectedZone ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-100/80'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.fill }} />
              <span className="text-xs font-semibold text-slate-700">{zone.label}</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatCount(zone.value)}</p>
          </div>
        ))}
      </div>
    </div>
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
  const [selectedZone, setSelectedZone] = useState<DashboardZoneKey | 'all'>('all');
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

  const funnelJourneySteps = useMemo(() => {
    if (!data) return [];
    return getFunnelStepsFromRequestStarted(data.funnel.steps);
  }, [data]);

  const executivePrimaryMetrics = useMemo(() => {
    if (!data) return [];
    const primaryIds = new Set<string>(PRIMARY_EXECUTIVE_ORDER);
    return sortMetricsByOrder(
      data.executive.metrics.filter((metric) => primaryIds.has(metric.id)),
      PRIMARY_EXECUTIVE_ORDER
    );
  }, [data]);

  const executiveSecondaryMetrics = useMemo(() => {
    if (!data) return [];
    const primaryIds = new Set<string>(PRIMARY_EXECUTIVE_ORDER);
    return data.executive.metrics.filter((metric) => !primaryIds.has(metric.id));
  }, [data]);

  const funnelConversionItems = useMemo(() => {
    if (!data) return [];

    const localTimingMetrics = sortMetricsByOrder(
      data.operationalHealth.metrics.filter((metric) => TIME_METRIC_IDS.includes(metric.id as (typeof TIME_METRIC_IDS)[number])),
      TIME_METRIC_IDS
    );

    return localTimingMetrics.map((metric) => {
      const rawValue = getNumericMetricValue(metric);

      return {
        id: metric.id,
        label: metric.label,
        value: rawValue,
        helper: `${formatValue(metric)} • ${metric.expectedAction}`,
      };
    });
  }, [data]);

  const funnelDropoffItems = useMemo(() => {
    return funnelJourneySteps.slice(1).map((step) => ({
      id: step.id,
      label: step.label,
      value: step.conversionFromPrevious === null ? null : Number((100 - step.conversionFromPrevious).toFixed(1)),
      helper: 'Perda estimada na transicao da etapa anterior.',
    }));
  }, [funnelJourneySteps]);

  const conversionRateMetrics = useMemo(() => {
    if (!data) return [];
    return data.operationalHealth.metrics.filter(
      (metric) => metric.unit === '%' && !['refund_rate', 'cancellation_rate'].includes(metric.id)
    );
  }, [data]);

  const timingMetrics = useMemo(() => {
    if (!data) return [];
    return sortMetricsByOrder(
      data.operationalHealth.metrics.filter((metric) => TIME_METRIC_IDS.includes(metric.id as (typeof TIME_METRIC_IDS)[number])),
      TIME_METRIC_IDS
    );
  }, [data]);

  const trustFocusMetrics = useMemo(() => {
    if (!data) return [];
    return sortMetricsByOrder(
      data.trust.metrics.filter((metric) => TRUST_FOCUS_ORDER.includes(metric.id as (typeof TRUST_FOCUS_ORDER)[number])),
      TRUST_FOCUS_ORDER
    );
  }, [data]);

  const trustSupportMetrics = useMemo(() => {
    if (!data) return [];
    const focusIds = new Set<string>(TRUST_FOCUS_ORDER);
    return data.trust.metrics.filter((metric) => !focusIds.has(metric.id));
  }, [data]);

  const zoneSummary = useMemo(() => {
    return data?.liquidity.usersByZone || null;
  }, [data]);

  const selectedZoneSnapshot = useMemo(() => {
    if (!zoneSummary || selectedZone === 'all') {
      return null;
    }

    return zoneSummary.zones.find((zone) => zone.zone === selectedZone) || null;
  }, [selectedZone, zoneSummary]);

  const selectedZoneMetrics = useMemo(() => {
    if (!zoneSummary) {
      return null;
    }

    const professionals = selectedZoneSnapshot ? selectedZoneSnapshot.professionals : zoneSummary.classifiedProfessionals;
    const families = selectedZoneSnapshot ? selectedZoneSnapshot.families : zoneSummary.classifiedFamilies;
    const totalUsers = professionals + families;
    const professionalsPerFamily = families > 0 ? Number((professionals / families).toFixed(2)) : null;

    return {
      professionals,
      families,
      totalUsers,
      professionalsPerFamily,
    };
  }, [selectedZoneSnapshot, zoneSummary]);

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
              value={selectedZone}
              onChange={(event) => setSelectedZone(event.target.value as DashboardZoneKey | 'all')}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">Todas as zonas</option>
              {data.liquidity.usersByZone.zones.map((zone) => (
                <option key={zone.zone} value={zone.zone}>{zone.label}</option>
              ))}
            </select>
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
          <span>Filtro de zona: {selectedZoneSnapshot?.label || 'Todas as zonas'}</span>
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
        description="Cards de leitura rapida para volume atual. A mini tendencia aparece apenas como apoio, sem tirar protagonismo da decisao executiva."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {executivePrimaryMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {executiveSecondaryMetrics.length > 0 ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Leituras complementares</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {executiveSecondaryMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-slate-500">
          Receita recorrente vs pontual e LTV observado ficam fora da primeira dobra enquanto o contrato atual nao expuser base financeira historica com confianca suficiente.
        </p>
      </SectionBlock>

      <SectionBlock
        title="Bloco 2 — Funil principal de contratacao"
        description="Somente a jornada oficial a partir de solicitacao iniciada. O funil visual e protagonista; tempos e abandono aparecem como leitura complementar acionavel."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Funil oficial</h3>
                <p className="mt-1 text-xs text-slate-500">{data.funnel.summary}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">Obrigatorio</span>
            </div>
            <div className="mt-4">
              <FunnelVisual steps={funnelJourneySteps} />
            </div>
          </div>

          <div className="space-y-4">
            <StepBarList title="Tempo medio de resposta por fase" items={funnelConversionItems} tone="sky" />
            <StepBarList title="Abandono por etapa" items={funnelDropoffItems} tone="rose" />
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          A leitura parte de solicitacao iniciada. Motivos de abandono e tempos por lado so entram quando a base real trouxer causalidade e timestamps sustentados o suficiente para nao induzir leitura errada.
        </p>
      </SectionBlock>

      <SectionBlock
        title="Bloco 3 — Saude operacional"
        description="Taxas, tempos e gargalos que mostram onde a operacao trava e onde a conversao precisa de intervencao."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <StepBarList
            title="Taxa de conversao por etapa"
            items={conversionRateMetrics.map((metric) => ({
              id: metric.id,
              label: metric.label,
              value: getNumericMetricValue(metric),
              helper: metric.decision,
            }))}
            tone="emerald"
          />
          <DiagnosticBarList metrics={timingMetrics} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[2fr,1fr]">
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
        description="Os primeiros graficos cruzam profissionais e familias por zona; abaixo, liquidez operacional continua por regiao para leitura de cobertura e gap."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr,1fr,0.9fr]">
          <ZoneDistributionPieCard
            title="Profissionais por zona"
            description="Distribuicao da base profissional classificada nas quatro zonas principais de Sao Paulo."
            zones={data.liquidity.usersByZone.zones}
            selectedZone={selectedZone}
            valueKey="professionals"
          />
          <ZoneDistributionPieCard
            title="Familias por zona"
            description="Distribuicao da base de familias classificada nas quatro zonas principais de Sao Paulo."
            zones={data.liquidity.usersByZone.zones}
            selectedZone={selectedZone}
            valueKey="families"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Profissionais x clientes</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedZoneSnapshot ? `${selectedZoneSnapshot.label} em foco.` : 'Resumo consolidado das zonas classificadas.'}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                {selectedZoneSnapshot?.label || 'Todas'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Profissionais</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{selectedZoneMetrics ? formatCount(selectedZoneMetrics.professionals) : '0'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Familias</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{selectedZoneMetrics ? formatCount(selectedZoneMetrics.families) : '0'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Relacao prof./familia</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedZoneMetrics?.professionalsPerFamily !== null && selectedZoneMetrics
                    ? `${selectedZoneMetrics.professionalsPerFamily.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`
                    : 'Sem base'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/80 p-3 text-xs text-slate-600">
              <p>
                Fora das quatro zonas: {formatCount(data.liquidity.usersByZone.unclassifiedProfessionals)} profissionais e {formatCount(data.liquidity.usersByZone.unclassifiedFamilies)} familias sem classificacao confiavel de zona em Sao Paulo.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.liquidity.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr,1fr]">
          <RegionHeatmap regions={data.liquidity.regions} />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Tabela de gaps regionais</h3>
            <p className="mt-1 text-xs text-slate-500">Leitura detalhada para decidir onde falta oferta, proposta ou match operacional.</p>
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

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Oferta x demanda por regiao</h3>
          <div className="mt-4 space-y-4">
            {data.liquidity.regions.map((region) => {
              const maxRegionValue = Math.max(region.requestsCreated, region.matchedJobs, 1);
              const demandWidth = (region.requestsCreated / maxRegionValue) * 100;
              const matchWidth = (region.matchedJobs / maxRegionValue) * 100;

              return (
                <div key={`${region.region}-comparison`}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-slate-900">{region.region}</p>
                    <p className="text-xs text-slate-500">Gap sem proposta: {formatPercentage(region.withoutProposalRate)}</p>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Demanda criada</span>
                        <span>{region.requestsCreated.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-sky-600" style={{ width: `${demandWidth}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Jobs com match</span>
                        <span>{region.matchedJobs.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${matchWidth}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Bloco 5 — Confianca e experiencia"
        description="Reembolso e cancelamento recebem visibilidade clara. Indicadores menos criticos, como WhatsApp, aparecem como apoio diagnostico e nao como protagonistas."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {trustFocusMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {trustSupportMetrics.length > 0 ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnosticos de confianca e UX</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trustSupportMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </div>
        ) : null}
      </SectionBlock>

      <SectionBlock
        title="Bloco 6 — Alertas e excecoes"
        description={highPriorityAlerts.length > 0 ? 'Itens que pedem acao imediata ou monitoramento reforcado.' : 'Nenhum alerta prioritario ativo nesta janela.'}
      >
        <div className="space-y-3">
          {data.alerts.items.map((alert) => (
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