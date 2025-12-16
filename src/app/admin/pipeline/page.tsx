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
        <EmptyState icon="⚠️" title="Erro ao carregar" description={error} action="Tentar novamente" onAction={fetchData} />
      </AdminLayout>
    );
  }

  const funnel = data.funnel;
  const velocity = data.velocity;
  const bottlenecks = data.bottlenecks;
  const forecast = data.forecast;

  return (
    <AdminLayout title="Pipeline V2" subtitle="Sprint 5 - Velocity, Conversão, Forecast" icon="🎯">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard
          label="Oportunidades"
          value={funnel.total}
          icon="🎯"
        />
        <StatCard
          label="Taxa Conversão"
          value={`${funnel.overallConversionRate.toFixed(1)}%`}
          icon="📊"
          trend="up"
          change={5.2}
        />
        <StatCard
          label="Ciclo Médio"
          value={formatHours(velocity.averageCycleTime)}
          icon="⏱️"
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(funnel.totalValue)}
          icon="💰"
        />
        <StatCard
          label="Velocity"
          value={`R$ ${velocity.weeklyVelocity.toFixed(0)}/sem`}
          icon="⚡"
          trend="up"
          change={8.5}
        />
      </div>

      {/* Funnel Stages */}
      <Section title="Funil de Conversão">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {funnel.stages.map((stage: any, i: number) => (
            <Card
              key={i}
              padding="md"
              className={`cursor-pointer transition-all ${
                selectedStage === stage.name ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedStage(stage.name)}
            >
              <p className="text-xs text-slate-600 mb-1">{stage.name}</p>
              <p className="text-xl font-bold text-slate-900 mb-1">{stage.count}</p>
              <p className="text-xs text-green-600 font-medium">{formatCurrency(stage.value)}</p>
              {i > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Conv.</span>
                    <span>{stage.conversionFromPrevious.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${stage.conversionFromPrevious}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* Velocity Metrics */}
      <Section title="Métricas de Velocity">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Deals Fechados (30d)</p>
            <p className="text-2xl font-bold text-slate-900">{velocity.dealsClosedLast30Days}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Taxa de Vitória</p>
            <p className="text-2xl font-bold text-green-600">{velocity.winRate.toFixed(1)}%</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Tempo Médio no Stage</p>
            <p className="text-2xl font-bold text-slate-900">{formatHours(velocity.averageTimeInStage)}</p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-slate-600 mb-1">Velocity Semanal</p>
            <p className="text-2xl font-bold text-blue-600">R$ {velocity.weeklyVelocity.toFixed(0)}</p>
          </Card>
        </div>
      </Section>

      {/* Bottlenecks */}
      {bottlenecks && bottlenecks.length > 0 && (
        <Section title="Gargalos Identificados">
          <div className="space-y-2">
            {bottlenecks.slice(0, 5).map((bottleneck: any, i: number) => (
              <Card key={i} padding="md" className="border-l-4 border-orange-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-900">{bottleneck.stage}</h4>
                      <Badge variant="warning">Gargalo</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{bottleneck.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>⏱️ {formatHours(bottleneck.averageTime)}</span>
                      <span>📊 {bottleneck.affectedDeals} deals</span>
                      <span className="text-red-600 font-medium">Impacto: {formatCurrency(bottleneck.impact)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">{bottleneck.severity}</p>
                    <p className="text-xs text-slate-600">Severidade</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Forecast */}
      <Section title="Forecast (90 dias)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-600">Conservador</p>
              <Badge variant="info">70% confiança</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(forecast.conservative)}</p>
          </Card>
          <Card padding="md" className="ring-2 ring-blue-500">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-600">Realista</p>
              <Badge variant="success">85% confiança</Badge>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(forecast.realistic)}</p>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-600">Otimista</p>
              <Badge variant="warning">50% confiança</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(forecast.optimistic)}</p>
          </Card>
        </div>

        <Card padding="md">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Premissas do Forecast</h4>
          <div className="space-y-2 text-xs text-slate-600">
            <p>• Baseado em {velocity.dealsClosedLast30Days} deals fechados nos últimos 30 dias</p>
            <p>• Taxa de conversão média de {funnel.overallConversionRate.toFixed(1)}%</p>
            <p>• Velocity semanal de R$ {velocity.weeklyVelocity.toFixed(0)}</p>
            <p>• Ticket médio de R$ {(funnel.averageTicket || 0).toFixed(0)}</p>
          </div>
        </Card>
      </Section>

      {/* Stage Details */}
      {selectedStage && (
        <Section title={`Detalhes - ${selectedStage}`}>
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-900">Oportunidades no Stage</h4>
              <Button variant="secondary" size="sm" onClick={() => setSelectedStage(null)}>
                Fechar
              </Button>
            </div>
            
            {data.deals && data.deals.filter((d: any) => d.stage === selectedStage).length > 0 ? (
              <Table
                headers={['Cliente', 'Valor', 'Tempo no Stage', 'Probabilidade']}
                data={data.deals
                  .filter((d: any) => d.stage === selectedStage)
                  .slice(0, 10)
                  .map((deal: any) => [
                    deal.customer,
                    formatCurrency(deal.value),
                    formatHours(deal.timeInStage),
                    `${deal.probability}%`
                  ])}
                compact
              />
            ) : (
              <EmptyState
                icon="📭"
                title="Nenhuma oportunidade"
                description={`Não há deals no stage ${selectedStage} no momento`}
              />
            )}
          </Card>
        </Section>
      )}

      {/* Actions */}
      <Section title="Ações Recomendadas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                🎯
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Revisar Gargalos</h4>
                <p className="text-xs text-slate-600 mb-2">
                  {bottlenecks?.length || 0} gargalos identificados que precisam de atenção
                </p>
                <Button variant="primary" size="sm">Ver Detalhes</Button>
              </div>
            </div>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                📊
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 mb-1">Exportar Relatório</h4>
                <p className="text-xs text-slate-600 mb-2">
                  Gerar relatório completo do pipeline em PDF/Excel
                </p>
                <Button variant="secondary" size="sm">Exportar</Button>
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </AdminLayout>
  );
}
