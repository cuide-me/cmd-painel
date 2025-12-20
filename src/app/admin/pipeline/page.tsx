'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import DateRangeFilter, { type DateRange } from '@/components/admin/DateRangeFilter';
import ExportButton from '@/components/admin/ExportButton';
import SimpleLineChart from '@/components/admin/charts/SimpleLineChart';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import type { PipelineData } from '@/services/admin/pipeline';

export default function AdminPipelinePage() {
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/admin/pipeline';
      if (dateRange) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Erro ao carregar pipeline');
      const result = await response.json();
      setData(result.success ? result.data : result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const { isEnabled, countdown, toggle, reset } = useAutoRefresh({
    onRefresh: fetchData,
    interval: 60000, // 60 segundos
    enabled: false
  });

  useEffect(() => {
    if (!authReady) return;
    fetchData();
  }, [authReady, fetchData]);

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${Math.round(hours % 24)}h`;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  };

  if (loading) {
    return (
      <AdminLayout title="Pipeline V2" subtitle="Sprint 5 - Velocity & Forecast" icon="🎯">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Pipeline V2" subtitle="Sprint 5 - Velocity & Forecast" icon="🎯">
        <EmptyState icon="⚠️" title="Erro ao carregar" description={error || 'Erro desconhecido'} action="Tentar novamente" onAction={fetchData} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pipeline V2" subtitle="Sprint 5 - Velocity, Conversão, Forecast" icon="🎯">
      {/* Filtros e Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <DateRangeFilter onRangeChange={(range) => { setDateRange(range); setTimeout(() => fetchData(), 100); }} />
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggle}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isEnabled 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEnabled ? `🔄 Auto (${countdown}s)` : '⏸️ Auto-refresh OFF'}
          </button>
          <ExportButton data={data} filename="pipeline" />
          <button
            onClick={() => { fetchData(); reset(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Gráfico de Conversão */}
      <SimpleLineChart
        title="📈 Taxa de Conversão por Etapa"
        data={data.stages.map(stage => ({
          label: stage.name.substring(0, 15),
          value: stage.percentage
        }))}
        height={200}
        color="#10b981"
      />

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Oportunidades Ativas"
          value={data.stages.reduce((sum, s) => sum + s.count, 0)}
          icon="🎯"
          tooltip="Total de solicitações em andamento no pipeline (não inclui rejeitadas/canceladas)"
        />
        <StatCard
          label="Total Geral"
          value={data.totalRequests}
          icon="📋"
          tooltip="Todas as oportunidades incluindo ativas e pipeline negativa"
        />
        <StatCard
          label="Taxa Conversão"
          value={`${data.overallConversionRate.toFixed(1)}%`}
          icon="📊"
          tooltip="Percentual de oportunidades que chegam até o final do funil"
        />
        <StatCard
          label="Pipeline Negativa"
          value={data.negativePipeline.reduce((sum, n) => sum + n.count, 0)}
          icon="❌"
          tooltip="Total de jobs cancelados"
        />
      </div>

      {/* Stages */}
      <Section title="Etapas do Pipeline" tooltip="Oportunidades ativas em cada etapa do funil de vendas">
        <div className="space-y-3">
          {data.stages.map(stage => (
            <Card key={stage.id} padding="md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                <Badge variant="info">{stage.count}</Badge>
              </div>
              <div className="flex gap-4 text-sm text-slate-600">
                <span>{stage.percentage.toFixed(1)}%</span>
                <span>Tempo médio: {(stage.avgTimeInStage / 24).toFixed(1)} dias</span>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Pipeline Negativa */}
      {data.negativePipeline && data.negativePipeline.length > 0 && (
        <Section title="Pipeline Negativa" tooltip="Jobs que saíram do funil">
          <div className="space-y-3">
            {data.negativePipeline.map((item, idx) => (
              <Card key={idx} padding="md" className="border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{item.stage}</h3>
                  <Badge variant="error">{item.count}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Bottlenecks */}
      {data.bottlenecks.length > 0 && (
        <Section title="Gargalos" tooltip="Etapas onde oportunidades ficam presas por mais de 48 horas">
          <div className="space-y-2">
            {data.bottlenecks.map((b, i) => (
              <Card key={i} padding="md" className="border-l-4 border-yellow-500">
                <div className="flex justify-between">
                  <span className="font-medium">{b.stage}</span>
                  <span className="text-slate-600">{b.count} itens - {(b.avgTime / 24).toFixed(1)} dias</span>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </AdminLayout>
  );
}
