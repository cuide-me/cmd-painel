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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🏥</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Torre de Controle - Cuide-me
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Sistema operacional • Métricas em tempo real
                </p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                className="group relative p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Atualizar dados"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl transition-all duration-300 font-medium text-sm border border-gray-200 hover:border-red-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Hero KPIs with Modern Design */}
        <section className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">📊</span>
                Métricas Principais
              </h2>
              <div className="group/info relative">
                <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-xl">ℹ️</span>
                <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute top-full left-0 mt-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-80 transition-all duration-200">
                  <div className="font-bold mb-2 text-sm">📊 Métricas Principais</div>
                  <div className="text-gray-300 mb-2">
                    <strong>O que são:</strong> Os 3-4 indicadores mais críticos da plataforma
                  </div>
                  <div className="text-gray-300">
                    <strong>Importância:</strong> Oferecem visão instantânea da saúde operacional, com status codificado por cores e tendências direcionais para rápida tomada de decisão
                  </div>
                  <div className="absolute bottom-full left-4 mb-[-1px] border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-gray-600">Indicadores chave de performance em tempo real</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {heroKpis.map(kpi => (
              <HeroKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>

        {/* Secondary KPIs */}
        {secondaryKpis.length > 0 && (
          <section className="mb-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">📈</span>
                  Indicadores Secundários
                </h2>
                <div className="group/info relative">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors">ℹ️</span>
                  <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute top-full left-0 mt-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-80 transition-all duration-200">
                    <div className="font-bold mb-2 text-sm">📈 Indicadores Secundários</div>
                    <div className="text-gray-300 mb-2">
                      <strong>O que são:</strong> Métricas complementares que fornecem contexto adicional
                    </div>
                    <div className="text-gray-300">
                      <strong>Uso:</strong> Permitem análise mais profunda e detecção de padrões secundários que podem impactar as métricas principais
                    </div>
                    <div className="absolute bottom-full left-4 mb-[-1px] border-4 border-transparent border-b-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {secondaryKpis.map(kpi => (
                <SecondaryKpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        )}

        {/* Charts & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                Acesso Rápido
              </h2>
              <div className="group/info relative">
                <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-lg">ℹ️</span>
                <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute top-full left-0 mt-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-72 transition-all duration-200">
                  <div className="font-bold mb-2 text-sm">⚡ Acesso Rápido</div>
                  <div className="text-gray-300">
                    <strong>Navegação ágil:</strong> Atalhos para os módulos principais da plataforma, permitindo acesso imediato às áreas de Dashboard, Pipeline, Financeiro e Usuários
                  </div>
                  <div className="absolute bottom-full left-4 mb-[-1px] border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <QuickActionsGrid />
          </div>

          {/* System Health */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">💻</span>
                Saúde do Sistema
              </h2>
              <div className="group/info relative">
                <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-lg">ℹ️</span>
                <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-80 transition-all duration-200">
                  <div className="font-bold mb-2 text-sm">💻 Saúde do Sistema</div>
                  <div className="text-gray-300 mb-2">
                    <strong>O que mede:</strong> Percentual de indicadores operando normalmente (status verde)
                  </div>
                  <div className="text-gray-300 mb-2">
                    <strong>Como calcula:</strong> (Indicadores Saudáveis ÷ Total de Indicadores) × 100
                  </div>
                  <div className="text-gray-300 mb-2">
                    <strong>Classificação:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• ≥75%: ✓ Operação Normal (verde)</li>
                      <li>• 50-74%: ⚠ Atenção Necessária (amarelo)</li>
                      <li>• &lt;50%: ✗ Atenção Crítica (vermelho)</li>
                    </ul>
                  </div>
                  <div className="text-gray-400 text-[10px]">
                    Atualização: Tempo real a cada 2 minutos
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px] border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <SystemHealthCard health={platformHealth} />
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-xl p-8 border border-red-200/50">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl animate-pulse">🚨</span>
                  Alertas Críticos
                </h2>
                <div className="group/info relative">
                  <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-lg">ℹ️</span>
                  <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute top-full left-0 mt-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-80 transition-all duration-200">
                    <div className="font-bold mb-2 text-sm">🚨 Alertas Críticos</div>
                    <div className="text-gray-300 mb-2">
                      <strong>O que são:</strong> Notificações de problemas de alta prioridade que requerem atenção imediata
                    </div>
                    <div className="text-gray-300 mb-2">
                      <strong>Classificação:</strong>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• 🚨 Crítico: Ação urgente necessária</li>
                        <li>• ⚠️ Alta: Atenção prioritária</li>
                      </ul>
                    </div>
                    <div className="text-gray-400 text-[10px]">
                      Cada alerta contém ação recomendada e módulo afetado
                    </div>
                    <div className="absolute bottom-full left-4 mb-[-1px] border-4 border-transparent border-b-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalAlerts.map(alert => (
                  <AlertCardModern key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </section>
        )}
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
      gradient: 'from-green-500 to-emerald-600',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200',
      glow: 'glow-green',
      pulse: 'bg-green-500'
    },
    warning: { 
      icon: '⚠️', 
      gradient: 'from-yellow-500 to-orange-600',
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      glow: '',
      pulse: 'bg-yellow-500'
    },
    critical: { 
      icon: '🚨', 
      gradient: 'from-red-500 to-rose-600',
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200',
      glow: 'glow-red',
      pulse: 'bg-red-500'
    },
  };

  const trendConfig = {
    up: { icon: '↗', color: 'text-green-600', bg: 'bg-green-100' },
    down: { icon: '↘', color: 'text-red-600', bg: 'bg-red-100' },
    stable: { icon: '→', color: 'text-gray-600', bg: 'bg-gray-100' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className={`group relative bg-gradient-to-br ${config.bg} backdrop-blur-xl rounded-2xl shadow-xl border-2 ${config.border} p-6 hover:shadow-2xl transition-all duration-500 overflow-hidden ${config.glow} transform hover:scale-105`}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`relative w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-300`}>
            <span className="text-2xl text-white">{config.icon}</span>
            <div className={`absolute -top-1 -right-1 w-3 h-3 ${config.pulse} rounded-full animate-pulse`}></div>
          </div>
          <div className={`flex items-center gap-2 ${trend.bg} px-3 py-1.5 rounded-lg ${trend.color} font-bold text-lg shadow-md`}>
            <span>{trend.icon}</span>
          </div>
        </div>

        {/* Label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{kpi.label}</div>
          {kpi.tooltip && (
            <div className="group/info relative">
              <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors">ℹ️</span>
              <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-64 transition-all duration-200">
                <div className="font-semibold mb-1">{kpi.label}</div>
                <div className="text-gray-300">{kpi.tooltip}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
          </div>
          {kpi.suffix && (
            <div className="text-lg font-semibold text-gray-600">{kpi.suffix}</div>
          )}
        </div>


      </div>
    </div>
  );
}

function SecondaryKpiCard({ kpi }: { kpi: Kpi }) {
  const statusConfig = {
    healthy: { dot: 'bg-green-500', ring: 'ring-green-200', gradient: 'from-green-500/20 to-emerald-500/20' },
    warning: { dot: 'bg-yellow-500', ring: 'ring-yellow-200', gradient: 'from-yellow-500/20 to-orange-500/20' },
    critical: { dot: 'bg-red-500', ring: 'ring-red-200', gradient: 'from-red-500/20 to-rose-500/20' },
  };

  const trendConfig = {
    up: { icon: '📈', color: 'text-green-600', bg: 'bg-green-50' },
    down: { icon: '📉', color: 'text-red-600', bg: 'bg-red-50' },
    stable: { icon: '➡️', color: 'text-gray-600', bg: 'bg-gray-50' },
  };

  const config = statusConfig[kpi.status];
  const trend = trendConfig[kpi.trend];

  return (
    <div className="group relative bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 p-5 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`relative w-3 h-3 ${config.dot} rounded-full animate-pulse ring-4 ${config.ring}`}></div>
          <div className={`${trend.bg} px-3 py-1 rounded-lg ${trend.color} text-xl font-bold shadow-sm`}>
            {trend.icon}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">{kpi.label}</div>
          {kpi.tooltip && (
            <div className="group/info relative">
              <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-sm">ℹ️</span>
              <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-64 transition-all duration-200">
                <div className="font-semibold mb-1">{kpi.label}</div>
                <div className="text-gray-300">{kpi.tooltip}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString('pt-BR') : kpi.value}
          </div>
          {kpi.suffix && (
            <div className="text-base font-semibold text-gray-500">{kpi.suffix}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCardModern({ alert }: { alert: Alert }) {
  const severityConfig = {
    low: { bg: 'from-blue-500 to-cyan-600', border: 'border-blue-300', glow: 'shadow-blue-500/50', icon: '💡' },
    medium: { bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-300', glow: 'shadow-yellow-500/50', icon: '⚡' },
    high: { bg: 'from-orange-500 to-red-600', border: 'border-orange-300', glow: 'shadow-orange-500/50', icon: '⚠️' },
    critical: { bg: 'from-red-500 to-rose-700', border: 'border-red-400', glow: 'shadow-red-500/50', icon: '🚨' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div className={`group relative bg-white rounded-xl shadow-xl border-2 ${config.border} p-5 hover:shadow-2xl ${config.glow} transition-all duration-300 overflow-hidden transform hover:scale-105`}>
      {/* Animated Pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative flex items-center gap-4">
        <div className={`relative w-16 h-16 bg-gradient-to-br ${config.bg} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform flex-shrink-0`}>
          <span className="text-3xl">{config.icon}</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-red-500 animate-pulse"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-base font-bold text-gray-900">{alert.label}</div>
            <div className="group/info relative">
              <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-sm">ℹ️</span>
              <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-64 transition-all duration-200">
                <div className="font-semibold mb-1">Alerta: {alert.label}</div>
                <div className="text-gray-300 mb-2">Ação recomendada: {alert.action}</div>
                <div className="text-gray-400 text-[10px]">Severidade: {alert.severity === 'critical' ? 'Crítica' : alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Média' : 'Baixa'}</div>
                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">{alert.action}</div>
          {alert.module && (
            <div className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">
              {alert.module}
            </div>
          )}
        </div>
        <div className={`text-3xl font-black bg-gradient-to-br ${config.bg} bg-clip-text text-transparent`}>
          {alert.count}
        </div>
      </div>
    </div>
  );
}

function QuickActionsGrid() {
  const modules = [
    { icon: '📊', title: 'Dashboard', href: '/admin/dashboard', gradient: 'from-blue-500 to-cyan-600', description: 'Análises' },
    { icon: '🎫', title: 'Service Desk', href: '/admin/service-desk', gradient: 'from-indigo-500 to-purple-600', description: 'Tickets' },
    { icon: '🔄', title: 'Pipeline', href: '/admin/pipeline', gradient: 'from-purple-500 to-pink-600', description: 'Funil' },
    { icon: '💰', title: 'Financeiro', href: '/admin/financeiro', gradient: 'from-green-500 to-emerald-600', description: 'Receitas' },
    { icon: '👥', title: 'Usuários', href: '/admin/users', gradient: 'from-orange-500 to-red-600', description: 'Gestão' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map(module => (
        <Link
          key={module.href}
          href={module.href}
          className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
        >
          {/* Hover Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          
          <div className="relative">
            <div className={`w-12 h-12 bg-gradient-to-br ${module.gradient} rounded-xl flex items-center justify-center shadow-lg mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
              <span className="text-2xl">{module.icon}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-base font-bold text-gray-900">{module.title}</div>
              <div className="group/info relative">
                <span className="text-gray-400 hover:text-gray-600 cursor-help transition-colors text-xs">ℹ️</span>
                <div className="invisible group-hover/info:visible opacity-0 group-hover/info:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 w-56 transition-all duration-200 pointer-events-none">
                  <div className="font-semibold mb-1">{module.title}</div>
                  <div className="text-gray-300">{module.description === 'Análises' ? 'Visualize métricas detalhadas, KPIs e tendências do sistema' : module.description === 'Tickets' ? 'Gerencie tickets de suporte com Kanban visual e SLA tracking' : module.description === 'Funil' ? 'Acompanhe o pipeline de vendas e conversões' : module.description === 'Receitas' ? 'Gerencie receitas, transações e indicadores financeiros' : 'Administre usuários, permissões e acessos'}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">{module.description}</div>
          </div>
          
          {/* Arrow */}
          <div className="absolute bottom-3 right-3 text-gray-400 group-hover:text-gray-700 transform group-hover:translate-x-1 transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SystemHealthCard({ health }: { health: { score: number, status: KpiStatus, label: string } }) {
  const statusConfig = {
    healthy: { gradient: 'from-green-500 to-emerald-600', ring: 'ring-green-200' },
    warning: { gradient: 'from-yellow-500 to-orange-600', ring: 'ring-yellow-200' },
    critical: { gradient: 'from-red-500 to-rose-600', ring: 'ring-red-200' },
  };

  const config = statusConfig[health.status];

  return (
    <div className="space-y-6">
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="url(#gradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${(health.score / 100) * 552} 552`}
            className="transition-all duration-1000"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`text-${health.status === 'healthy' ? 'green' : health.status === 'warning' ? 'yellow' : 'red'}-500`} stopColor="currentColor" />
              <stop offset="100%" className={`text-${health.status === 'healthy' ? 'emerald' : health.status === 'warning' ? 'orange' : 'rose'}-600`} stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-black bg-gradient-to-br ${config.gradient} bg-clip-text text-transparent`}>
            {health.score}%
          </div>
          <div className="text-sm font-semibold text-gray-600 mt-1">{health.label}</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="group/status relative bg-green-50 rounded-lg p-3 text-center border border-green-200 cursor-help hover:shadow-md transition-shadow">
          <div className="text-2xl font-black text-green-600">✓</div>
          <div className="text-xs font-semibold text-gray-700 mt-1">Saudável</div>
          <div className="invisible group-hover/status:visible opacity-0 group-hover/status:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50 w-48 transition-all duration-200 pointer-events-none">
            <strong>Status Saudável:</strong> Operando dentro dos parâmetros esperados sem necessidade de intervenção
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
        <div className="group/status relative bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200 cursor-help hover:shadow-md transition-shadow">
          <div className="text-2xl font-black text-yellow-600">⚠</div>
          <div className="text-xs font-semibold text-gray-700 mt-1">Atenção</div>
          <div className="invisible group-hover/status:visible opacity-0 group-hover/status:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50 w-48 transition-all duration-200 pointer-events-none">
            <strong>Status Atenção:</strong> Indicador fora do ideal, requer monitoramento e possível ação preventiva
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
        <div className="group/status relative bg-red-50 rounded-lg p-3 text-center border border-red-200 cursor-help hover:shadow-md transition-shadow">
          <div className="text-2xl font-black text-red-600">✗</div>
          <div className="text-xs font-semibold text-gray-700 mt-1">Crítico</div>
          <div className="invisible group-hover/status:visible opacity-0 group-hover/status:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50 w-48 transition-all duration-200 pointer-events-none">
            <strong>Status Crítico:</strong> Problema grave detectado, requer ação imediata para evitar impactos severos
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Real-time Badge */}
      <div className="group/realtime relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200 cursor-help hover:shadow-md transition-shadow">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-semibold text-gray-700">Atualização em tempo real</span>
        <span className="text-gray-400 hover:text-gray-600 transition-colors text-sm ml-1">ℹ️</span>
        <div className="invisible group-hover/realtime:visible opacity-0 group-hover/realtime:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50 w-56 transition-all duration-200 pointer-events-none">
          <strong>Monitoramento Contínuo:</strong> Os dados são atualizados automaticamente a cada 2 minutos, garantindo visibilidade instantânea do estado da plataforma
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
