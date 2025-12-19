/**
 * ────────────────────────────────────────────────────────────────────────────
 * OPS V2 - PÁGINA PRINCIPAL
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Dashboard operacional com SLA, matching e capacidade.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DateRangePicker, DateRange, ErrorBoundary, LoadingState, MetricCard } from '@/components/shared';

export default function OpsV2Page() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '30daysAgo',
    endDate: 'today',
    label: 'Últimos 30 dias',
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

      const [slaRes, capacityRes] = await Promise.all([
        fetch(`/api/admin/ops-v2/sla?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/admin/ops-v2/capacity?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ]);

      if (!slaRes.ok || !capacityRes.ok) {
        throw new Error('Erro ao carregar dados operacionais');
      }

      const [slaData, capacityData] = await Promise.all([slaRes.json(), capacityRes.json()]);
      setData({ sla: slaData, capacity: capacityData });
    } catch (err: any) {
      console.error('[Ops V2] Error:', err);
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
                <h1 className="text-3xl font-bold text-gray-900">Operações</h1>
                <p className="text-sm text-gray-600 mt-1">
                  SLA, matching e planejamento de capacidade
                </p>
              </div>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {loading ? (
            <LoadingState message="Carregando dados operacionais..." />
          ) : (
            <>
              {/* SLA Metrics */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">SLA & Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Compliance Rate"
                    value={`${data.sla.overall.complianceRate.toFixed(1)}%`}
                    subtitle="Dentro do SLA de 24h"
                    change={{
                      value: Math.abs(data.sla.trends.last7Days - data.sla.trends.last30Days),
                      label: 'vs 30 dias',
                      isPositive: data.sla.trends.direction === 'improving',
                    }}
                    icon={<span className="text-xl">⏱️</span>}
                    color={
                      data.sla.overall.complianceRate >= 90
                        ? 'green'
                        : data.sla.overall.complianceRate >= 80
                        ? 'yellow'
                        : 'red'
                    }
                  />
                  <MetricCard
                    title="Tempo Médio"
                    value={`${data.sla.overall.avgResponseTime.toFixed(0)}h`}
                    subtitle="Resposta média"
                    icon={<span className="text-xl">📊</span>}
                    color="blue"
                  />
                  <MetricCard
                    title="SLA Breaches"
                    value={data.sla.overall.breachedSLA}
                    subtitle="Jobs acima de 24h"
                    icon={<span className="text-xl">⚠️</span>}
                    color={data.sla.overall.breachedSLA > 10 ? 'red' : 'yellow'}
                  />
                  <MetricCard
                    title="Dentro do Prazo"
                    value={data.sla.overall.withinSLA}
                    subtitle="Jobs dentro do SLA"
                    icon={<span className="text-xl">✅</span>}
                    color="green"
                  />
                </div>
              </section>

              {/* SLA by Time Window */}
              <section>
                <div className="border rounded-lg bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribuição por Tempo de Resposta
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(data.sla.byTimeWindow).map(([window, count]: [string, any]) => {
                      const percentage = (count / data.sla.overall.totalJobs) * 100;
                      return (
                        <div key={window}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{window}</span>
                            <span className="text-sm text-gray-600">
                              {count} jobs ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                window.includes('<4h')
                                  ? 'bg-green-500'
                                  : window.includes('<8h')
                                  ? 'bg-blue-500'
                                  : window.includes('<24h')
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Capacity Planning */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Planejamento de Capacidade</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Profissionais Ativos"
                    value={data.capacity.supply.activeProfessionals}
                    subtitle={`de ${data.capacity.supply.totalProfessionals} total`}
                    icon={<span className="text-xl">👥</span>}
                    color="blue"
                  />
                  <MetricCard
                    title="Taxa de Utilização"
                    value={`${data.capacity.supply.utilizationRate.toFixed(1)}%`}
                    subtitle="Jobs por profissional"
                    icon={<span className="text-xl">📊</span>}
                    color={
                      data.capacity.supply.utilizationRate > 80
                        ? 'red'
                        : data.capacity.supply.utilizationRate > 60
                        ? 'yellow'
                        : 'green'
                    }
                  />
                  <MetricCard
                    title="Supply/Demand Ratio"
                    value={`${data.capacity.balance.supplyDemandRatio.toFixed(2)}`}
                    subtitle={data.capacity.balance.status}
                    icon={<span className="text-xl">⚖️</span>}
                    color={
                      data.capacity.balance.status === 'balanced'
                        ? 'green'
                        : data.capacity.balance.status === 'undersupply'
                        ? 'red'
                        : 'yellow'
                    }
                  />
                  <MetricCard
                    title="Gap de Contratação (30d)"
                    value={data.capacity.projections.day30.gap}
                    subtitle={`${data.capacity.projections.day30.requiredProfessionals} necessários`}
                    icon={<span className="text-xl">🎯</span>}
                    color={data.capacity.projections.day30.gap > 10 ? 'red' : 'yellow'}
                  />
                </div>
              </section>

              {/* Bottlenecks by Specialty */}
              {data.capacity.balance.bottlenecks.length > 0 && (
                <section>
                  <div className="border rounded-lg bg-orange-50 border-orange-200 p-6">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-900 mb-2">
                          Gargalos Identificados ({data.capacity.balance.bottlenecks.length})
                        </h3>
                        <div className="space-y-2">
                          {data.capacity.balance.bottlenecks.map((specialty: string, i: number) => (
                            <div key={i} className="text-sm text-orange-700">
                              • <span className="font-medium">{specialty}</span> com utilização &gt;80%
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 text-sm text-orange-700 space-y-1">
                          {data.capacity.balance.recommendations.slice(0, 3).map((rec: string, i: number) => (
                            <div key={i}>→ {rec}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* SLA by Specialty */}
              <section>
                <div className="border rounded-lg bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA por Especialidade</h3>
                  <div className="space-y-2">
                    {data.sla.bySpecialty.slice(0, 5).map((spec: any) => (
                      <div key={spec.specialty} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{spec.specialty}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{spec.total} jobs</span>
                          <span
                            className={`text-sm font-semibold px-2 py-1 rounded ${
                              spec.complianceRate >= 90
                                ? 'bg-green-100 text-green-800'
                                : spec.complianceRate >= 80
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {spec.complianceRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
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
