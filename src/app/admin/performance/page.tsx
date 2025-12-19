'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout, { Section, Card, StatCard, Badge } from '@/components/admin/AdminLayout';
import { authFetch } from '@/lib/client/authFetch';

interface EndpointStat {
  endpoint: string;
  totalRequests: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
  lastRequest: string;
}

interface PerformanceData {
  summary: {
    totalRequests: number;
    avgDuration: number;
    avgSuccessRate: number;
    problematicCount: number;
  };
  endpoints: EndpointStat[];
  problematic: EndpointStat[];
}

export default function PerformancePage() {
  const router = useRouter();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await authFetch('/api/admin/performance-metrics');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Performance" subtitle="Carregando..." icon="⚡">
        <div>Carregando métricas...</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Performance" subtitle="Erro" icon="⚡">
        <div>Erro ao carregar métricas</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Performance Monitoring" 
      subtitle="Métricas de APIs e Serviços" 
      icon="⚡"
    >
      {/* Summary Cards */}
      <Section title="📊 Resumo Geral">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Requests"
            value={data.summary.totalRequests.toLocaleString()}
            icon="📈"
            tooltip="Total de requisições monitoradas nos últimos 1000 requests"
          />
          
          <StatCard
            label="Tempo Médio"
            value={`${data.summary.avgDuration}ms`}
            icon={data.summary.avgDuration < 500 ? '🟢' : data.summary.avgDuration < 1000 ? '🟡' : '🔴'}
            tooltip="Tempo médio de resposta de todos os endpoints"
          />
          
          <StatCard
            label="Taxa de Sucesso"
            value={`${data.summary.avgSuccessRate}%`}
            icon={data.summary.avgSuccessRate >= 95 ? '✅' : '⚠️'}
            tooltip="Percentual de requisições bem-sucedidas (status < 400)"
          />
          
          <StatCard
            label="Endpoints Problemáticos"
            value={data.summary.problematicCount.toString()}
            icon={data.summary.problematicCount === 0 ? '✅' : '🚨'}
            tooltip="Endpoints com taxa de sucesso < 95%, tempo médio > 1s ou erros"
          />
        </div>
      </Section>

      {/* Problematic Endpoints */}
      {data.problematic.length > 0 && (
        <Section title="🚨 Endpoints Problemáticos">
          <div className="space-y-3">
            {data.problematic.map((stat, idx) => (
              <Card key={idx} padding="md" className="border-l-4 border-red-500 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm font-bold text-slate-900 mb-2">
                      {stat.endpoint}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-600">Requests: </span>
                        <span className="font-semibold">{stat.totalRequests}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Média: </span>
                        <span className="font-semibold">{Math.round(stat.avgDuration)}ms</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Taxa Sucesso: </span>
                        <span className={`font-semibold ${stat.successRate < 95 ? 'text-red-600' : 'text-green-600'}`}>
                          {stat.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">Erros: </span>
                        <span className="font-semibold text-red-600">{stat.errorCount}</span>
                      </div>
                    </div>

                    {stat.lastError && (
                      <div className="mt-2 p-2 bg-white rounded text-xs text-red-700">
                        <span className="font-semibold">Último erro: </span>
                        {stat.lastError}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* All Endpoints */}
      <Section title="📋 Todos os Endpoints">
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-700">Endpoint</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Requests</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Média</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Min</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Max</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Sucesso</th>
                  <th className="text-right p-3 font-semibold text-slate-700">Erros</th>
                </tr>
              </thead>
              <tbody>
                {data.endpoints.map((stat, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      stat.successRate < 95 ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="p-3 font-mono text-xs">{stat.endpoint}</td>
                    <td className="p-3 text-right">{stat.totalRequests}</td>
                    <td className="p-3 text-right">
                      <span className={
                        stat.avgDuration < 500 ? 'text-green-600' :
                        stat.avgDuration < 1000 ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {Math.round(stat.avgDuration)}ms
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-600">{Math.round(stat.minDuration)}ms</td>
                    <td className="p-3 text-right text-slate-600">{Math.round(stat.maxDuration)}ms</td>
                    <td className="p-3 text-right">
                      <span className={stat.successRate >= 95 ? 'text-green-600' : 'text-red-600'}>
                        {stat.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {stat.errorCount > 0 && (
                        <span className="text-red-600 font-semibold">{stat.errorCount}</span>
                      )}
                      {stat.errorCount === 0 && (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Legend */}
      <Card padding="sm" className="bg-slate-50">
        <div className="text-xs text-slate-600">
          <div className="font-semibold mb-2">Legenda:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>🟢 Média &lt; 500ms: Excelente</div>
            <div>🟡 Média 500-1000ms: Aceitável</div>
            <div>🔴 Média &gt; 1000ms: Lento</div>
          </div>
          <div className="mt-2">
            <span className="font-semibold">Taxa de Sucesso:</span> % de requisições com status &lt; 400
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
