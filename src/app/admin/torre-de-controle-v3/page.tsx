/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TORRE DE CONTROLE V3 - Dashboard Enterprise
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dashboard administrativo completo com:
 * - Health Score geral do marketplace
 * - Métricas de liquidez (famílias, cuidadores, match)
 * - Métricas financeiras (GMV, ticket médio, receita)
 * - Métricas de qualidade (avaliações, cancelamentos)
 * - Alertas operacionais (jobs sem match, etc)
 * - Performance regional
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/client/authFetch';
import { 
  HealthScoreCard, 
  AlertsPanel, 
  PendingJobsCard, 
  KpiGridV3,
  RegionalRanking 
} from '@/components/admin/dashboard';
import type { DashboardV3Response, TimeWindow } from '@/services/admin/dashboardV3Types';

// ═══════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>

        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TorreDeControleV3Page() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  
  const [data, setData] = useState<DashboardV3Response | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoading(data === null); // Only show full loading on first load
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('window', timeWindow.toString());
      if (selectedRegion) params.set('region', selectedRegion);

      const response = await authFetch(`/api/admin/dashboard-v3?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const result: DashboardV3Response = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[TorreV3] Erro ao carregar:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, timeWindow, selectedRegion, data]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, timeWindow, selectedRegion, fetchData]);

  // Auto refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin, fetchData]);

  // Auth loading
  if (authLoading) {
    return <LoadingState />;
  }

  // Not authenticated
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-600 mt-2">Faça login para acessar o painel</p>
          <a 
            href="/admin/login" 
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading && !data) {
    return <LoadingState />;
  }

  // Error
  if (error && !data) {
    return <ErrorState error={error} onRetry={fetchData} />;
  }

  // No data
  if (!data) {
    return <ErrorState error="Nenhum dado disponível" onRetry={fetchData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              🎛️ Torre de Controle
              {data.cached && (
                <span className="text-xs font-normal px-2 py-1 bg-amber-100 text-amber-700 rounded">
                  Cache
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Visão completa do marketplace • Última atualização: {lastUpdated?.toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Time window selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Período:</span>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value) as TimeWindow)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </div>

            {/* Auto refresh toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>

            {/* Refresh button */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>
        </header>

        {/* Error banner (for non-critical errors during refresh) */}
        {error && data && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        )}

        {/* Region filter banner */}
        {selectedRegion && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-blue-700">
              📍 Filtrando por região: <strong>{selectedRegion}</strong>
            </span>
            <button 
              onClick={() => setSelectedRegion(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar filtro
            </button>
          </div>
        )}

        {/* Main Grid: Health Score + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <HealthScoreCard healthScore={data.healthScore} />
          </div>
          <div className="lg:col-span-2">
            <AlertsPanel operational={data.operational} />
          </div>
        </div>

        {/* Pending Jobs (special focus on jobs sem match) */}
        <div className="mb-8">
          <PendingJobsCard 
            pendingJobs={data.liquidity.pendingJobs}
            onViewUrgent={() => window.location.href = '/admin/jobs?status=pending'}
          />
        </div>

        {/* KPI Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Indicadores Principais</h2>
          <KpiGridV3 
            liquidity={data.liquidity}
            financial={data.financial}
            quality={data.quality}
          />
        </div>

        {/* Regional Performance */}
        <div className="mb-8">
          <RegionalRanking 
            regional={data.regional}
            onRegionClick={(region) => setSelectedRegion(region)}
          />
        </div>

        {/* Footer with metadata */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>
            Dashboard V3 • Dados: {new Date(data.timestamp).toLocaleString('pt-BR')} • 
            Janela: {data.window} dias • 
            Cache: {data.cached ? 'Sim' : 'Não'}
          </p>
        </footer>
      </div>
    </div>
  );
}
