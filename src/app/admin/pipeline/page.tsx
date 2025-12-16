'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authFetch } from '@/lib/client/authFetch';
import type { PipelineData } from '@/services/admin/pipeline';

export default function AdminPipelinePage() {
  const router = useRouter();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch('/api/admin/pipeline');
      if (!response.ok) throw new Error('Erro ao carregar pipeline');

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged') === 'true';
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    fetchData();
  }, [fetchData, router]);

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${Math.round(hours % 24)}h`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header com Logo */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className="relative w-16 h-16 cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <Image src="/logo-cuide-me.png" alt="Cuide-me" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Pipeline de Contratação</h1>
              <p className="text-sm text-black mt-1">Funil de conversão e gargalos</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-black">❌ {error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-black text-xl">Carregando pipeline...</p>
          </div>
        ) : data ? (
          <>
            {/* Resumo - Cards principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Total de Solicitações</div>
                <div className="text-4xl font-bold text-black">{data.totalRequests}</div>
                <div className="text-xs text-gray-600 mt-2">Requests + Jobs</div>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Taxa de Conversão</div>
                <div className="text-4xl font-bold text-black">
                  {data.overallConversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-2">Início → Fim</div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Gargalos Ativos</div>
                <div className="text-4xl font-bold text-black">{data.bottlenecks.length}</div>
                <div className="text-xs text-gray-600 mt-2">&gt; 48h parado</div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Total Perdido</div>
                <div className="text-4xl font-bold text-black">
                  {data.statusBreakdown.rejected +
                    data.statusBreakdown.cancelled +
                    data.statusBreakdown.declined +
                    data.statusBreakdown.expired}
                </div>
                <div className="text-xs text-gray-600 mt-2">Rejeitados + Cancelados</div>
              </div>
            </div>

            {/* Breakdown de Status Negativos */}
            {data.negativeFunnel.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-black mb-6">
                  📉 Funil Negativo (Não Converteram)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-2xl">❌</div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-black">
                          {data.statusBreakdown.rejected}
                        </div>
                        <div className="text-xs text-gray-600">
                          {((data.statusBreakdown.rejected / data.totalRequests) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-black">Propostas Rejeitadas</div>
                    <div className="text-xs text-gray-600 mt-1">Cliente recusou a proposta</div>
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-2xl">🚫</div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-black">
                          {data.statusBreakdown.cancelled}
                        </div>
                        <div className="text-xs text-gray-600">
                          {((data.statusBreakdown.cancelled / data.totalRequests) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-black">Jobs Cancelados</div>
                    <div className="text-xs text-gray-600 mt-1">Cancelado após aceite</div>
                  </div>

                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-2xl">👎</div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-black">
                          {data.statusBreakdown.declined}
                        </div>
                        <div className="text-xs text-gray-600">
                          {((data.statusBreakdown.declined / data.totalRequests) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-black">Recusados</div>
                    <div className="text-xs text-gray-600 mt-1">Profissional recusou</div>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-2xl">⏰</div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-black">
                          {data.statusBreakdown.expired}
                        </div>
                        <div className="text-xs text-gray-600">
                          {((data.statusBreakdown.expired / data.totalRequests) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-black">Expiradas</div>
                    <div className="text-xs text-gray-600 mt-1">Tempo limite excedido</div>
                  </div>
                </div>
              </div>
            )}

            {/* Funil Visual Positivo */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">📊 Funil de Conversão (Ativos)</h2>
              <div className="space-y-4">
                {data.stages.map((stage, index) => {
                  const widthPercent =
                    data.totalRequests > 0 ? (stage.count / data.totalRequests) * 100 : 0;
                  
                  // Calcular % de conversão do estágio anterior
                  const conversionFromPrevious = index > 0 
                    ? ((stage.count / (data.stages[index - 1]?.count || 1)) * 100).toFixed(1)
                    : '100.0';

                  return (
                    <div key={stage.id} className="bg-white border-2 border-black rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-black">{stage.name}</h3>
                          <div className="flex gap-4 mt-2">
                            <p className="text-sm text-black">
                              📊 {stage.count} solicitações
                            </p>
                            <p className="text-sm text-black">
                              ⏱️ Tempo médio: {formatHours(stage.avgTimeInStage)}
                            </p>
                            {index > 0 && (
                              <p className="text-sm font-semibold text-blue-600">
                                ↓ {conversionFromPrevious}% conversão
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-black">{stage.count}</div>
                          <div className="text-sm text-gray-600">
                            {widthPercent.toFixed(1)}% do total
                          </div>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-200 h-10 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 flex items-center justify-center text-white font-bold text-sm"
                          style={{ width: `${Math.max(widthPercent, 5)}%` }}
                        >
                          {widthPercent > 5 && `${widthPercent.toFixed(0)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gargalos */}
            {data.bottlenecks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-black mb-6">⚠️ Gargalos (&gt; 48h)</h2>
                <div className="space-y-4">
                  {data.bottlenecks.map(bottleneck => (
                    <div
                      key={bottleneck.stage}
                      className="bg-red-50 border-2 border-red-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold text-black">{bottleneck.stage}</h3>
                          <p className="text-sm text-black">
                            {bottleneck.count} solicitações paradas
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-black">
                            {formatHours(bottleneck.avgTime)}
                          </div>
                          <div className="text-sm text-black">tempo médio</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Análise de Ciclo */}
            {data.cycleAnalysis && data.cycleAnalysis.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-black mb-6">
                  ⏱️ Análise de Ciclo por Etapa
                </h2>
                <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-4 text-sm font-bold text-black">Etapa</th>
                        <th className="text-center p-4 text-sm font-bold text-black">
                          Tempo na Etapa
                        </th>
                        <th className="text-center p-4 text-sm font-bold text-black">
                          Tempo Acumulado
                        </th>
                        <th className="text-center p-4 text-sm font-bold text-black">
                          Taxa Conversão
                        </th>
                        <th className="text-center p-4 text-sm font-bold text-black">
                          Taxa Abandono
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cycleAnalysis.map((cycle, index) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="p-4 text-sm text-black font-medium">
                            {cycle.stageName}
                          </td>
                          <td className="p-4 text-sm text-center text-black">
                            {formatHours(cycle.avgTimeInStage)}
                          </td>
                          <td className="p-4 text-sm text-center text-black font-semibold">
                            {formatHours(cycle.avgTimeToReach)}
                          </td>
                          <td className="p-4 text-sm text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full font-semibold ${
                                cycle.conversionRate >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : cycle.conversionRate >= 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {cycle.conversionRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-4 text-sm text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full font-semibold ${
                                cycle.dropoffRate <= 20
                                  ? 'bg-green-100 text-green-800'
                                  : cycle.dropoffRate <= 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {cycle.dropoffRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legenda */}
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="text-sm font-bold text-black mb-2">📚 Legenda:</h3>
                  <ul className="text-xs text-black space-y-1">
                    <li>
                      <strong>Tempo na Etapa:</strong> Tempo médio que as solicitações ficam nesta
                      etapa
                    </li>
                    <li>
                      <strong>Tempo Acumulado:</strong> Tempo total médio desde o início até esta
                      etapa
                    </li>
                    <li>
                      <strong>Taxa de Conversão:</strong> % de solicitações que avançam para a
                      próxima etapa
                    </li>
                    <li>
                      <strong>Taxa de Abandono:</strong> % de solicitações que NÃO avançam (perda)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
