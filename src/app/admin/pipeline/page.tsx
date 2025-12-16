'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, Button, Table, LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import type { PipelineData } from '@/services/admin/pipeline';

export default function AdminPipelinePage() {
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

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
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Oportunidades"
          value={data.totalRequests}
          icon="🎯"
        />
        <StatCard
          label="Taxa Conversão"
          value={`${data.overallConversionRate.toFixed(1)}%`}
          icon="📊"
        />
        <StatCard
          label="Etapas"
          value={data.stages.length}
          icon="⏱️"
        />
      </div>

      {/* Stages */}
      <Section title="Etapas do Pipeline">
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

      {/* Bottlenecks */}
      {data.bottlenecks.length > 0 && (
        <Section title="Gargalos">
          <div className="space-y-2">
            {data.bottlenecks.map((b, i) => (
              <Card key={i} padding="md" className="border-l-4 border-red-500">
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
