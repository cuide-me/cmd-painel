'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import { getFirebaseApp } from '@/firebase/firebaseApp';

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
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<TorreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Só buscar dados quando autenticação estiver pronta
    if (!authReady) return;

    // Initial load
    fetchData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchData(true); // background refresh
    }, 120000);

    return () => clearInterval(interval);
  }, [authReady]);

  const fetchData = async (background = false) => {
    try {
      if (!background) setLoading(true);
      setError(null);

      const response = await authFetch('/api/admin/torre/overview');
      
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

  const handleLogout = async () => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await auth.signOut();
    localStorage.removeItem('admin_logged');
    localStorage.removeItem('firebase_token');
    router.push('/admin/login');
  };

  // ─────────────────────────────────────────────────────────────
  // Loading & Error States
  // ─────────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-xl">🏥</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Painel de monitoramento do Cuide-me com métricas de KPI</h1>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Hero KPIs */}
        <section className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {heroKpis.map(kpi => (
              <HeroKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>

        {/* Secondary KPIs */}
        {secondaryKpis.length > 0 && (
          <section className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {secondaryKpis.map(kpi => (
                <SecondaryKpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        )}

        {/* Charts & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
            <QuickActionsGrid />
          </div>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Alertas Críticos</h2>
              <div className="space-y-3">
                {criticalAlerts.map(alert => (
                  <AlertCardModern key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function HeroKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { 
      icon: '✓', 
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-gray-900'
    },
    warning: { 
      icon: '⚠️', 
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      valueColor: 'text-gray-900'
    },
    critical: { 
      icon: '🚨', 
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-gray-900'
    },
  };

  const trendConfig = {
    up: { icon: '↑', color: 'text-green-600' },
    down: { icon: '↓', color: 'text-red-600' },
    stable: { icon: '→', color: 'text-gray-400' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Icon & Trend */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
          <span className={`text-lg ${config.iconColor}`}>{config.icon}</span>
        </div>
        <div className={`text-xl font-semibold ${trend.color}`}>{trend.icon}</div>
      </div>

      {/* Label */}
      <div className="text-sm text-gray-600 mb-2">{kpi.label}</div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <div className={`text-3xl font-bold ${config.valueColor}`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-base text-gray-500">{kpi.suffix}</div>
        )}
      </div>
    </div>
  );
}

function SecondaryKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { dot: 'bg-green-500', text: 'text-gray-900' },
    warning: { dot: 'bg-yellow-500', text: 'text-gray-900' },
    critical: { dot: 'bg-red-500', text: 'text-gray-900' },
  };

  const trendConfig = {
    up: { icon: '↑', color: 'text-green-600' },
    down: { icon: '↓', color: 'text-red-600' },
    stable: { icon: '→', color: 'text-gray-400' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
        <div className={`text-lg font-semibold ${trend.color}`}>{trend.icon}</div>
      </div>

      <div className="text-sm text-gray-600 mb-2">{kpi.label}</div>

      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold ${config.text}`}>
          {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
        </div>
        {kpi.suffix && (
          <div className="text-sm text-gray-500">{kpi.suffix}</div>
        )}
      </div>
    </div>
  );
}

function AlertCardModern({ alert }: { alert: Alert }) {
  const severityConfig = {
    low: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'ℹ️' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⚡' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '⚠️' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', icon: '🚨' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <span className="text-lg">{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{alert.label}</div>
        <div className="text-xs text-gray-500 truncate">{alert.action}</div>
      </div>
      <div className={`text-lg font-bold ${config.text}`}>{alert.count}</div>
    </div>
  );
}

function QuickActionsGrid() {
  const modules = [
    { icon: '📊', title: 'Dashboard', href: '/admin/dashboard', color: 'text-blue-600' },
    { icon: '🔄', title: 'Pipeline', href: '/admin/pipeline', color: 'text-purple-600' },
    { icon: '💰', title: 'Financeiro', href: '/admin/financeiro', color: 'text-green-600' },
    { icon: '👥', title: 'Usuários', href: '/admin/users', color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {modules.map(module => (
        <Link
          key={module.href}
          href={module.href}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <div className={`text-2xl ${module.color}`}>{module.icon}</div>
          <div className="text-sm font-medium text-gray-700">{module.title}</div>
        </Link>
      ))}
    </div>
  );
}
