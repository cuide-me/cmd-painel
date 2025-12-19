/**
 * ────────────────────────────────────────────────────────────────────────────
 * GROWTH V2 - PÁGINA PRINCIPAL
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Dashboard de crescimento com funis, cohorts e métricas de aquisição.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DateRangePicker, DateRange, ErrorBoundary, LoadingState } from '@/components/shared';
import { AcquisitionFunnel } from '@/components/growth/AcquisitionFunnel';
import { GrowthMetrics } from '@/components/growth/GrowthMetrics';
import { CohortsTable } from '@/components/growth/CohortsTable';

interface GrowthData {
  funnel: {
    acquisition: Array<{
      name: string;
      value: number;
      conversionRate: number;
      dropoffRate: number;
    }>;
    conversion: Array<{
      name: string;
      value: number;
      conversionRate: number;
      dropoffRate: number;
    }>;
  };
  metrics: {
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    paybackPeriod: number;
  };
  cohorts: Array<{
    cohortDate: string;
    initialSize: number;
    retention: {
      week1: number;
      week2: number;
      week4: number;
      week8: number;
      week12: number;
    };
    ltv: number;
    churnRate: number;
  }>;
}

export default function GrowthV2Page() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '90daysAgo',
    endDate: 'today',
    label: 'Últimos 90 dias',
  });

  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const [funnelResponse, cohortsResponse] = await Promise.all([
        fetch(`/api/admin/growth-v2/funnel?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch(`/api/admin/growth-v2/cohorts?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ]);

      if (!funnelResponse.ok || !cohortsResponse.ok) {
        throw new Error('Erro ao carregar dados de Growth');
      }

      const [funnelData, cohortsData] = await Promise.all([
        funnelResponse.json(),
        cohortsResponse.json(),
      ]);

      // Transform funnel data
      const acquisitionFunnel = funnelData.acquisition.stages.map((stage: any) => ({
        name: stage.name,
        value: stage.users,
        conversionRate: stage.conversionRate,
        dropoffRate: stage.dropoffRate,
      }));

      const conversionFunnel = funnelData.conversion.stages.map((stage: any) => ({
        name: stage.name,
        value: stage.users,
        conversionRate: stage.conversionRate,
        dropoffRate: stage.dropoffRate,
      }));

      // Calculate metrics (mock - would come from API)
      const metrics = {
        cac: 65,
        ltv: 450,
        ltvCacRatio: 6.9,
        paybackPeriod: 4.5,
      };

      setData({
        funnel: {
          acquisition: acquisitionFunnel,
          conversion: conversionFunnel,
        },
        metrics,
        cohorts: cohortsData.cohorts,
      });
    } catch (err: any) {
      console.error('[Growth V2] Fetch error:', err);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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
                <h1 className="text-3xl font-bold text-gray-900">
                  Growth Analytics
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Análise de funis, cohorts e métricas de crescimento
                </p>
              </div>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {loading ? (
            <LoadingState message="Carregando dados de growth..." />
          ) : (
            <>
              {/* Growth Metrics */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Métricas de Crescimento
                </h2>
                <GrowthMetrics
                  metrics={{
                    cac: { value: data!.metrics.cac, change: -8.5 },
                    ltv: { value: data!.metrics.ltv, change: 12.3 },
                    ltvCacRatio: { value: data!.metrics.ltvCacRatio, change: 15.2 },
                    paybackPeriod: { value: data!.metrics.paybackPeriod, change: -10.5 },
                  }}
                />
              </section>

              {/* Acquisition Funnel */}
              <section>
                <AcquisitionFunnel stages={data!.funnel.acquisition} />
              </section>

              {/* Conversion Funnel */}
              <section>
                <div className="border rounded-lg bg-white shadow-sm">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Funil de Conversão
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Do cadastro ao primeiro pagamento
                    </p>
                  </div>
                  <div className="p-6">
                    <AcquisitionFunnel stages={data!.funnel.conversion} />
                  </div>
                </div>
              </section>

              {/* Cohorts Table */}
              <section>
                <CohortsTable cohorts={data!.cohorts} />
              </section>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
