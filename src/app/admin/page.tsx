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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-cyan-500/50"></div>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-wider">INITIALIZING NOC...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-xl shadow-2xl shadow-red-500/20 p-8 max-w-md text-center">
          <div className="text-6xl mb-4 text-red-500">⚠</div>
          <h2 className="text-2xl font-bold text-white mb-2 font-mono uppercase">SYSTEM ERROR</h2>
          <p className="text-slate-400 mb-6 font-mono text-sm">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/30"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏥</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Torre de Controle</h1>
                <p className="text-sm text-slate-400">Cuide-me Admin</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              {/* Status */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Online</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Health Score Banner */}
        <HealthScoreBanner health={platformHealth} criticalAlertsCount={criticalAlerts.length} />

        {/* Hero KPIs */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded"></span>
            Métricas Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {heroKpis.map(kpi => (
              <HeroKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>

        {/* Secondary KPIs */}
        {secondaryKpis.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded"></span>
              Métricas Secundárias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondaryKpis.map(kpi => (
                <SecondaryKpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        )}

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-red-500 rounded animate-pulse"></span>
              Alertas Críticos ({criticalAlerts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {criticalAlerts.map(alert => (
                <AlertCardModern key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded"></span>
            Acesso Rápido
          </h2>
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
    healthy: { 
      bg: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10', 
      border: 'border-green-500/50', 
      text: 'text-green-500',
      icon: '✓'
    },
    warning: { 
      bg: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10', 
      border: 'border-yellow-500/50', 
      text: 'text-yellow-500',
      icon: '⚠'
    },
    critical: { 
      bg: 'bg-gradient-to-r from-red-500/10 to-pink-500/10', 
      border: 'border-red-500/50', 
      text: 'text-red-500',
      icon: '⚡'
    },
  };

  const config = statusConfig[health.status];

  return (
    <div className={`${config.bg} ${config.border} border-2 rounded-2xl p-8 mb-8 shadow-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Status Icon */}
          <div className={`w-16 h-16 ${config.bg} ${config.border} border-2 rounded-xl flex items-center justify-center shadow-lg`}>
            <span className={`text-4xl ${config.text} font-bold`}>{config.icon}</span>
          </div>
          
          <div>
            <div className="text-sm text-slate-400 mb-1">Status da Plataforma</div>
            <div className={`text-3xl font-bold ${config.text} mb-2`}>{health.label}</div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-400">
                Health Score: <span className={`font-bold ${config.text}`}>{health.score}%</span>
              </div>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${health.status === 'healthy' ? 'bg-green-500' : health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-1000`}
                  style={{ width: `${health.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {criticalAlertsCount > 0 && (
          <div className="text-right border-l-2 border-red-500/30 pl-8">
            <div className="text-5xl font-bold text-red-500">{criticalAlertsCount}</div>
            <div className="text-sm text-slate-400 mt-1">Alertas Críticos</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { 
      bg: 'from-green-500/10 to-emerald-500/10', 
      border: 'border-green-500/50', 
      text: 'text-green-500',
      dot: 'bg-green-500'
    },
    warning: { 
      bg: 'from-yellow-500/10 to-orange-500/10', 
      border: 'border-yellow-500/50', 
      text: 'text-yellow-500',
      dot: 'bg-yellow-500'
    },
    critical: { 
      bg: 'from-red-500/10 to-pink-500/10', 
      border: 'border-red-500/50', 
      text: 'text-red-500',
      dot: 'bg-red-500'
    },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-500' },
    down: { icon: '↘', color: 'text-red-500' },
    stable: { icon: '→', color: 'text-slate-400' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className={`bg-gradient-to-br ${config.bg} ${config.border} border-2 rounded-xl p-6 hover:shadow-2xl transition-all hover:scale-105`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
        <div className={`text-3xl font-bold ${trend.color}`}>{trend.icon}</div>
      </div>

      {/* Label */}
      <div className="text-sm text-slate-400 mb-3">{kpi.label}</div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-4">
        <div className={`text-4xl font-bold ${config.text}`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-xl font-semibold text-slate-500">{kpi.suffix}</div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3"></div>

      {/* Tooltip */}
      <div className="text-xs text-slate-500 leading-relaxed">{kpi.tooltip}</div>
    </div>
  );
}

function SecondaryKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { dot: 'bg-green-500', text: 'text-green-500', border: 'border-green-500/30' },
    warning: { dot: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500/30' },
    critical: { dot: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/30' },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-500' },
    down: { icon: '↘', color: 'text-red-500' },
    stable: { icon: '→', color: 'text-slate-400' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className={`bg-slate-900/50 ${config.border} border-2 rounded-lg p-5 hover:bg-slate-900 hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
        <div className={`text-xl font-bold ${trend.color}`}>{trend.icon}</div>
      </div>

      <div className="text-sm text-slate-400 mb-3">{kpi.label}</div>

      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-bold ${config.text}`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-lg font-semibold text-slate-500">{kpi.suffix}</div>
        )}
      </div>
    </div>
  );
}

function AlertCardModern({ alert }: { alert: Alert }) {
  const severityConfig = {
    low: { bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/50', text: 'text-blue-400', icon: 'ℹ' },
    medium: { bg: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: '⚡' },
    high: { bg: 'from-orange-500/10 to-red-500/10', border: 'border-orange-500/50', text: 'text-orange-400', icon: '⚠' },
    critical: { bg: 'from-red-500/10 to-pink-500/10', border: 'border-red-500/50', text: 'text-red-400', icon: '🚨' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`bg-gradient-to-br ${config.bg} ${config.border} border-2 rounded-xl p-6 hover:shadow-xl transition-all`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl ${config.text}`}>{config.icon}</div>
        <div className="flex-1">
          <div className={`font-bold ${config.text} mb-2 text-sm uppercase`}>{alert.label}</div>
          <div className={`text-4xl font-bold ${config.text} mb-3`}>{alert.count}</div>
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3"></div>
          <div className="text-sm text-slate-400 mb-2">{alert.action}</div>
          {alert.module && (
            <div className="text-xs text-slate-500">
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
    { icon: '📊', title: 'Dashboard', desc: 'Indicadores gerais', href: '/admin/dashboard', color: 'from-blue-500 to-cyan-600' },
    { icon: '🔄', title: 'Pipeline', desc: 'Funil de contratação', href: '/admin/pipeline', color: 'from-purple-500 to-pink-600' },
    { icon: '💰', title: 'Financeiro', desc: 'Receitas e MRR', href: '/admin/financeiro', color: 'from-green-500 to-emerald-600' },
    { icon: '👥', title: 'Usuários', desc: 'Famílias e profissionais', href: '/admin/users', color: 'from-orange-500 to-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {modules.map(module => (
        <Link
          key={module.href}
          href={module.href}
          className="group bg-slate-900/50 border-2 border-slate-800 rounded-xl p-6 hover:bg-slate-900 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all hover:-translate-y-2"
        >
          <div className={`w-16 h-16 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
            {module.icon}
          </div>
          <div className="font-bold text-white mb-1 text-base">{module.title}</div>
          <div className="text-sm text-slate-400">{module.desc}</div>
        </Link>
      ))}
    </div>
  );
}
