/**
 * ────────────────────────────────────────────────────────────────────────────
 * QUALITY V2 - PÁGINA PRINCIPAL
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Dashboard de qualidade com NPS, tickets e feedbacks.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DateRangePicker, DateRange, ErrorBoundary, LoadingState, MetricCard } from '@/components/shared';

export default function QualityV2Page() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '90daysAgo',
    endDate: 'today',
    label: 'Últimos 90 dias',
  });

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const npsRes = await fetch(
        `/api/admin/quality-v2/nps?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );

      if (!npsRes.ok) {
        throw new Error('Erro ao carregar dados de qualidade');
      }

      const npsData = await npsRes.json();
      setData({ nps: npsData });
    } catch (err: any) {
      console.error('[Quality V2] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Qualidade</h1>
                <p className="text-sm text-gray-600 mt-1">
                  NPS, tickets de suporte e análise de feedbacks
                </p>
              </div>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {loading ? (
            <LoadingState message="Carregando dados de qualidade..." />
          ) : (
            <>
              {/* NPS Overview */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Net Promoter Score</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="NPS Score"
                    value={data.nps.overall.npsScore.toFixed(0)}
                    subtitle={`Status: ${data.nps.insights.status}`}
                    change={{
                      value: Math.abs(
                        data.nps.overall.npsScore - data.nps.trends.last90Days
                      ),
                      label: 'vs 90 dias',
                      isPositive: data.nps.trends.direction === 'improving',
                    }}
                    icon={<span className="text-xl">⭐</span>}
                    color={
                      data.nps.insights.status === 'excellent'
                        ? 'green'
                        : data.nps.insights.status === 'good'
                        ? 'blue'
                        : data.nps.insights.status === 'fair'
                        ? 'yellow'
                        : 'red'
                    }
                  />
                  <MetricCard
                    title="Promotores"
                    value={`${data.nps.overall.promoters.percentage.toFixed(1)}%`}
                    subtitle={`${data.nps.overall.promoters.count} respondentes`}
                    icon={<span className="text-xl">😊</span>}
                    color="green"
                  />
                  <MetricCard
                    title="Passivos"
                    value={`${data.nps.overall.passives.percentage.toFixed(1)}%`}
                    subtitle={`${data.nps.overall.passives.count} respondentes`}
                    icon={<span className="text-xl">😐</span>}
                    color="yellow"
                  />
                  <MetricCard
                    title="Detratores"
                    value={`${data.nps.overall.detractors.percentage.toFixed(1)}%`}
                    subtitle={`${data.nps.overall.detractors.count} respondentes`}
                    icon={<span className="text-xl">😞</span>}
                    color="red"
                  />
                </div>
              </section>

              {/* Score Distribution */}
              <section>
                <div className="border rounded-lg bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribuição de Scores (0-10)
                  </h3>
                  <div className="grid grid-cols-11 gap-2">
                    {Object.entries(data.nps.distribution)
                      .reverse()
                      .map(([score, count]: [string, any]) => {
                        const scoreNum = parseInt(score.replace('score', ''));
                        const percentage = (count / data.nps.overall.totalResponses) * 100;
                        const height = Math.max(percentage * 3, 10);

                        return (
                          <div key={score} className="flex flex-col items-center">
                            <div
                              className={`w-full rounded-t transition-all ${
                                scoreNum >= 9
                                  ? 'bg-green-500'
                                  : scoreNum >= 7
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ height: `${height}px` }}
                            />
                            <div className="text-xs font-medium mt-2">{scoreNum}</div>
                            <div className="text-xs text-gray-500">{count}</div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Detratores (0-6)</span>
                    <span>Passivos (7-8)</span>
                    <span>Promotores (9-10)</span>
                  </div>
                </div>
              </section>

              {/* NPS by Segment */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">NPS por Segmento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg bg-white shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold text-gray-900">
                          {data.nps.bySegment.clients.nps.toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {data.nps.bySegment.clients.responses} respostas
                        </div>
                      </div>
                      <div className="text-5xl">👨‍👩‍👧‍👦</div>
                    </div>
                  </div>

                  <div className="border rounded-lg bg-white shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profissionais</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold text-gray-900">
                          {data.nps.bySegment.professionals.nps.toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {data.nps.bySegment.professionals.responses} respostas
                        </div>
                      </div>
                      <div className="text-5xl">👩‍⚕️</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* NPS by Specialty */}
              <section>
                <div className="border rounded-lg bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    NPS por Especialidade
                  </h3>
                  <div className="space-y-3">
                    {data.nps.bySpecialty.map((spec: any) => (
                      <div
                        key={spec.specialty}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{spec.specialty}</div>
                          <div className="text-sm text-gray-500">
                            {spec.responses} respostas • {spec.promoters} promotores • {spec.detractors}{' '}
                            detratores
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              spec.nps > 50
                                ? 'text-green-600'
                                : spec.nps > 30
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {spec.nps.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Insights & Recommendations */}
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Main Issues */}
                  {data.nps.insights.mainIssues.length > 0 && (
                    <div className="border rounded-lg bg-red-50 border-red-200 p-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-4">
                        Problemas Identificados
                      </h3>
                      <div className="space-y-2 text-sm text-red-700">
                        {data.nps.insights.mainIssues.map((issue: string, i: number) => (
                          <div key={i}>⚠️ {issue}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Wins */}
                  <div className="border rounded-lg bg-blue-50 border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      Ações Recomendadas
                    </h3>
                    <div className="space-y-2 text-sm text-blue-700">
                      {data.nps.insights.quickWins.map((win: string, i: number) => (
                        <div key={i}>💡 {win}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Trends */}
              <section>
                <div className="border rounded-lg bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendências</h3>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {data.nps.trends.last7Days.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Últimos 7 dias</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {data.nps.trends.last30Days.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Últimos 30 dias</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {data.nps.trends.last90Days.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Últimos 90 dias</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-center">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        data.nps.trends.direction === 'improving'
                          ? 'bg-green-100 text-green-800'
                          : data.nps.trends.direction === 'declining'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {data.nps.trends.direction === 'improving' && '📈 Melhorando'}
                      {data.nps.trends.direction === 'declining' && '📉 Piorando'}
                      {data.nps.trends.direction === 'stable' && '➡️ Estável'}
                    </span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
