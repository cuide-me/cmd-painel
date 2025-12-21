/**
 * ═══════════════════════════════════════════════════════
 * TORRE DE CONTROLE - HOMEPAGE REDESIGN V2
 * ═══════════════════════════════════════════════════════
 * Dashboard moderno com acesso rápido a todos os módulos
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authFetch } from '@/lib/client/authFetch';
import { Top5Problemas } from '@/components/admin/Top5Problemas';
import MultiLineChart from '@/components/admin/charts/MultiLineChart';
import { LineChart } from '@/components/admin/charts/LineChart';
import type { TorreControleDashboard } from '@/services/admin/torre-controle/types';

interface DailyData {
  date: string;
  websiteViews: number;
  loginPageViews: number;
  signups: number;
  professionals: number;
  clients: number;
}

interface ModuleCard {
  id: string;
  title: string;
  icon: string;
  href: string;
  description: string;
  color: string;
  gradient: string;
}

const modules: ModuleCard[] = [
  {
    id: 'executivo',
    title: 'Dashboard Executivo',
    icon: '📊',
    href: '/admin/executivo',
    description: 'GMV, LTV:CAC, ARR, MRR, Runway',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-700'
  },
  {
    id: 'dashboard-v2',
    title: 'Dashboard V2',
    icon: '📈',
    href: '/admin/dashboard',
    description: 'Visão completa: Demanda, Oferta, Financeiro',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-700'
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: '🛒',
    href: '/admin/marketplace',
    description: 'Jobs, Matches, Taxa de Conversão',
    color: 'green',
    gradient: 'from-green-500 to-green-700'
  },
  {
    id: 'familias',
    title: 'Famílias',
    icon: '👨‍👩‍👧‍👦',
    href: '/admin/familias',
    description: 'Cadastros, Ativação, Retenção',
    color: 'pink',
    gradient: 'from-pink-500 to-pink-700'
  },
  {
    id: 'cuidadores',
    title: 'Cuidadores',
    icon: '👨‍⚕️',
    href: '/admin/cuidadores',
    description: 'Profissionais, Disponibilidade, Qualidade',
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-700'
  },
  {
    id: 'pipeline',
    title: 'Pipeline',
    icon: '📊',
    href: '/admin/pipeline',
    description: 'Funil de Conversão, Etapas, Drop-off',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-700'
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: '💰',
    href: '/admin/financeiro',
    description: 'Receitas, Churn, Ticket Médio',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-700'
  },
  {
    id: 'confianca',
    title: 'Confiança & Qualidade',
    icon: '⭐',
    href: '/admin/confianca',
    description: 'NPS, Ratings, Satisfação',
    color: 'yellow',
    gradient: 'from-yellow-500 to-yellow-700'
  },
  {
    id: 'friccao',
    title: 'Fricção',
    icon: '⚠️',
    href: '/admin/friccao',
    description: 'Pontos de Atrito, Gargalos',
    color: 'red',
    gradient: 'from-red-500 to-red-700'
  },
  {
    id: 'service-desk',
    title: 'Service Desk',
    icon: '🎧',
    href: '/admin/service-desk',
    description: 'Tickets, SLA, Resoluções',
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-700'
  },
];

export default function TorreControleHomepage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<TorreControleDashboard | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DailyData[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    fetchDashboard();
    fetchAnalyticsData();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await authFetch('/api/admin/torre-controle');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.data);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await authFetch('/api/admin/analytics-daily?days=30');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data || []);
      }
    } catch (err) {
      console.error('Erro analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🎯 Torre de Controle</h1>
        <p className="text-gray-600 mt-2">Dashboard administrativo completo • Cuide.me</p>
      </div>

      {/* TOP 5 PROBLEMAS */}
      {dashboard?.top5Problemas && dashboard.top5Problemas.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Top5Problemas problemas={dashboard.top5Problemas} />
        </div>
      )}

      {/* ANALYTICS CHARTS - 2 GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Acessos ao Site (2 linhas: site + login) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {analyticsLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-40 bg-gray-100 rounded"></div>
            </div>
          ) : (
            <MultiLineChart
              lines={[
                {
                  data: analyticsData.map(d => ({ date: d.date, value: d.websiteViews })),
                  label: 'www.cuide-me.com.br',
                  color: '#3b82f6'
                },
                {
                  data: analyticsData.map(d => ({ date: d.date, value: d.loginPageViews })),
                  label: '/login',
                  color: '#8b5cf6'
                }
              ]}
              title="📊 Acessos ao Site - Últimos 30 dias (GA4)"
              height={350}
            />
          )}
        </div>

        {/* Gráfico 2: Cadastros no Firebase (2 linhas) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {analyticsLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-40 bg-gray-100 rounded"></div>
            </div>
          ) : (
            <MultiLineChart
              lines={[
                {
                  data: analyticsData.map(d => ({ date: d.date, value: d.professionals })),
                  label: 'Profissionais',
                  color: '#f59e0b'
                },
                {
                  data: analyticsData.map(d => ({ date: d.date, value: d.clients })),
                  label: 'Clientes/Famílias',
                  color: '#10b981'
                }
              ]}
              title="✉️ Cadastros - Últimos 30 dias (Firebase)"
              height={350}
            />
          )}
        </div>
      </div>

      {/* QUICK STATS */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Demanda */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              {dashboard.demanda.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  dashboard.demanda.status === 'excelente' ? 'bg-green-200 text-green-800' :
                  dashboard.demanda.status === 'bom' ? 'bg-blue-200 text-blue-800' :
                  dashboard.demanda.status === 'atencao' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {dashboard.demanda.status}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.demanda.totalFamilias}</div>
            <div className="text-sm text-gray-600">Famílias Ativas</div>
            <div className="text-xs text-gray-500 mt-2">
              +{dashboard.demanda.novasFamilias30d} nos últimos 30 dias
            </div>
          </div>

          {/* Oferta */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👨‍⚕️</span>
              {dashboard.oferta.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  dashboard.oferta.status === 'excelente' ? 'bg-green-200 text-green-800' :
                  dashboard.oferta.status === 'bom' ? 'bg-blue-200 text-blue-800' :
                  dashboard.oferta.status === 'atencao' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {dashboard.oferta.status}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.oferta.totalCuidadores}</div>
            <div className="text-sm text-gray-600">Cuidadores Ativos</div>
            <div className="text-xs text-gray-500 mt-2">
              +{dashboard.oferta.novosCuidadores30d} nos últimos 30 dias
            </div>
          </div>

          {/* Core MVP */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎯</span>
              {dashboard.coreMvp.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  dashboard.coreMvp.status === 'excelente' ? 'bg-green-200 text-green-800' :
                  dashboard.coreMvp.status === 'bom' ? 'bg-blue-200 text-blue-800' :
                  dashboard.coreMvp.status === 'atencao' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {dashboard.coreMvp.status}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.coreMvp.jobsAtivos}</div>
            <div className="text-sm text-gray-600">Jobs Ativos</div>
            <div className="text-xs text-gray-500 mt-2">
              {dashboard.coreMvp.taxaMatch}% taxa de match
            </div>
          </div>

          {/* Financeiro */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💰</span>
              {dashboard.financeiro.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  dashboard.financeiro.status === 'excelente' ? 'bg-green-200 text-green-800' :
                  dashboard.financeiro.status === 'bom' ? 'bg-blue-200 text-blue-800' :
                  dashboard.financeiro.status === 'atencao' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {dashboard.financeiro.status}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(dashboard.financeiro.gmv)}
            </div>
            <div className="text-sm text-gray-600">GMV Mensal</div>
            <div className="text-xs text-gray-500 mt-2">
              {dashboard.financeiro.taxaConversao}% conversão
            </div>
          </div>

          {/* Confiança */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⭐</span>
              {dashboard.confianca.status && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  dashboard.confianca.status === 'excelente' ? 'bg-green-200 text-green-800' :
                  dashboard.confianca.status === 'bom' ? 'bg-blue-200 text-blue-800' :
                  dashboard.confianca.status === 'atencao' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {dashboard.confianca.status}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900">{dashboard.confianca.ratingMedio.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Rating Médio</div>
            <div className="text-xs text-gray-500 mt-2">
              {dashboard.confianca.ticketsAbertos} tickets abertos
            </div>
          </div>
        </div>
      )}

      {/* MÓDULOS GRID */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Módulos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{module.icon}</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                  {module.title}
                </h3>
                
                <p className="text-sm text-gray-600 leading-relaxed">
                  {module.description}
                </p>

                {/* Bottom Accent */}
                <div className={`mt-4 h-1 bg-gradient-to-r ${module.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>Torre de Controle V2 • Última atualização: {dashboard ? new Date(dashboard.timestamp).toLocaleString('pt-BR') : 'Carregando...'}</p>
      </div>
    </div>
  );
}
