'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KpiCard from '@/components/admin/torre/KpiCard';
import ModuleCard from '@/components/admin/torre/ModuleCard';
import AlertCard from '@/components/admin/torre/AlertCard';

export default function AdminTorreControle() {
  const router = useRouter();
  const [torreData, setTorreData] = useState<{
    kpis: Array<{
      id: string;
      label: string;
      value: number | string;
      status: 'green' | 'yellow' | 'red';
      trend: 'up' | 'down' | 'flat';
      tooltip: string;
      suffix?: string;
    }>;
    trends: Array<{ id: string; label: string; value: number; trend: 'up' | 'down' | 'flat'; tooltip: string }>;
    alerts: Array<{ id: string; label: string; count: number; severity: 'low' | 'medium' | 'high'; action: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged') === 'true';
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    fetchTorreData();
    
    // Refresh a cada 2 minutos
    const interval = setInterval(fetchTorreData, 120000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchTorreData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/torre/overview');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      
      const data = await response.json();
      setTorreData(data);
    } catch (err: any) {
      console.error('Erro ao buscar dados da Torre:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged');
    router.push('/admin/login');
  };

  const navItems = [
    {
      icon: '📊',
      title: 'Dashboard',
      desc: 'Indicadores de negócio',
      href: '/admin/dashboard',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      icon: '🔄',
      title: 'Pipeline',
      desc: 'Funil de contratação',
      href: '/admin/pipeline',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      icon: '💰',
      title: 'Financeiro',
      desc: 'Receitas e pagamentos',
      href: '/admin/financeiro',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      icon: '👥',
      title: 'Usuários',
      desc: 'Profissionais e clientes',
      href: '/admin/users',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      icon: '🔌',
      title: 'Integrações',
      desc: 'Stripe, Firebase, APIs',
      href: '/admin/integracoes',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      icon: '⭐',
      title: 'Qualidade',
      desc: 'NPS e feedbacks',
      href: '/admin/qualidade',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      icon: '🎫',
      title: 'Suporte',
      desc: 'Tickets e SLA',
      href: '/admin/suporte',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      icon: '🔥',
      title: 'Firebase',
      desc: 'Console do banco',
      href: 'https://console.firebase.google.com/project/plataforma-cuide-me',
      color: 'bg-pink-600 hover:bg-pink-700',
      external: true,
    },
    {
      icon: '⚙️',
      title: 'Configurações',
      desc: 'Configurações gerais',
      href: '/admin/config',
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🏥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Torre de Controle</h1>
              <p className="text-sm text-black mt-1">Painel Administrativo Cuide-me</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors font-semibold"
          >
            Sair
          </button>
        </div>

        {/* KPIs Essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
          {(torreData?.kpis ?? []).map((item) => {
            const mapStatus = (s: 'green' | 'yellow' | 'red'): 'healthy' | 'warning' | 'critical' => (
              s === 'green' ? 'healthy' : s === 'yellow' ? 'warning' : 'critical'
            );
            const mapTrend = (t: 'up' | 'down' | 'flat'): 'up' | 'down' | 'stable' => (
              t === 'flat' ? 'stable' : t
            );
            const unit = item.suffix === '%' ? '%' : item.suffix === 'h' ? 'h' : undefined;
            return (
              <KpiCard
                key={item.id}
                kpi={{
                  label: item.label,
                  value: typeof item.value === 'string' ? Number(String(item.value).replace(/[^0-9.-]/g, '')) : item.value,
                  unit,
                  status: mapStatus(item.status),
                  trend: mapTrend(item.trend),
                  tooltip: item.tooltip,
                  actionable: item.tooltip,
                }}
              />
            );
          })}
        </div>

        {/* Grid de Acesso Rápido */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">🚀 Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {navItems.map(item => (
              <button
                key={item.href}
                onClick={() =>
                  item.external ? window.open(item.href, '_blank') : router.push(item.href)
                }
                className={`${item.color} text-white rounded-lg p-6 text-left transition-all hover:shadow-lg transform hover:-translate-y-1`}
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="text-xl font-bold mb-1">{item.title}</div>
                <div className="text-sm">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Alertas & Riscos */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">⚠️ Alertas & Riscos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(torreData?.alerts ?? []).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={{
                  id: alert.id,
                  label: alert.label,
                  count: alert.count,
                  severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
                  action: alert.action,
                  module: 'overview',
                }}
              />
            ))}
          </div>
        </div>

        {/* Atividade Recente */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-6">🕑 Atividade Recente (24h)</h2>
          <div className="bg-white border-2 border-black rounded-lg p-6">
            <ul className="space-y-3 text-black">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span>Sistema inicializado com sucesso</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
