'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminTorreControle() {
  const router = useRouter();
  const [stats, setStats] = useState({
    familias: 0,
    profissionais: 0,
    receita: 0,
    tickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged') === 'true';
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    // Buscar stats reais do Firebase
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/torre-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao buscar stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

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
        {/* Header com Logo */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <Image
                src="/logo-cuide-me.png"
                alt="Cuide-me"
                fill
                className="object-contain"
                priority
              />
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

        {/* Cards de Visão Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="text-3xl mb-2">👨‍👩‍👧</div>
            <div className="text-4xl font-bold text-black mb-1">
              {loading ? '...' : stats.familias}
            </div>
            <div className="text-sm text-black">Clientes (Famílias)</div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="text-3xl mb-2">👩‍⚕️</div>
            <div className="text-4xl font-bold text-black mb-1">
              {loading ? '...' : stats.profissionais}
            </div>
            <div className="text-sm text-black">Profissionais</div>
          </div>
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
            <div className="text-3xl mb-2">💵</div>
            <div className="text-4xl font-bold text-black mb-1">
              {loading
                ? '...'
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    stats.receita
                  )}
            </div>
            <div className="text-sm text-black">Receita Mês</div>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="text-3xl mb-2">🎫</div>
            <div className="text-4xl font-bold text-black mb-1">
              {loading ? '...' : stats.tickets}
            </div>
            <div className="text-sm text-black">Tickets Abertos</div>
          </div>
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

        {/* Alertas */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-black mb-6">⚠️ Alertas & Notificações</h2>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <p className="text-black text-sm">
              Nenhum alerta no momento. Sistema operando normalmente.
            </p>
          </div>
        </div>

        {/* Atividade Recente */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-6">� Atividade Recente (24h)</h2>
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
