'use client';

/**
 * ═══════════════════════════════════════════════════════
 * TORRE DE CONTROLE V2 - DASHBOARD HOMEPAGE
 * ═══════════════════════════════════════════════════════
 * 
 * Dashboard executivo com visão geral de todos os módulos
 * Design moderno com grid responsivo e cards interativos
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/client/authFetch';
import { StatCard, SectionHeader, Card, Badge } from '@/components/admin/ui';
import { utils, moduleIcons } from '@/lib/designSystem';
import LoadingState, { KpiSkeleton } from '@/components/admin/LoadingState';
import { ErrorState } from '@/components/admin/EmptyState';

interface DashboardStats {
  familias: {
    total: number;
    novas30d: number;
    trend: 'up' | 'down' | 'stable';
    conversao: number;
  };
  cuidadores: {
    total: number;
    ativos: number;
    trend: 'up' | 'down' | 'stable';
    disponibilidade: number;
  };
  jobs: {
    ativos: number;
    concluidos30d: number;
    trend: 'up' | 'down' | 'stable';
    taxaSucesso: number;
  };
  financeiro: {
    mrr: number;
    receita30d: number;
    trend: 'up' | 'down' | 'stable';
    churn: number;
  };
  qualidade: {
    nps: number;
    rating: number;
    ticketsAbertos: number;
    satisfacao: number;
  };
}

export default function DashboardHomepage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    loadDashboard();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      loadDashboard();
    }, 300000);
    
    return () => clearInterval(interval);
  }, [router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/admin/torre-home');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Erro ao carregar dados');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-64 bg-gray-200 rounded animate-pulse"></div>
        <KpiSkeleton count={4} />
        <KpiSkeleton count={4} />
      </div>
    );
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  if (!stats) {
    return <ErrorState message="Nenhum dado disponível" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-600 mt-1">
            Visão geral completa da operação • Atualizado {utils.formatDateTime(lastUpdate)}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>

      {/* KPIs Principais - Grid 4 colunas */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Métricas Principais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Famílias Ativas"
            value={utils.formatNumber(stats.familias.total)}
            subtitle={`+${stats.familias.novas30d} nos últimos 30 dias`}
            icon={moduleIcons.familias}
            trend={stats.familias.trend}
            trendValue={`${stats.familias.conversao}% conversão`}
            href="/admin/familias"
          />

          <StatCard
            title="Cuidadores"
            value={utils.formatNumber(stats.cuidadores.total)}
            subtitle={`${stats.cuidadores.ativos} ativos agora`}
            icon={moduleIcons.cuidadores}
            trend={stats.cuidadores.trend}
            trendValue={`${stats.cuidadores.disponibilidade}% disponíveis`}
            href="/admin/cuidadores"
          />

          <StatCard
            title="Jobs Ativos"
            value={utils.formatNumber(stats.jobs.ativos)}
            subtitle={`${stats.jobs.concluidos30d} concluídos em 30d`}
            icon={moduleIcons.pipeline}
            trend={stats.jobs.trend}
            trendValue={`${stats.jobs.taxaSucesso}% sucesso`}
            href="/admin/pipeline"
          />

          <StatCard
            title="MRR"
            value={utils.formatCurrency(stats.financeiro.mrr)}
            subtitle={`${utils.formatCurrency(stats.financeiro.receita30d)} em 30d`}
            icon={moduleIcons.financeiro}
            trend={stats.financeiro.trend}
            trendValue={`${stats.financeiro.churn}% churn`}
            href="/admin/financeiro"
          />
        </div>
      </div>

      {/* Qualidade & Operações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qualidade */}
        <Card title="⭐ Qualidade & Confiança">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">NPS Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{stats.qualidade.nps}</span>
                <Badge variant={stats.qualidade.nps >= 50 ? 'success' : stats.qualidade.nps >= 30 ? 'warning' : 'error'}>
                  {stats.qualidade.nps >= 50 ? 'Excelente' : stats.qualidade.nps >= 30 ? 'Bom' : 'Crítico'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rating Médio</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-900">{stats.qualidade.rating}</span>
                <span className="text-yellow-500">⭐</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Satisfação Geral</span>
              <span className="text-xl font-semibold text-green-600">{stats.qualidade.satisfacao}%</span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tickets Abertos</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-gray-900">{stats.qualidade.ticketsAbertos}</span>
                  {stats.qualidade.ticketsAbertos > 50 && (
                    <Badge variant="warning">Alto</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="🚀 Ações Rápidas">
          <div className="grid grid-cols-2 gap-3">
            <QuickActionButton
              icon={moduleIcons.marketplace}
              label="Marketplace"
              href="/admin/marketplace"
            />
            <QuickActionButton
              icon={moduleIcons.pipeline}
              label="Pipeline"
              href="/admin/pipeline"
            />
            <QuickActionButton
              icon={moduleIcons.confianca}
              label="Confiança"
              href="/admin/confianca"
            />
            <QuickActionButton
              icon={moduleIcons.friccao}
              label="Fricção"
              href="/admin/friccao"
            />
            <QuickActionButton
              icon={moduleIcons.serviceDesk}
              label="Service Desk"
              href="/admin/service-desk"
            />
            <QuickActionButton
              icon="👥"
              label="Usuários"
              href="/admin/users"
            />
          </div>
        </Card>
      </div>

      {/* Módulos Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📁 Todos os Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            icon={moduleIcons.marketplace}
            title="Marketplace Validation"
            description="Validação de demanda x oferta por especialidade e região"
            href="/admin/marketplace"
            stats={[
              { label: 'Ratio', value: '1.28' },
              { label: 'Status', value: 'Balanceado', color: 'green' }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.familias}
            title="Jornada das Famílias"
            description="Funil completo desde cadastro até job concluído"
            href="/admin/familias"
            stats={[
              { label: 'Conversão', value: `${stats.familias.conversao}%` },
              { label: 'Novas 30d', value: `+${stats.familias.novas30d}` }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.cuidadores}
            title="Performance Cuidadores"
            description="Disponibilidade, especialidades e retenção"
            href="/admin/cuidadores"
            stats={[
              { label: 'Disponíveis', value: `${stats.cuidadores.disponibilidade}%` },
              { label: 'Ativos', value: String(stats.cuidadores.ativos) }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.pipeline}
            title="Pipeline de Jobs"
            description="Funil de 5 estágios com bottlenecks"
            href="/admin/pipeline"
            stats={[
              { label: 'Ativos', value: String(stats.jobs.ativos) },
              { label: 'Taxa Sucesso', value: `${stats.jobs.taxaSucesso}%` }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.financeiro}
            title="Financeiro"
            description="MRR, receita, assinaturas e churn"
            href="/admin/financeiro"
            stats={[
              { label: 'MRR', value: utils.formatCurrency(stats.financeiro.mrr) },
              { label: 'Churn', value: `${stats.financeiro.churn}%`, color: stats.financeiro.churn > 5 ? 'red' : 'green' }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.confianca}
            title="Confiança & Qualidade"
            description="NPS, ratings e suporte"
            href="/admin/confianca"
            stats={[
              { label: 'NPS', value: String(stats.qualidade.nps) },
              { label: 'Rating', value: `${stats.qualidade.rating}⭐` }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.friccao}
            title="Pontos de Fricção"
            description="Análise de abandono e recovery"
            href="/admin/friccao"
            stats={[
              { label: 'Pontos Críticos', value: '3' },
              { label: 'Recovery', value: '21%' }
            ]}
          />

          <ModuleCard
            icon={moduleIcons.serviceDesk}
            title="Service Desk"
            description="Kanban de tickets de suporte"
            href="/admin/service-desk"
            stats={[
              { label: 'Abertos', value: String(stats.qualidade.ticketsAbertos) },
              { label: 'Resolução', value: '18.5h' }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, href }: { icon: string; label: string; href: string }) {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push(href)}
      className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all group"
    >
      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{label}</span>
    </button>
  );
}

// Module Card Component
interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  stats: Array<{ label: string; value: string; color?: 'green' | 'red' | 'blue' }>;
}

function ModuleCard({ icon, title, description, href, stats }: ModuleCardProps) {
  const router = useRouter();
  
  const getStatColor = (color?: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'red': return 'text-red-600';
      case 'blue': return 'text-blue-600';
      default: return 'text-gray-900';
    }
  };

  return (
    <button
      onClick={() => router.push(href)}
      className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex-1">
            <div className="text-xs text-gray-500">{stat.label}</div>
            <div className={`text-sm font-semibold ${getStatColor(stat.color)}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}
