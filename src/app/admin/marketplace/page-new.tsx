'use client';

/**
 * ═══════════════════════════════════════════════════════
 * MARKETPLACE VALIDATION V2
 * ═══════════════════════════════════════════════════════
 * 
 * Análise completa de demanda vs oferta com design moderno
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import { 
  ModulePageLayout, 
  KpiGrid, 
  ContentSection, 
  FiltersWrapper,
  DataTable,
  InfoBox 
} from '@/components/admin/ModulePageLayout';
import { StatCard, Card, Badge } from '@/components/admin/ui';
import { utils, moduleIcons } from '@/lib/designSystem';
import LoadingState, { KpiSkeleton, ChartSkeleton, TableSkeleton } from '@/components/admin/LoadingState';
import { ErrorState } from '@/components/admin/EmptyState';
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart';
import type { DateRange } from '@/components/admin/DateRangeFilter';
import type { MarketplaceValidationData } from '@/services/admin/marketplace-validation';

export default function MarketplacePage() {
  const router = useRouter();
  const { loading: authLoading } = useAdminAuth();
  const [data, setData] = useState<MarketplaceValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/admin/marketplace-validation';
      if (dateRange) {
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      
      const response = await authFetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err: any) {
      console.error('[Marketplace Page] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (loading && !data)) {
    return (
      <ModulePageLayout
        title="Marketplace Validation"
        subtitle="Validação de Demanda vs Oferta"
        icon={moduleIcons.marketplace}
      >
        <div className="space-y-6">
          <KpiSkeleton count={4} />
          <ChartSkeleton />
          <TableSkeleton rows={6} />
        </div>
      </ModulePageLayout>
    );
  }

  if (error && !data) {
    return (
      <ModulePageLayout
        title="Marketplace Validation"
        subtitle="Validação de Demanda vs Oferta"
        icon={moduleIcons.marketplace}
      >
        <ErrorState message={error} onRetry={loadData} />
      </ModulePageLayout>
    );
  }

  if (!data) {
    return (
      <ModulePageLayout
        title="Marketplace Validation"
        subtitle="Validação de Demanda vs Oferta"
        icon={moduleIcons.marketplace}
      >
        <ErrorState message="Nenhum dado disponível" />
      </ModulePageLayout>
    );
  }

  const { balance, especialidades, geografico, qualidade } = data;

  // Classificar balance status
  const getBalanceStatus = (ratio: number) => {
    if (ratio < 0.8) return { label: 'Shortage', variant: 'error' as const };
    if (ratio < 1.0) return { label: 'Low', variant: 'warning' as const };
    if (ratio <= 1.5) return { label: 'Balanced', variant: 'success' as const };
    return { label: 'Surplus', variant: 'info' as const };
  };

  const balanceStatus = getBalanceStatus(balance.ratio);

  return (
    <ModulePageLayout
      title="Marketplace Validation"
      subtitle="Análise completa de demanda vs oferta do marketplace"
      icon={moduleIcons.marketplace}
      onRefresh={loadData}
      refreshing={loading}
      filters={
        <FiltersWrapper
          dateRange={{
            value: dateRange,
            onChange: setDateRange
          }}
          exportData={data}
          exportFilename="marketplace-validation"
        />
      }
    >
      <div className="space-y-8">
        {/* KPIs Principais */}
        <ContentSection>
          <KpiGrid columns={4}>
            <StatCard
              title="Demanda Aberta"
              value={utils.formatNumber(balance.demandaAberta)}
              subtitle="Jobs aguardando match"
              icon="📥"
              trend={balance.demandaAberta > 100 ? 'up' : 'stable'}
            />

            <StatCard
              title="Oferta Disponível"
              value={utils.formatNumber(balance.ofertaDisponivel)}
              subtitle="Cuidadores disponíveis"
              icon="👨‍⚕️"
              trend={balance.ofertaDisponivel > balance.demandaAberta ? 'up' : 'down'}
            />

            <StatCard
              title="Ratio D/O"
              value={balance.ratio.toFixed(2)}
              subtitle="Ideal: 1.0 - 1.5"
              icon="⚖️"
              status={balanceStatus.variant}
            />

            <StatCard
              title="Taxa de Match"
              value={utils.formatPercentage(qualidade.matchRate)}
              subtitle="Últimos 30 dias"
              icon="🎯"
              trend={qualidade.matchRate > 75 ? 'up' : qualidade.matchRate > 50 ? 'stable' : 'down'}
            />
          </KpiGrid>
        </ContentSection>

        {/* Alerta de Desbalanceamento */}
        {balance.ratio < 1.0 && (
          <InfoBox variant="warning" title="Atenção: Demanda Maior que Oferta">
            <p>
              Há <strong>{balance.demandaAberta - balance.ofertaDisponivel}</strong> jobs a mais do que cuidadores disponíveis.
              Isso pode resultar em aumento no tempo de match e insatisfação das famílias.
            </p>
            <p className="mt-2">
              <strong>Ação recomendada:</strong> Ativar campanha de recrutamento de cuidadores nas especialidades críticas.
            </p>
          </InfoBox>
        )}

        {balance.ratio > 1.5 && (
          <InfoBox variant="info" title="Oferta Excedente">
            <p>
              Há mais cuidadores disponíveis do que demanda ativa. Isso é positivo para match rápido,
              mas pode indicar baixa utilização dos profissionais.
            </p>
          </InfoBox>
        )}

        {/* Gráfico de Balance */}
        <ContentSection title="📊 Visão Geral: Demanda vs Oferta">
          <Card>
            <SimpleBarChart
              data={[
                { label: 'Demanda Aberta', value: balance.demandaAberta, color: 'bg-red-500' },
                { label: 'Oferta Disponível', value: balance.ofertaDisponivel, color: 'bg-green-500' }
              ]}
              height={280}
            />
          </Card>
        </ContentSection>

        {/* Análise por Especialidade */}
        <ContentSection 
          title="🎓 Análise por Especialidade"
          subtitle="Gaps e superávits por tipo de serviço"
        >
          <DataTable
            columns={[
              {
                key: 'especialidade',
                label: 'Especialidade',
                align: 'left'
              },
              {
                key: 'demanda',
                label: 'Demanda',
                align: 'center',
                render: (value) => (
                  <span className="font-semibold text-gray-900">
                    {utils.formatNumber(value)}
                  </span>
                )
              },
              {
                key: 'oferta',
                label: 'Oferta',
                align: 'center',
                render: (value) => (
                  <span className="font-semibold text-gray-900">
                    {utils.formatNumber(value)}
                  </span>
                )
              },
              {
                key: 'gap',
                label: 'Gap',
                align: 'center',
                render: (value) => (
                  <span className={`font-semibold ${value > 0 ? 'text-red-600' : value < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {value > 0 ? '+' : ''}{utils.formatNumber(value)}
                  </span>
                )
              },
              {
                key: 'status',
                label: 'Status',
                align: 'center',
                render: (value) => {
                  const variants = {
                    shortage: 'error',
                    balanced: 'success',
                    surplus: 'info'
                  } as const;
                  
                  const labels = {
                    shortage: 'Falta',
                    balanced: 'Ok',
                    surplus: 'Sobra'
                  };
                  
                  return (
                    <Badge variant={variants[value as keyof typeof variants]}>
                      {labels[value as keyof typeof labels]}
                    </Badge>
                  );
                }
              }
            ]}
            data={especialidades.map(esp => ({
              especialidade: esp.specialty,
              demanda: esp.demand,
              oferta: esp.supply,
              gap: esp.gap,
              status: esp.status
            }))}
          />
        </ContentSection>

        {/* Análise Geográfica */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContentSection title="📍 Cobertura por Estado">
            <Card>
              <div className="space-y-3">
                {geografico.byState.slice(0, 5).map((state, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-900">{state.state}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Demanda</div>
                        <div className="text-sm font-semibold text-red-600">{state.demand}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Oferta</div>
                        <div className="text-sm font-semibold text-green-600">{state.supply}</div>
                      </div>
                      <Badge variant={state.status === 'balanced' ? 'success' : state.status === 'shortage' ? 'error' : 'info'}>
                        {state.coverage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </ContentSection>

          <ContentSection title="⭐ Qualidade de Matches">
            <Card>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Taxa de Match</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {utils.formatPercentage(qualidade.matchRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${qualidade.matchRate}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tempo Médio de Match</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {qualidade.avgMatchTime.toFixed(1)}h
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {qualidade.avgMatchTime < 12 ? '✅ Excelente' : qualidade.avgMatchTime < 24 ? '⚠️ Aceitável' : '❌ Melhorar'}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Status Geral do Marketplace</div>
                  <Badge 
                    variant={balance.ratio >= 1.0 && balance.ratio <= 1.5 ? 'success' : 'warning'}
                    size="lg"
                  >
                    {balanceStatus.label}
                  </Badge>
                </div>
              </div>
            </Card>
          </ContentSection>
        </div>

        {/* Insights e Recomendações */}
        {balance.ratio < 0.9 && (
          <InfoBox variant="error" title="🚨 Ação Urgente Necessária">
            <ul className="list-disc list-inside space-y-1">
              <li>Ratio muito baixo ({balance.ratio.toFixed(2)}) indica escassez de oferta</li>
              <li>Risco de aumento no tempo de match e insatisfação</li>
              <li><strong>Recomendação:</strong> Campanhas agressivas de recrutamento</li>
              <li><strong>Foco:</strong> Especialidades com maior gap negativo</li>
            </ul>
          </InfoBox>
        )}
      </div>
    </ModulePageLayout>
  );
}
