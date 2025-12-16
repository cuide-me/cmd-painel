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
      {/* NOC Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title - NOC Style */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <span className="text-xl">🏥</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  TORRE DE CONTROLE
                  <span className="text-xs font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">NOC</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">CUIDE-ME PLATFORM MONITORING</p>
              </div>
            </div>

            {/* Center - Live Status */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-slate-400">SISTEMA ONLINE</span>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="text-xs font-mono text-slate-400">
                {new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                title="Atualizar dados"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all font-medium text-sm border border-slate-700 hover:border-red-500"
              >
                SAIR
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - NOC Grid Layout */}
      <main className="max-w-[1920px] mx-auto px-6 py-6">
        {/* Health Score Banner */}
        <HealthScoreBanner health={platformHealth} criticalAlertsCount={criticalAlerts.length} />

        {/* Hero KPIs */}
        <section className="mb-6">
          <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-cyan-500"></span>
            PRIMARY METRICS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {heroKpis.map(kpi => (
              <HeroKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>

        {/* Secondary KPIs */}
        {secondaryKpis.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500"></span>
              SECONDARY METRICS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {secondaryKpis.map(kpi => (
                <SecondaryKpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        )}

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 animate-pulse"></span>
              CRITICAL ALERTS ({criticalAlerts.length})
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
          <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-cyan-500"></span>
            QUICK ACCESS
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
      bg: 'bg-gradient-to-r from-green-900/40 to-green-800/40', 
      border: 'border-green-500/30', 
      text: 'text-green-400', 
      glow: 'shadow-green-500/20',
      icon: '✓'
    },
    warning: { 
      bg: 'bg-gradient-to-r from-yellow-900/40 to-orange-800/40', 
      border: 'border-yellow-500/30', 
      text: 'text-yellow-400', 
      glow: 'shadow-yellow-500/20',
      icon: '⚠'
    },
    critical: { 
      bg: 'bg-gradient-to-r from-red-900/40 to-red-800/40', 
      border: 'border-red-500/30', 
      text: 'text-red-400', 
      glow: 'shadow-red-500/20',
      icon: '⚡'
    },
  };

  const config = statusConfig[health.status];

  return (
    <div className={`${config.bg} ${config.border} ${config.glow} border-2 rounded-xl p-8 mb-6 shadow-2xl backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Status Icon */}
          <div className={`w-20 h-20 ${config.bg} ${config.border} border-2 rounded-xl flex items-center justify-center ${config.glow} shadow-xl`}>
            <span className={`text-5xl ${config.text} font-bold`}>{config.icon}</span>
          </div>
          
          <div>
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">SYSTEM STATUS</div>
            <div className={`text-4xl font-bold ${config.text} tracking-tight mb-1`}>{health.label}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm font-mono text-slate-400">
                Health: <span className={`font-bold ${config.text}`}>{health.score}%</span>
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
            <div className="text-6xl font-bold text-red-500 animate-pulse tabular-nums">{criticalAlertsCount}</div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mt-1">CRITICAL ALERTS</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { 
      bg: 'from-green-900/20 to-green-800/20', 
      border: 'border-green-500/30', 
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
      dot: 'bg-green-500'
    },
    warning: { 
      bg: 'from-yellow-900/20 to-orange-800/20', 
      border: 'border-yellow-500/30', 
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
      dot: 'bg-yellow-500'
    },
    critical: { 
      bg: 'from-red-900/20 to-red-800/20', 
      border: 'border-red-500/30', 
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
      dot: 'bg-red-500'
    },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-400' },
    down: { icon: '↘', color: 'text-red-400' },
    stable: { icon: '→', color: 'text-slate-500' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className={`bg-gradient-to-br ${config.bg} ${config.border} ${config.glow} border rounded-xl p-6 hover:shadow-xl transition-all hover:scale-[1.02] backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
        <div className={`text-3xl font-bold ${trend.color}`}>{trend.icon}</div>
      </div>

      {/* Label */}
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">{kpi.label}</div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-4">
        <div className={`text-5xl font-bold ${config.text} tabular-nums`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-2xl font-semibold text-slate-500">{kpi.suffix}</div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3"></div>

      {/* Tooltip */}
      <div className="text-xs text-slate-500 leading-relaxed font-mono">{kpi.tooltip}</div>
    </div>
  );
}

function SecondaryKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { dot: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/20' },
    warning: { dot: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    critical: { dot: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/20' },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-400' },
    down: { icon: '↘', color: 'text-red-400' },
    stable: { icon: '→', color: 'text-slate-500' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className={`bg-slate-900/50 ${config.border} border rounded-lg p-4 hover:bg-slate-900 hover:shadow-lg transition-all backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></div>
        <div className={`text-lg font-bold ${trend.color}`}>{trend.icon}</div>
      </div>

      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">{kpi.label}</div>

      <div className="flex items-baseline gap-1">
        <div className={`text-2xl font-bold ${config.text} tabular-nums`}>
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
    low: { bg: 'from-blue-900/20 to-blue-800/20', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20', icon: 'ℹ' },
    medium: { bg: 'from-yellow-900/20 to-yellow-800/20', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/20', icon: '⚡' },
    high: { bg: 'from-orange-900/20 to-orange-800/20', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20', icon: '⚠' },
    critical: { bg: 'from-red-900/20 to-red-800/20', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-red-500/20', icon: '⚡' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`bg-gradient-to-br ${config.bg} ${config.border} ${config.glow} border rounded-lg p-5 hover:shadow-xl transition-all backdrop-blur-sm ${alert.severity === 'critical' ? 'animate-pulse-slow' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl ${config.text}`}>{config.icon}</div>
        <div className="flex-1">
          <div className={`font-semibold ${config.text} mb-2 text-sm uppercase tracking-wider font-mono`}>{alert.label}</div>
          <div className={`text-4xl font-bold ${config.text} mb-3 tabular-nums`}>{alert.count}</div>
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3"></div>
          <div className="text-xs text-slate-400 mb-2 font-mono">{alert.action}</div>
          {alert.module && (
            <div className="text-xs font-mono text-slate-500">
              MODULE: {alert.module.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionsGrid() {
  const modules = [
    { icon: '📊', title: 'Dashboard', desc: 'Indicadores gerais', href: '/admin/dashboard', color: 'from-cyan-500 to-blue-600' },
    { icon: '🔄', title: 'Pipeline', desc: 'Funil de contratação', href: '/admin/pipeline', color: 'from-purple-500 to-purple-600' },
    { icon: '💰', title: 'Financeiro', desc: 'Receitas e MRR', href: '/admin/financeiro', color: 'from-green-500 to-green-600' },
    { icon: '👥', title: 'Usuários', desc: 'Famílias e profissionais', href: '/admin/users', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {modules.map(module => (
        <Link
          key={module.href}
          href={module.href}
          className="group bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-900 hover:shadow-xl hover:shadow-cyan-500/10 transition-all hover:-translate-y-1 backdrop-blur-sm"
        >
          <div className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
            {module.icon}
          </div>
          <div className="font-bold text-white mb-1 text-sm uppercase tracking-wider">{module.title}</div>
          <div className="text-xs text-slate-400 font-mono">{module.desc}</div>
        </Link>
      ))}
    </div>
  );
}
