'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import type {
  DashboardV3Response,
  OperationalStatus,
  SourceFreshness,
  TimeWindow,
} from '@/services/admin/dashboardV3Types';

export const dynamic = 'force-dynamic';

function statusPillClass(status: OperationalStatus): string {
  if (status === 'critical') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (status === 'ok') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function freshnessChipClass(status: SourceFreshness['status']): string {
  if (status === 'unavailable') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'stale') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

function alertPillClass(severity: 'critical' | 'high' | 'medium' | 'low' | 'info'): string {
  if (severity === 'critical') return 'bg-red-100 text-red-700 border-red-200';
  if (severity === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (severity === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (severity === 'low') return 'bg-sky-100 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function rankStatusClass(status: 'stable' | 'attention' | 'critical'): string {
  if (status === 'critical') return 'text-red-700';
  if (status === 'attention') return 'text-amber-700';
  return 'text-emerald-700';
}

function formatDateTime(value?: string): string {
  if (!value) return 'Sem registro';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem registro';
  return parsed.toLocaleString('pt-BR');
}

function formatCardValue(value: number | string, unit?: string): string {
  if (typeof value === 'string') return value;
  return unit ? `${value.toLocaleString('pt-BR')} ${unit}` : value.toLocaleString('pt-BR');
}

function DataIntegrityBanner({
  freshness,
  hasInsufficientSamples,
}: {
  freshness: DashboardV3Response['freshness'];
  hasInsufficientSamples: boolean;
}) {
  const unavailable = Object.entries(freshness).filter(([, source]) => source.status === 'unavailable');
  const stale = Object.entries(freshness).filter(([, source]) => source.status === 'stale');

  const bannerClass =
    unavailable.length > 0
      ? 'bg-red-50 border-red-200'
      : stale.length > 0 || hasInsufficientSamples
        ? 'bg-amber-50 border-amber-200'
        : 'bg-emerald-50 border-emerald-200';

  let title = 'Fontes operacionais atualizadas';
  let description = 'Todos os conectores reportaram dados recentes.';

  if (unavailable.length > 0) {
    title = 'Dados indisponiveis em uma ou mais fontes';
    description = `Fonte(s) indisponivel(is): ${unavailable.map(([name]) => name).join(', ')}.`;
  } else if (stale.length > 0) {
    title = 'Parte dos dados esta desatualizada';
    description = `Fonte(s) com atraso: ${stale.map(([name]) => name).join(', ')}.`;
  }

  if (hasInsufficientSamples) {
    description = `${description} Alguns blocos estao com amostra insuficiente.`;
  }

  return (
    <section className={`rounded-lg border p-4 ${bannerClass}`}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Integridade das fontes</h2>
          <p className="text-sm text-gray-700 mt-1">{title}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(freshness).map(([name, source]) => (
            <span
              key={name}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${freshnessChipClass(source.status)}`}
            >
              <span className="uppercase">{name}</span>
              <span>{source.status}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-lg bg-slate-200 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 rounded-lg bg-slate-200 animate-pulse" />
        ))}
      </div>
      <div className="h-52 rounded-lg bg-slate-200 animate-pulse" />
      <div className="h-52 rounded-lg bg-slate-200 animate-pulse" />
    </div>
  );
}

export default function AdminOperationalHomePage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();

  const [data, setData] = useState<DashboardV3Response | null>(null);
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

      const payload: DashboardV3Response = await response.json();
      setData(payload);
      setLastUpdated(new Date());
    } catch (requestError) {
      console.error('[AdminHome] Falha ao carregar home operacional:', requestError);
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

  const hasInsufficientSamples = useMemo(() => {
    if (!data) return false;

    const cardInsufficient = data.cards.some((card) => card.sample && !card.sample.isSufficient);
    const queueInsufficient = !!(data.criticalQueue.sample && !data.criticalQueue.sample.isSufficient);
    const alertInsufficient = !!(data.activeAlerts.sample && !data.activeAlerts.sample.isSufficient);
    const rankingInsufficient = !!(data.localRanking.sample && !data.localRanking.sample.isSufficient);

    return cardInsufficient || queueInsufficient || alertInsufficient || rankingInsufficient;
  }, [data]);

  if (authLoading || (isLoading && !data)) {
    return <LoadingState />;
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Acesso restrito</h2>
        <p className="mt-2 text-sm text-gray-600">Somente administradores podem acessar esta home.</p>
        <Link href="/admin/login" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Fazer login
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">Dados indisponiveis</h2>
        <p className="mt-2 text-sm text-red-600">
          Nao foi possivel carregar a home operacional. {error ? `Detalhe: ${error}` : ''}
        </p>
        <button
          onClick={fetchData}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Operacional</h1>
          <p className="mt-1 text-sm text-gray-600">
            Janela de {data.window} dias | Ultima leitura: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : 'Sem registro'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Gerado em: {formatDateTime(data.timestamp)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={timeWindow}
            onChange={(event) => setTimeWindow(Number(event.target.value) as TimeWindow)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Atualizar
          </button>

          <Link
            href="/admin/torre-de-controle"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Detalhes v3
          </Link>
        </div>
      </header>

      <DataIntegrityBanner freshness={data.freshness} hasInsufficientSamples={hasInsufficientSamples} />

      {error && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Houve erro no ultimo refresh: {error}
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Cards operacionais</h2>
          <span className="text-xs text-gray-500">Exibindo ate 6 cards reais</span>
        </div>

        {data.cards.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum card operacional disponivel para o periodo selecionado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.cards.slice(0, 6).map((card) => (
              <article key={card.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium text-gray-700">{card.title}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusPillClass(card.status)}`}>
                    {card.status}
                  </span>
                </div>

                <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCardValue(card.value, card.unit)}</p>

                {card.trend && (
                  <p className="mt-1 text-xs text-gray-600">
                    Tendencia: {card.trend.direction} ({card.trend.changePercent.toFixed(1)}%)
                  </p>
                )}

                <p className="mt-2 text-xs text-gray-500">Fonte: {card.source.join(', ')}</p>

                {card.sample && !card.sample.isSufficient && (
                  <p className="mt-2 text-xs text-amber-700">
                    Amostra insuficiente ({card.sample.sampleSize}/{card.sample.minimumRequired})
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Fila critica</h2>
            <span className="text-sm font-medium text-gray-700">Total: {data.criticalQueue.total}</span>
          </div>

          {data.criticalQueue.items.length === 0 ? (
            <p className="text-sm text-gray-600">Sem itens criticos no momento.</p>
          ) : (
            <div className="space-y-3">
              {data.criticalQueue.items.slice(0, 8).map((item) => (
                <article key={item.id} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-xs text-gray-600">{item.region.label} • {item.status}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${alertPillClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span>Espera: {item.hoursWaiting}h</span>
                    <span>Criado: {formatDateTime(item.createdAt)}</span>
                    {item.nextAction && <span>Proxima acao: {item.nextAction}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Alertas ativos</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">C: {data.activeAlerts.critical}</span>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">A: {data.activeAlerts.high}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">M: {data.activeAlerts.medium}</span>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">B: {data.activeAlerts.low}</span>
            </div>
          </div>

          {data.activeAlerts.items.length === 0 ? (
            <p className="text-sm text-gray-600">Sem alertas ativos no periodo.</p>
          ) : (
            <div className="space-y-3">
              {data.activeAlerts.items.slice(0, 8).map((alert) => (
                <article key={alert.id} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                      <p className="mt-1 text-xs text-gray-600">{alert.description}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${alertPillClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span>Ocorrencias: {alert.count}</span>
                    <span>Fonte: {alert.source.join(', ')}</span>
                    <span>Aberto em: {formatDateTime(alert.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Ranking local</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Micro-regiao ou equivalente disponivel</span>
            <span className={`rounded-full border px-2 py-0.5 ${freshnessChipClass(data.localRanking.freshness.status)}`}>
              {data.localRanking.freshness.status}
            </span>
          </div>
        </div>

        <p className="mb-3 text-xs text-gray-500">
          {data.localRanking.observation.supplyDefinition} {data.localRanking.observation.ratioPolicy}
        </p>

        {data.localRanking.items.length === 0 ? (
          <p className="text-sm text-gray-600">Ranking local indisponivel para a janela selecionada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-2">Regiao</th>
                  <th className="px-2 py-2">Especialidade</th>
                  <th className="px-2 py-2">Jobs elegiveis</th>
                  <th className="px-2 py-2">Oferta observada</th>
                  <th className="px-2 py-2">Razao D/O</th>
                  <th className="px-2 py-2">Criticos locais</th>
                  <th className="px-2 py-2">Sinal</th>
                  <th className="px-2 py-2">Observacao</th>
                </tr>
              </thead>
              <tbody>
                {data.localRanking.items.slice(0, 12).map((entry) => (
                  <tr key={`${entry.region}-${entry.specialty || 'all'}`} className="border-b border-gray-100">
                    <td className="px-2 py-2 text-gray-900">{entry.label}</td>
                    <td className="px-2 py-2">{entry.specialty || 'Nao informado'}</td>
                    <td className="px-2 py-2">{entry.eligibleJobs.toLocaleString('pt-BR')}</td>
                    <td className="px-2 py-2">{entry.observedSupply.toLocaleString('pt-BR')}</td>
                    <td className="px-2 py-2">{entry.demandSupplyRatio !== undefined ? entry.demandSupplyRatio.toFixed(2) : 'N/D'}</td>
                    <td className="px-2 py-2">{entry.localCriticalJobs.toLocaleString('pt-BR')}</td>
                    <td className={`px-2 py-2 font-medium ${rankStatusClass(entry.localCriticality)}`}>{entry.localCriticality}</td>
                    <td className="px-2 py-2 text-xs text-gray-500">{entry.notes?.[0] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
