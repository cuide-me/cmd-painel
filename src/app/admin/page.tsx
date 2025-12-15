/**
 * ═══════════════════════════════════════════════════════════════
 * TORRE DE CONTROLE V2 — HOME PAGE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Design Principles:
 * - Information Hierarchy: Hero KPIs → Secondary Metrics → Alerts → Actions
 * - Visual Clarity: Status colors, trends, sparklines
 * - Decision-Oriented: Every metric has clear actionable insights
 * - Performance: Optimistic UI, background refresh, cached data
 * 
 * Target: 30s to understand platform health and take action
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type KpiStatus = 'healthy' | 'warning' | 'critical';
type TrendDirection = 'up' | 'down' | 'stable';

interface Kpi {
  id: string;
  label: string;
  value: number | string;
  status: KpiStatus;
  trend: TrendDirection;
  tooltip: string;
  suffix?: string;
  trendValue?: number;
}

interface Alert {
  id: string;
  label: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  module?: string;
}

interface TorreData {
  kpis: Kpi[];
  alerts: Alert[];
  lastUpdate?: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function TorreControle() {
  const router = useRouter();
  const [data, setData] = useState<TorreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Auth check
    const isLoggedIn = localStorage.getItem('admin_logged') === 'true';
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    // Initial load
    fetchData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchData(true); // background refresh
    }, 120000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async (background = false) => {
    try {
      if (!background) setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/torre/overview');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      
      // Transform data
      const transformed: TorreData = {
        kpis: (json.kpis || []).map((kpi: any) => ({
          id: kpi.id,
          label: kpi.label,
          value: kpi.value,
          status: mapStatus(kpi.status),
          trend: mapTrend(kpi.trend),
          tooltip: kpi.tooltip,
          suffix: kpi.suffix,
        })),
        alerts: (json.alerts || []).map((alert: any) => ({
          id: alert.id,
          label: alert.label,
          count: alert.count,
          severity: alert.severity || 'medium',
          action: alert.action,
          module: alert.module,
        })),
        lastUpdate: new Date().toISOString(),
      };

      setData(transformed);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('[Torre] Fetch error:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      if (!background) setLoading(false);
    }
  };

  const mapStatus = (s: string): KpiStatus => {
    if (s === 'green' || s === 'healthy') return 'healthy';
    if (s === 'yellow' || s === 'warning') return 'warning';
    return 'critical';
  };

  const mapTrend = (t: string): TrendDirection => {
    if (t === 'flat') return 'stable';
    return (t === 'up' || t === 'down' ? t : 'stable') as TrendDirection;
  };

  // ─────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────

  const platformHealth = useMemo(() => {
    if (!data?.kpis) return { score: 0, status: 'critical' as KpiStatus, label: 'Carregando...' };

    const healthyCount = data.kpis.filter(k => k.status === 'healthy').length;
    const score = Math.round((healthyCount / data.kpis.length) * 100);

    let status: KpiStatus = 'healthy';
    let label = 'Operação Normal';

    if (score < 50) {
      status = 'critical';
      label = 'Atenção Crítica';
    } else if (score < 75) {
      status = 'warning';
      label = 'Atenção Necessária';
    }

    return { score, status, label };
  }, [data]);

  const criticalAlerts = useMemo(() => {
    return data?.alerts.filter(a => a.severity === 'critical' || a.severity === 'high') || [];
  }, [data]);

  const heroKpis = useMemo(() => {
    if (!data?.kpis) return [];
    // First 3 KPIs as "hero" metrics
    return data.kpis.slice(0, 3);
  }, [data]);

  const secondaryKpis = useMemo(() => {
    if (!data?.kpis) return [];
    return data.kpis.slice(3);
  }, [data]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const handleLogout = () => {
    localStorage.removeItem('admin_logged');
    router.push('/admin/login');
  };

  // ─────────────────────────────────────────────────────────────
  // Loading & Error States
  // ─────────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando Torre de Controle...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Erro ao carregar</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Torre de Controle</h1>
                <p className="text-sm text-slate-500">Cuide-me Admin</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Last Refresh */}
              <div className="text-sm text-slate-500">
                Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Health Score Banner */}
        <HealthScoreBanner health={platformHealth} criticalAlertsCount={criticalAlerts.length} />

        {/* Hero KPIs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 Métricas Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {heroKpis.map(kpi => (
              <HeroKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>

        {/* Secondary KPIs */}
        {secondaryKpis.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📈 Métricas Secundárias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {secondaryKpis.map(kpi => (
                <SecondaryKpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        )}

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🚨</span>
              Alertas Críticos ({criticalAlerts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalAlerts.map(alert => (
                <AlertCardModern key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🚀 Acesso Rápido</h2>
          <QuickActionsGrid />
        </section>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function HealthScoreBanner({ health, criticalAlertsCount }: { health: { score: number; status: KpiStatus; label: string }, criticalAlertsCount: number }) {
  const statusConfig = {
    healthy: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: '✅' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', icon: '⚠️' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: '🚨' },
  };

  const config = statusConfig[health.status];

  return (
    <div className={`${config.bg} ${config.border} border-2 rounded-2xl p-6 mb-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{config.icon}</div>
          <div>
            <div className="text-sm font-medium text-slate-600 mb-1">Status da Plataforma</div>
            <div className={`text-3xl font-bold ${config.text}`}>{health.label}</div>
            <div className="text-sm text-slate-600 mt-1">
              Health Score: <span className="font-semibold">{health.score}%</span>
            </div>
          </div>
        </div>

        {criticalAlertsCount > 0 && (
          <div className="text-right">
            <div className="text-4xl font-bold text-red-600">{criticalAlertsCount}</div>
            <div className="text-sm text-slate-600">Alertas Críticos</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500' },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-600' },
    down: { icon: '↘', color: 'text-red-600' },
    stable: { icon: '→', color: 'text-slate-500' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className={`${config.bg} ${config.border} border-2 rounded-xl p-6 hover:shadow-lg transition-shadow`}>
      {/* Status Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-3 h-3 rounded-full ${config.dot}`}></div>
        <div className={`text-2xl font-bold ${trend.color}`}>{trend.icon}</div>
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-slate-600 mb-2">{kpi.label}</div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <div className={`text-4xl font-bold ${config.text}`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-xl font-semibold text-slate-600">{kpi.suffix}</div>
        )}
      </div>

      {/* Tooltip */}
      <div className="mt-3 text-xs text-slate-600 leading-relaxed">{kpi.tooltip}</div>
    </div>
  );
}

function SecondaryKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { dot: 'bg-green-500', text: 'text-green-700' },
    warning: { dot: 'bg-yellow-500', text: 'text-yellow-700' },
    critical: { dot: 'bg-red-500', text: 'text-red-700' },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-600' },
    down: { icon: '↘', color: 'text-red-600' },
    stable: { icon: '→', color: 'text-slate-500' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
        <div className={`text-lg font-bold ${trend.color}`}>{trend.icon}</div>
      </div>

      <div className="text-xs font-medium text-slate-500 mb-1">{kpi.label}</div>

      <div className="flex items-baseline gap-1">
        <div className={`text-2xl font-bold ${config.text}`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-sm font-semibold text-slate-500">{kpi.suffix}</div>
        )}
      </div>
    </div>
  );
}

function AlertCardModern({ alert }: { alert: Alert }) {
  const severityConfig = {
    low: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'ℹ️' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', icon: '⚡' },
    high: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: '⚠️' },
    critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', icon: '🚨' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`${config.bg} ${config.border} border-2 rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{config.icon}</div>
        <div className="flex-1">
          <div className={`font-semibold ${config.text} mb-1`}>{alert.label}</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{alert.count}</div>
          <div className="text-xs text-slate-600 mb-3">{alert.action}</div>
          {alert.module && (
            <div className="text-xs font-medium text-slate-500">
              Módulo: {alert.module}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionsGrid() {
  const modules = [
    { icon: '📊', title: 'Dashboard', desc: 'Indicadores gerais', href: '/admin/dashboard', color: 'from-blue-500 to-blue-600' },
    { icon: '🔄', title: 'Pipeline', desc: 'Funil de contratação', href: '/admin/pipeline', color: 'from-purple-500 to-purple-600' },
    { icon: '💰', title: 'Financeiro', desc: 'Receitas e MRR', href: '/admin/financeiro', color: 'from-green-500 to-green-600' },
    { icon: '👥', title: 'Usuários', desc: 'Famílias e profissionais', href: '/admin/users', color: 'from-orange-500 to-orange-600' },
    { icon: '⭐', title: 'Qualidade', desc: 'NPS e avaliações', href: '/admin/qualidade', color: 'from-yellow-500 to-yellow-600' },
    { icon: '🎫', title: 'Suporte', desc: 'Tickets e SLA', href: '/admin/suporte', color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {modules.map(module => (
        <Link
          key={module.href}
          href={module.href}
          className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1"
        >
          <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
            {module.icon}
          </div>
          <div className="font-semibold text-slate-900 mb-1">{module.title}</div>
          <div className="text-xs text-slate-500">{module.desc}</div>
        </Link>
      ))}
    </div>
  );
}
