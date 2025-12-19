/**
 * ────────────────────────────────────────────────────────────────────────────
 * TORRE DE CONTROLE V2 - DASHBOARD PRINCIPAL
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Página principal da Torre v2 com North Star Metrics e alertas críticos.
 * 
 * FEATURES:
 * - 4 North Star KPIs (MRR, Conversão, NPS, Alertas)
 * - Status visual (🟢 🟡 🔴)
 * - Alertas críticos priorizados
 * - Overview de Growth, Operations, Finance
 * - Auto-refresh a cada 5 minutos
 * 
 * ROUTE: /admin/torre-v2
 * 
 * @see TORRE_V2_PAGINAS.md - Layout definition
 * @see TORRE_V2_KPIS.md - KPIs metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { TorreV2Response } from '@/app/api/admin/torre-v2/route';

export default function TorreV2Page() {
  const [data, setData] = useState<TorreV2Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/torre-v2?startDate=30daysAgo&endDate=today');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('[Torre V2] Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: 'success' | 'warning' | 'danger') => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'danger') => {
    switch (status) {
      case 'success': return '🟢';
      case 'warning': return '🟡';
      case 'danger': return '🔴';
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">❌ Erro ao carregar Torre v2</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { northStar, growth, operations, finance } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Torre de Controle v2
          </h1>
          <p className="text-gray-600">
            Dashboard Decisório • Período: {data.period.startDate} a {data.period.endDate}
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Atualizado há {Math.floor((Date.now() - lastUpdated.getTime()) / 1000 / 60)} minutos
            </p>
          )}
        </div>

        {/* North Star Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🌟 North Star Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* MRR */}
            <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(northStar.mrr.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">MRR</h3>
                <span className="text-2xl">{getStatusIcon(northStar.mrr.status)}</span>
              </div>
              <div className="text-3xl font-bold mb-1">
                R$ {(northStar.mrr.current / 1000).toFixed(1)}k
              </div>
              <div className={`text-sm font-medium ${northStar.mrr.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {northStar.mrr.growth >= 0 ? '↑' : '↓'} {Math.abs(northStar.mrr.growth).toFixed(1)}% MoM
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Meta: &gt;10% MoM
              </div>
            </div>

            {/* Conversion Rate */}
            <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(northStar.conversion.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Taxa de Conversão</h3>
                <span className="text-2xl">{getStatusIcon(northStar.conversion.status)}</span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {northStar.conversion.rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                Cadastro → Pagamento
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Meta: &gt;15%
              </div>
            </div>

            {/* NPS */}
            <div className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(northStar.nps.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">NPS</h3>
                <span className="text-2xl">{getStatusIcon(northStar.nps.status)}</span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {northStar.nps.score.toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">
                Net Promoter Score
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Meta: &gt;50 (Excelente)
              </div>
            </div>

            {/* Critical Alerts */}
            <div className={`bg-white rounded-lg border-2 p-6 ${
              northStar.criticalAlerts.count === 0 
                ? 'text-green-600 bg-green-50 border-green-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Alertas Críticos</h3>
                <span className="text-2xl">{northStar.criticalAlerts.count === 0 ? '🟢' : '🔴'}</span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {northStar.criticalAlerts.count}
              </div>
              <div className="text-sm text-gray-500">
                {northStar.criticalAlerts.count === 0 ? 'Tudo OK' : 'Requerem ação'}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Meta: 0 alertas ativos
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts Detail */}
        {northStar.criticalAlerts.count > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🚨 Alertas Críticos</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <ul className="space-y-2">
                {northStar.criticalAlerts.alerts.map((alert, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span className="text-red-800">{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Growth Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Growth</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Signups</span>
                <span className="font-semibold">{growth.totalSignups}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold">{growth.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CAC</span>
                <span className="font-semibold">R$ {growth.cac}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LTV</span>
                <span className="font-semibold">R$ {growth.ltv}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">LTV/CAC Ratio</span>
                <span className={`font-bold ${
                  growth.ltvCacRatio >= 3 ? 'text-green-600' :
                  growth.ltvCacRatio >= 2 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {growth.ltvCacRatio.toFixed(1)}x
                </span>
              </div>
            </div>
          </div>

          {/* Operations Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Operations</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Jobs</span>
                <span className={`font-semibold ${operations.pendingJobs > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {operations.pendingJobs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Matching Time</span>
                <span className="font-semibold">{operations.avgMatchingTime}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Match Rate</span>
                <span className="font-semibold">{operations.matchRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Professionals</span>
                <span className="font-semibold">{operations.activeProfessionals}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">SLA Breaches</span>
                <span className={`font-bold ${
                  operations.slaBreaches === 0 ? 'text-green-600' :
                  operations.slaBreaches < 5 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {operations.slaBreaches}
                </span>
              </div>
            </div>
          </div>

          {/* Finance Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Finance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold">R$ {(finance.totalRevenue / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net Revenue</span>
                <span className="font-semibold">R$ {(finance.netRevenue / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Churn Rate</span>
                <span className={`font-semibold ${
                  finance.churnRate < 3 ? 'text-green-600' :
                  finance.churnRate < 5 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {finance.churnRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Ticket</span>
                <span className="font-semibold">R$ {finance.avgTicket}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">Success Rate</span>
                <span className={`font-bold ${
                  finance.successRate >= 95 ? 'text-green-600' :
                  finance.successRate >= 90 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {finance.successRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/growth-v2"
              className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center font-medium"
            >
              📈 Growth Details
            </a>
            <a
              href="/admin/financeiro-v3"
              className="px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-center font-medium"
            >
              💰 Financial Details
            </a>
            <a
              href="/admin/operational-health"
              className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-center font-medium"
            >
              ⚙️ Operations
            </a>
            <button
              onClick={fetchData}
              className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-center font-medium"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
