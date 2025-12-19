'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import Link from 'next/link';

// Types
interface Kpi {
  label: string;
  value: number | string;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
  tooltip: string;
  actionable: string;
}

interface Alert {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: number;
  threshold: number;
  module: string;
  actionUrl?: string;
  createdAt: string;
}

interface ModuleSummary {
  id: string;
  title: string;
  icon: string;
  metrics: Array<{
    label: string;
    value: string | number;
    status?: 'healthy' | 'warning' | 'critical';
  }>;
  href: string;
  color: string;
}

interface TorreData {
  overview: {
    kpis: {
      activeFamilies: Kpi;
      activeProfessionals: Kpi;
      openRequests: Kpi;
      completedHires: Kpi;
      avgTimeToMatch: Kpi;
      abandonmentRate: Kpi;
    };
    timestamp: string;
  };
  alerts: {
    critical: Alert[];
    high: Alert[];
    medium?: Alert[];
    low?: Alert[];
    totalActive: number;
  };
  modules: {
    users: ModuleSummary;
    finance: ModuleSummary;
    pipeline: ModuleSummary;
    serviceDesk: ModuleSummary;
    quality: ModuleSummary;
    growth: ModuleSummary;
  };
  generatedAt: string;
}

export default function TorreDeControle() {
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<TorreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch('/api/admin/torre');
      if (!response.ok) throw new Error('Erro ao carregar dados da Torre');

      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Erro ao buscar dados da Torre:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    fetchData();

    // Auto-refresh a cada 2 minutos
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [authReady]);

  // Calcular Health Score
  const healthScore = useMemo(() => {
    if (!data) return { score: 0, status: 'critical' as const, label: 'Carregando...' };

    const kpis = Object.values(data.overview.kpis);
    const healthyCount = kpis.filter(k => k.status === 'healthy').length;
    const score = Math.round((healthyCount / kpis.length) * 100);

    let status: 'healthy' | 'warning' | 'critical';
    let label: string;

    if (score >= 75) {
      status = 'healthy';
      label = 'Operação Normal';
    } else if (score >= 50) {
      status = 'warning';
      label = 'Atenção Necessária';
    } else {
      status = 'critical';
      label = 'Situação Crítica';
    }

    return { score, status, label };
  }, [data]);

  // Critical Alerts (only high and critical)
  const criticalAlerts = useMemo(() => {
    if (!data) return [];
    return [...(data.alerts.critical || []), ...(data.alerts.high || [])];
  }, [data]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-24 bg-white rounded-lg shadow animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-lg shadow animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro ao Carregar Torre</h2>
            <p className="text-slate-600 mb-6">{error || 'Erro desconhecido'}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { activeFamilies, activeProfessionals, openRequests, completedHires, avgTimeToMatch, abandonmentRate } = data.overview.kpis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Torre de Controle V2</h1>
            <p className="text-sm text-slate-600">
              Visão executiva da plataforma • Atualizado {lastUpdate?.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-slate-600">Ao vivo</span>
          </div>
        </div>

        {/* Health Score Banner */}
        <div className={`rounded-lg shadow-lg p-6 border-l-4 ${
          healthScore.status === 'healthy' ? 'bg-green-50 border-green-500' :
          healthScore.status === 'warning' ? 'bg-yellow-50 border-yellow-500' :
          'bg-red-50 border-red-500'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl ${
                healthScore.status === 'healthy' ? '🟢' :
                healthScore.status === 'warning' ? '🟡' : '🔴'
              }`}>
                {healthScore.status === 'healthy' ? '🟢' :
                 healthScore.status === 'warning' ? '🟡' : '🔴'}
              </div>
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-bold text-slate-900">{healthScore.score}%</h2>
                  <span className={`text-sm font-semibold ${
                    healthScore.status === 'healthy' ? 'text-green-700' :
                    healthScore.status === 'warning' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {healthScore.label}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Health Score da plataforma calculado com base em {Object.keys(data.overview.kpis).length} KPIs críticos
                </p>
              </div>
            </div>
            {criticalAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="text-xs text-slate-600">Alertas Ativos</p>
                  <p className="text-lg font-bold text-slate-900">{criticalAlerts.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hero KPIs (Top 3) */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas Críticas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HeroKpiCard kpi={activeFamilies} />
            <HeroKpiCard kpi={activeProfessionals} />
            <HeroKpiCard kpi={openRequests} />
          </div>
        </div>

        {/* Secondary KPIs */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas de Suporte</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SecondaryKpiCard kpi={completedHires} />
            <SecondaryKpiCard kpi={avgTimeToMatch} />
            <SecondaryKpiCard kpi={abandonmentRate} />
            <SecondaryKpiCard kpi={{ 
              label: 'MRR',
              value: data.modules.finance.metrics.find(m => m.label === 'MRR')?.value || '-',
              status: data.modules.finance.metrics.find(m => m.label === 'MRR')?.status || 'healthy',
              trend: 'stable',
              tooltip: 'Monthly Recurring Revenue',
              actionable: 'Receita recorrente mensal'
            }} />
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">⚠️ Alertas Críticos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalAlerts.map(alert => (
                <CriticalAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions (Modules) */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Navegação Rápida</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.values(data.modules).map(module => (
              <QuickActionCard key={module.id} module={module} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Hero KPI Card Component
function HeroKpiCard({ kpi }: { kpi: Kpi }) {
  const statusColors = {
    healthy: 'border-green-500 bg-white',
    warning: 'border-yellow-500 bg-white',
    critical: 'border-red-500 bg-white'
  };

  const textColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 border-l-4 ${statusColors[kpi.status]} hover:shadow-xl transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
        <div className={`w-3 h-3 rounded-full ${
          kpi.status === 'healthy' ? 'bg-green-500' :
          kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
      </div>
      
      <div className="flex items-end gap-3 mb-3">
        <h3 className="text-4xl font-bold text-slate-900">
          {kpi.value}
        </h3>
        {kpi.unit && <span className="text-lg text-slate-600 mb-1">{kpi.unit}</span>}
      </div>

      {kpi.trendValue !== undefined && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{trendIcons[kpi.trend]}</span>
          <span className={`text-sm font-semibold ${textColors[kpi.status]}`}>
            {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}%
          </span>
          <span className="text-xs text-slate-500">vs. período anterior</span>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-600 mb-2">{kpi.tooltip}</p>
        <p className="text-xs font-medium text-slate-700">
          💡 {kpi.actionable}
        </p>
      </div>
    </div>
  );
}

// Secondary KPI Card Component
function SecondaryKpiCard({ kpi }: { kpi: Kpi }) {
  const statusColors = {
    healthy: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200'
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[kpi.status]} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-slate-600">{kpi.label}</p>
        <div className={`w-2 h-2 rounded-full ${
          kpi.status === 'healthy' ? 'bg-green-500' :
          kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
        {kpi.unit && <span className="text-sm text-slate-600">{kpi.unit}</span>}
      </div>
    </div>
  );
}

// Critical Alert Card Component
function CriticalAlertCard({ alert }: { alert: Alert }) {
  const severityConfig = {
    critical: { icon: '🚨', color: 'border-red-500 bg-red-50', textColor: 'text-red-700' },
    high: { icon: '⚠️', color: 'border-orange-500 bg-orange-50', textColor: 'text-orange-700' },
    medium: { icon: '⚡', color: 'border-yellow-500 bg-yellow-50', textColor: 'text-yellow-700' },
    low: { icon: 'ℹ️', color: 'border-blue-500 bg-blue-50', textColor: 'text-blue-700' }
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`rounded-lg border-l-4 p-4 ${config.color} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm mb-1 ${config.textColor}`}>
            {alert.module}: {alert.title}
          </h4>
          <p className="text-xs text-slate-600 mb-2">{alert.description}</p>
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {alert.metric} / {alert.threshold} limite
            </div>
            {alert.actionUrl && (
              <Link
                href={alert.actionUrl}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
              >
                Ver detalhes →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ module }: { module: ModuleSummary }) {
  const statusColor = module.metrics[0]?.status === 'healthy' ? 'bg-green-100' :
                      module.metrics[0]?.status === 'warning' ? 'bg-yellow-100' :
                      module.metrics[0]?.status === 'critical' ? 'bg-red-100' : 'bg-slate-100';

  return (
    <Link
      href={module.href}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-all p-4 border border-slate-200 hover:border-slate-300"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-3xl mb-1">{module.icon}</div>
        <h4 className="font-semibold text-sm text-slate-900">{module.title}</h4>
        {module.metrics[0] && (
          <div className="w-full">
            <p className="text-xs text-slate-600 mb-1">{module.metrics[0].label}</p>
            <p className="text-lg font-bold text-slate-900">{module.metrics[0].value}</p>
          </div>
        )}
        <div className={`w-full h-1 rounded-full ${statusColor} mt-2`}></div>
      </div>
    </Link>
  );
}
