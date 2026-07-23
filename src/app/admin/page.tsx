'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import { DashboardAlertsList } from '@/modules/dashboard/components/DashboardAlertsList';
import { DiagnosticBarList, FunnelVisual, StepBarList } from '@/modules/dashboard/components/DashboardFunnelVisuals';
import { formatPercentage, formatValue, getComparisonLabel, getNumericMetricValue, MetricCard, statusClass } from '@/modules/dashboard/components/DashboardMetricCard';
import { DashboardTaxonomyTables } from '@/modules/dashboard/components/DashboardTaxonomyTables';
import { SourceIntegrityBanner } from '@/modules/dashboard/components/SourceIntegrityBanner';
import { RegionHeatmap } from '@/modules/dashboard/components/DashboardRegionHeatmap';
import { ZoneDistributionPieCard } from '@/modules/dashboard/components/DashboardZoneDistribution';
import { OperationalWorkQueue } from '@/modules/dashboard/components/OperationalWorkQueue';
import type {
  DashboardZoneKey,
  DashboardMetric,
  FunnelStep,
  KpiDashboardResponse,
  TimeWindow,
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

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sem registro';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem registro';
  return parsed.toLocaleString('pt-BR');
}

function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
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

function priorityTone(status: 'critical' | 'warning' | 'ok' | 'info'): string {
  if (status === 'critical') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (status === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-[#b7dde1] bg-[#effafa] text-[#176172]';
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

  const priorityItems = useMemo(() => {
    if (!data) return [];

    const alerts = highPriorityAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      status: alert.severity,
      title: alert.title,
      detail: alert.description,
      action: alert.expectedAction,
      href: '/admin/alertas',
      source: 'Alerta',
    }));
    const bottlenecks = data.operationalHealth.bottlenecks
      .filter((item) => item.status !== 'ok')
      .map((item) => ({
        id: `bottleneck-${item.id}`,
        status: item.status,
        title: item.label,
        detail: item.description,
        action: item.expectedAction,
        href: '/admin/jobs',
        source: `${item.volume.toLocaleString('pt-BR')} casos`,
      }));

    return [...alerts, ...bottlenecks].slice(0, 4);
  }, [data, highPriorityAlerts]);

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
      <header className="overflow-hidden rounded-xl border border-[#b7dde1] bg-[#effafa] p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#176172]">Central de operacao</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#173842]">Acompanhe o cuidado em movimento.</h1>
            <p className="mt-2 text-sm text-[#48636b]">
              Leitura diaria para proteger a experiencia das familias, apoiar profissionais e priorizar a operacao.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link href="/admin/jobs" className="rounded-full border border-[#b7dde1] bg-white px-3 py-1.5 text-[#176172] hover:bg-[#dff4f5]">
                Ver atendimentos
              </Link>
              <Link href="/admin/alertas" className="rounded-full border border-[#b7dde1] bg-white px-3 py-1.5 text-[#176172] hover:bg-[#dff4f5]">
                Ver alertas
              </Link>
              <Link href="/admin/financeiro" className="rounded-full border border-[#b7dde1] bg-white px-3 py-1.5 text-[#176172] hover:bg-[#dff4f5]">
                Ver financeiro
              </Link>
              <Link href="/admin/users" className="rounded-full border border-[#b7dde1] bg-white px-3 py-1.5 text-[#176172] hover:bg-[#dff4f5]">
                Ver usuarios
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedZone}
              onChange={(event) => setSelectedZone(event.target.value as DashboardZoneKey | 'all')}
              className="rounded-lg border border-[#b7dde1] bg-white px-3 py-2 text-sm text-[#173842]"
            >
              <option value="all">Todas as zonas</option>
              {data.liquidity.usersByZone.zones.map((zone) => (
                <option key={zone.zone} value={zone.zone}>{zone.label}</option>
              ))}
            </select>
            <select
              value={timeWindow}
              onChange={(event) => setTimeWindow(Number(event.target.value) as TimeWindow)}
              className="rounded-lg border border-[#b7dde1] bg-white px-3 py-2 text-sm text-[#173842]"
            >
              <option value={7}>Janela 7 dias</option>
              <option value={14}>Janela 14 dias</option>
              <option value={30}>Janela 30 dias</option>
              <option value={60}>Janela 60 dias</option>
              <option value={90}>Janela 90 dias</option>
            </select>
            <button onClick={fetchData} className="rounded-lg bg-[#176172] px-4 py-2 text-sm font-medium text-white hover:bg-[#124b58]">
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

      <section className="rounded-xl border border-[#b7dde1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176172]">Prioridades de agora</p>
            <h2 className="mt-1 text-xl font-semibold text-[#173842]">O que merece acompanhamento imediato</h2>
          </div>
          <Link href="/admin/alertas" className="text-sm font-semibold text-[#176172] hover:text-[#1195a8]">Abrir central de alertas</Link>
        </div>

        {priorityItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {priorityItems.map((item) => (
              <Link key={item.id} href={item.href} className={`block rounded-lg border p-4 transition-transform hover:-translate-y-0.5 ${priorityTone(item.status)}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="shrink-0 text-xs font-semibold">{item.source}</span>
                </div>
                <p className="mt-2 text-sm leading-5 opacity-90">{item.detail}</p>
                <p className="mt-3 text-xs font-semibold">Proxima acao: {item.action}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#b7dde1] bg-[#effafa] p-4 text-sm text-[#176172]">
            Nenhum alerta ou gargalo exige intervencao imediata nesta janela. Mantenha a rotina de acompanhamento.
          </div>
        )}
      </section>

      <OperationalWorkQueue />

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
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
        <DashboardAlertsList alerts={data.alerts.items} />
      </SectionBlock>

      <SectionBlock
        title="Taxonomia visivel no painel"
        description="Nomes amigaveis em portugues e mapeamento de eventos legados que nao devem mais ser usados na camada visual."
      >
        <DashboardTaxonomyTables taxonomy={data.taxonomy} />
      </SectionBlock>
    </div>
  );
}