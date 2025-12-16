'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';

type KpiStatus = 'healthy' | 'warning' | 'critical';

interface Kpi {
  label: string;
  value: number | string;
  status: KpiStatus;
  icon: string;
  trend: string;
  change: string;
}

interface Module {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  stats: { label: string; value: string; }[];
  color: string;
  bgGradient: string;
}

export default function TorreControle() {
  const router = useRouter();
  const { authReady } = useFirebaseAuth();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);

  const modules: Module[] = [
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard Analytics',
      description: 'Métricas detalhadas e análises avançadas',
      href: '/admin/dashboard',
      stats: [
        { label: 'Visitas hoje', value: '2.4K' },
        { label: 'Conversões', value: '156' },
      ],
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'pipeline',
      icon: '🔄',
      title: 'Pipeline de Vendas',
      description: 'Funil completo e gestão de leads',
      href: '/admin/pipeline',
      stats: [
        { label: 'Leads ativos', value: '89' },
        { label: 'Taxa conversão', value: '12%' },
      ],
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
    },
    {
      id: 'financeiro',
      icon: '💰',
      title: 'Gestão Financeira',
      description: 'Receitas, despesas e relatórios',
      href: '/admin/financeiro',
      stats: [
        { label: 'MRR', value: 'R$ 45K' },
        { label: 'Crescimento', value: '+15%' },
      ],
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
    },
    {
      id: 'users',
      icon: '👥',
      title: 'Gestão de Usuários',
      description: 'Usuários, permissões e atividades',
      href: '/admin/users',
      stats: [
        { label: 'Total usuários', value: '1.2K' },
        { label: 'Novos (30d)', value: '+234' },
      ],
      color: 'orange',
      bgGradient: 'from-orange-500 to-orange-600',
    },
    {
      id: 'growth',
      icon: '📈',
      title: 'Growth & Marketing',
      description: 'Campanhas e métricas de crescimento',
      href: '/admin/growth',
      stats: [
        { label: 'CAC', value: 'R$ 45' },
        { label: 'LTV', value: 'R$ 890' },
      ],
      color: 'pink',
      bgGradient: 'from-pink-500 to-pink-600',
    },
    {
      id: 'support',
      icon: '🎧',
      title: 'Service Desk',
      description: 'Suporte e tickets de atendimento',
      href: '/admin/support',
      stats: [
        { label: 'Tickets abertos', value: '12' },
        { label: 'Tempo médio', value: '2h' },
      ],
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-indigo-600',
    },
  ];

  useEffect(() => {
    if (!authReady) return;
    
    // Simular dados enquanto API carrega
    setKpis([
      { label: 'Usuários Ativos', value: '1.234', status: 'healthy', icon: '👥', trend: 'up', change: '+12.5%' },
      { label: 'Receita Mensal', value: 'R$ 45.6K', status: 'healthy', icon: '💰', trend: 'up', change: '+18.2%' },
      { label: 'Taxa Conversão', value: '23.4%', status: 'warning', icon: '📈', trend: 'down', change: '-3.1%' },
      { label: 'NPS Score', value: '8.7', status: 'healthy', icon: '⭐', trend: 'up', change: '+0.5' },
    ]);
    setLoading(false);
  }, [authReady]);

  const handleLogout = () => {
    localStorage.removeItem('admin_logged');
    router.push('/admin/login');
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cuide-me</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/admin" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                Torre
              </Link>
              <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Dashboard
              </Link>
              <Link href="/admin/pipeline" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Pipeline
              </Link>
              <Link href="/admin/financeiro" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Financeiro
              </Link>
              <Link href="/admin/users" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
                Usuários
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎯 Torre de Controle</h2>
              <p className="text-gray-600">Visão completa da plataforma em tempo real</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700 font-medium">Sistema Operacional</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <KpiCard key={index} kpi={kpi} />
          ))}
        </div>

        {/* Modules Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <h3 className="text-2xl font-bold text-gray-900">Módulos do Sistema</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 Atividade Recente</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver tudo</button>
            </div>
            <div className="space-y-3">
              <ActivityItem 
                icon="✅"
                title="5 novos usuários cadastrados"
                time="Há 15 minutos"
                color="green"
              />
              <ActivityItem 
                icon="💳"
                title="3 pagamentos processados"
                time="Há 1 hora"
                color="blue"
              />
              <ActivityItem 
                icon="📧"
                title="12 emails enviados com sucesso"
                time="Há 2 horas"
                color="purple"
              />
              <ActivityItem 
                icon="🎯"
                title="2 metas alcançadas"
                time="Há 3 horas"
                color="orange"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">⚡ Status Rápido</h3>
              <span className="text-xs text-gray-500">Atualizado agora</span>
            </div>
            <div className="space-y-4">
              <QuickStat label="Disponibilidade" value="99.9%" color="green" />
              <QuickStat label="Tempo de resposta" value="142ms" color="blue" />
              <QuickStat label="Taxa de erro" value="0.02%" color="green" />
              <QuickStat label="Usuários online" value="342" color="purple" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © 2025 Cuide-me. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600 transition">Suporte</a>
              <a href="#" className="hover:text-blue-600 transition">Documentação</a>
              <a href="#" className="hover:text-blue-600 transition">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const statusColors = {
    healthy: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50',
    warning: 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50',
    critical: 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50',
  };

  const textColors = {
    healthy: 'text-green-700',
    warning: 'text-yellow-700',
    critical: 'text-red-700',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→',
  };

  return (
    <div className={`rounded-xl shadow-sm border-2 ${statusColors[kpi.status]} p-6 hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{kpi.icon}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            {trendIcons[kpi.trend as keyof typeof trendIcons]} {kpi.change}
          </span>
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
      <div className="text-sm text-gray-600">{kpi.label}</div>
    </div>
  );
}

function ModuleCard({ module }: { module: Module }) {
  const colorMap = {
    blue: 'hover:border-blue-400',
    purple: 'hover:border-purple-400',
    green: 'hover:border-green-400',
    orange: 'hover:border-orange-400',
    pink: 'hover:border-pink-400',
    indigo: 'hover:border-indigo-400',
  };

  return (
    <Link 
      href={module.href} 
      className={`group block bg-white rounded-xl shadow-sm border-2 border-gray-200 ${colorMap[module.color as keyof typeof colorMap]} hover:shadow-lg transition-all overflow-hidden`}
    >
      {/* Header com gradiente */}
      <div className={`bg-gradient-to-r ${module.bgGradient} p-6 text-white`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-4xl">{module.icon}</span>
          <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-1">{module.title}</h3>
        <p className="text-sm text-white/90">{module.description}</p>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          {module.stats.map((stat, idx) => (
            <div key={idx}>
              <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[color as keyof typeof colors]}`}>
        {value}
      </span>
    </div>
  );
}

function ActivityItem({ icon, title, time, color }: any) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center text-lg`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </div>
    </div>
  );
}

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
