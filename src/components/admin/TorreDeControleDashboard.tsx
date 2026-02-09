/**
 * ═══════════════════════════════════════════════════════
 * COMPONENTE - Torre de Controle Dashboard
 * ═══════════════════════════════════════════════════════
 */

'use client';

import React, { useState, useEffect } from 'react';
import type {
  TorreDeControleResponse,
  KpiCard as KpiCardType,
} from '@/services/admin/torreDeControleTypes';
import { KpiCardComponent } from './KpiCard';
import { RegionDrilldownTable } from './RegionDrilldownTable';
import { StatusPill } from './StatusPill';

interface TorreDeControleDashboardProps {
  initialWindow?: number;
}

export function TorreDeControleDashboard({ initialWindow = 30 }: TorreDeControleDashboardProps) {
  const [data, setData] = useState<TorreDeControleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [window, setWindow] = useState(initialWindow);
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined);
  const [drilldownCard, setDrilldownCard] = useState<KpiCardType | null>(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [window, selectedRegion]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        window: window.toString(),
      });

      if (selectedRegion) {
        params.append('region', selectedRegion);
      }

      // Usar autenticação simples com senha (compatível com verifyAdminAuth)
      const ADMIN_PASSWORD = 'cuideme@admin321';
      
      const response = await fetch(`/api/admin/torre-de-controle?${params}`, {
        headers: {
          'x-admin-password': ADMIN_PASSWORD,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('[TorreDeControle] Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handleKpiClick(kpi: KpiCardType) {
    if (kpi.breakdown && kpi.breakdown.length > 0) {
      setDrilldownCard(kpi);
    }
  }

  function closeDrilldown() {
    setDrilldownCard(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, topRegions, alertStatuses } = data;

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torre de Controle</h1>
          <p className="mt-1 text-sm text-gray-600">
            Dashboard executivo com KPIs críticos (early-stage)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de janela */}
          <select
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Selecionar período"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>

          {/* Botão refresh */}
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            aria-label="Atualizar dados"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Status dos Alertas</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tempo de Match:</span>
            <StatusPill status={alertStatuses.tempoMatch} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Aceitação:</span>
            <StatusPill status={alertStatuses.aceitacao} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Cancelamento:</span>
            <StatusPill status={alertStatuses.cancelamento} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Recorrência:</span>
            <StatusPill status={alertStatuses.recorrencia} />
          </div>
        </div>
      </div>

      {/* Top Regiões */}
      {topRegions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Top 10 Regiões</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {topRegions.slice(0, 10).map((region) => (
              <button
                key={region.region}
                onClick={() => setSelectedRegion(region.region === selectedRegion ? undefined : region.region)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  region.region === selectedRegion
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xs text-gray-600 truncate">{region.label}</div>
                <div className="text-lg font-bold text-gray-900">{region.value}</div>
              </button>
            ))}
          </div>
          {selectedRegion && (
            <button
              onClick={() => setSelectedRegion(undefined)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ✕ Limpar filtro de região
            </button>
          )}
        </div>
      )}

      {/* BLOCO: Liquidez */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          💧 Liquidez
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCardComponent kpi={kpis.familiasAtivas} onClick={() => handleKpiClick(kpis.familiasAtivas)} />
          <KpiCardComponent kpi={kpis.cuidadoresAtivos} onClick={() => handleKpiClick(kpis.cuidadoresAtivos)} />
          <KpiCardComponent kpi={kpis.conversaoPedidoServico} />
        </div>
      </section>

      {/* BLOCO: Qualidade */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          ⭐ Qualidade
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCardComponent kpi={kpis.taxaAceitacao} />
          <KpiCardComponent kpi={kpis.cancelamentos} />
          <KpiCardComponent kpi={kpis.avaliacaoMedia} />
        </div>
      </section>

      {/* BLOCO: Ativação */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          🚀 Ativação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCardComponent kpi={kpis.ativacaoFamilias} />
          <KpiCardComponent kpi={kpis.ativacaoCuidadoresPerfilCompleto} />
          <KpiCardComponent kpi={kpis.ativacaoCuidadoresPrimeiroServico} />
        </div>
      </section>

      {/* BLOCO: Financeiro */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          💰 Financeiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCardComponent kpi={kpis.gmvMensal} />
          <KpiCardComponent kpi={kpis.ticketMedio} />
          <KpiCardComponent kpi={kpis.receitaLiquida} />
        </div>
      </section>

      {/* Modal de drill-down */}
      {drilldownCard && (
        <RegionDrilldownTable
          regions={drilldownCard.breakdown || []}
          title={`${drilldownCard.title} - Breakdown por Região`}
          onClose={closeDrilldown}
        />
      )}
    </div>
  );
}
