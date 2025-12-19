'use client';

/**
 * Torre de Controle V2 - Dashboard Decisório
 * Responde em 5 segundos:
 * 1. Estamos ganhando ou perdendo dinheiro?
 * 2. Onde está o gargalo agora?
 * 3. O que vai virar problema se eu não agir hoje?
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, EmptyState, LoadingSkeleton } from '@/components/admin/AdminLayout';
import type { ControlTowerDashboard } from '@/services/admin/control-tower/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyMetric {
  date: string;
  signups: number;
  views: number;
}

export default function TorreControleV2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ControlTowerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    // Verificar se está logado
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    fetchDashboard();
    fetchDailyMetrics();
    
    // Auto-refresh a cada 60 segundos
    const interval = setInterval(() => {
      fetchDashboard();
      fetchDailyMetrics();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await authFetch('/api/admin/control-tower');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Admin] Torre de Controle loaded:', data);
        setDashboard(data);  // ✅ API retorna dados direto (não data.data)
        setError(null);
      } else {
        setError('Erro ao carregar dashboard');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyMetrics = async () => {
    try {
      const response = await authFetch('/api/admin/daily-metrics');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Admin] Daily metrics loaded:', data);
        setDailyMetrics(data.data || []);
      } else {
        console.error('[Admin] Failed to load daily metrics:', response.status);
      }
    } catch (err) {
      console.error('Erro ao carregar métricas diárias:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Torre de Controle" subtitle="Carregando..." icon="🎯">
        <LoadingSkeleton lines={8} />
      </AdminLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <AdminLayout title="Torre de Controle" subtitle="Erro" icon="🎯">
        <EmptyState
          icon="⚠️"
          title="Erro ao carregar"
          description={error || 'Não foi possível carregar os dados'}
          action="Tentar novamente"
          onAction={fetchDashboard}
        />
      </AdminLayout>
    );
  }

  const { finance, operations, growth, quality, alerts } = dashboard;

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <AdminLayout 
      title="Torre de Controle" 
      subtitle="Dashboard Decisório - Cuide.me" 
      icon="🎯"
    >
      {/* ============================================ */}
      {/* ALERTAS CRÍTICOS - Topo da página          */}
      {/* ============================================ */}
      {alerts.length > 0 && (
        <Section title="🚨 Alertas Críticos - Ação Necessária">
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card 
                key={alert.id} 
                padding="sm" 
                className={
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-slate-700 mb-2">
                      {alert.message}
                    </p>
                    <p className="text-xs font-medium text-slate-800">
                      💡 <strong>Ação recomendada:</strong> {alert.action}
                    </p>
                  </div>
                  <Badge 
                    variant={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
                  >
                    {alert.type.toUpperCase()}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ============================================ */}
      {/* BLOCO 1: FINANCEIRO (Stripe)              */}
      {/* ============================================ */}
      <Section title="💰 Saúde Financeira">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            label="MRR"
            value={formatCurrency(finance.mrr)}
            change={finance.mrrGrowth}
            trend={finance.mrrGrowth > 0 ? 'up' : finance.mrrGrowth < 0 ? 'down' : 'neutral'}
            icon="💰"
            tooltip="Monthly Recurring Revenue - Receita recorrente mensal de todas as assinaturas ativas"
          />

          <StatCard
            label="Revenue (30d)"
            value={formatCurrency(finance.revenue)}
            icon="💵"
            tooltip="Revenue total dos últimos 30 dias (todas as cobranças bem-sucedidas)"
          />

          <StatCard
            label="Burn Rate"
            value={formatCurrency(Math.abs(finance.burnRate))}
            icon={finance.burnRate > 0 ? '💚' : '🔥'}
            tooltip="Diferença entre receita e despesas. Positivo = Lucro. Negativo = Queimando caixa"
          />

          <StatCard
            label="Runway"
            value={finance.runway === 999 ? '∞' : `${finance.runway}m`}
            icon={finance.runway > 12 ? '🟢' : finance.runway > 6 ? '🟡' : '🔴'}
            tooltip="Meses até acabar o caixa com o burn rate atual. > 12 meses = saudável"
          />

          <StatCard
            label="Churn Rate"
            value={`${finance.churnRate}%`}
            icon={finance.churnRate < 5 ? '✅' : '⚠️'}
            tooltip="Taxa de cancelamento mensal. Meta: < 5%"
          />

          <StatCard
            label="Assinaturas"
            value={finance.activeSubscriptions.toString()}
            icon="📊"
            tooltip="Total de assinaturas ativas no Stripe"
          />

          <StatCard
            label="Crescimento MRR"
            value={`${finance.mrrGrowth > 0 ? '+' : ''}${finance.mrrGrowth}%`}
            icon={finance.mrrGrowth > 0 ? '📈' : finance.mrrGrowth < 0 ? '📉' : '➡️'}
            tooltip="Variação percentual do MRR em relação ao mês anterior"
          />
        </div>
      </Section>

      {/* ============================================ */}
      {/* BLOCO 2: OPERACIONAL (Firebase)            */}
      {/* ============================================ */}
      <Section title="⚙️ Operação & Capacidade">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            label="Profissionais"
            value={operations.profissionaisTotal.toString()}
            icon="👥"
            tooltip="Total de profissionais cadastrados na plataforma"
          />

          <StatCard
            label="Disponíveis"
            value={operations.profissionaisDisponiveis.toString()}
            icon={operations.profissionaisDisponiveis > 10 ? '🟢' : operations.profissionaisDisponiveis > 5 ? '🟡' : '🔴'}
            tooltip="Profissionais sem atendimento ativo (disponíveis para novos jobs)"
          />

          <StatCard
            label="Em Atendimento"
            value={operations.profissionaisEmAtendimento.toString()}
            icon="💼"
            tooltip="Profissionais com jobs ativos no momento"
          />

          <StatCard
            label="SLA < 24h"
            value={`${operations.slaCompliance}%`}
            icon={operations.slaCompliance >= 80 ? '✅' : operations.slaCompliance >= 60 ? '⚠️' : '🚨'}
            tooltip="Percentual de jobs aceitos em menos de 24h. Meta: > 80%"
          />

          <StatCard
            label="Taxa Abandono"
            value={`${operations.taxaAbandono}%`}
            icon={operations.taxaAbandono < 20 ? '✅' : operations.taxaAbandono < 30 ? '⚠️' : '🚨'}
            tooltip="Jobs criados mas não aceitos. Meta: < 20%"
          />

          <StatCard
            label="Capacidade"
            value={`${operations.capacidadeUtilizacao}%`}
            icon={operations.capacidadeUtilizacao < 70 ? '🟢' : operations.capacidadeUtilizacao < 85 ? '🟡' : '🔴'}
            tooltip="Percentual de profissionais ocupados. > 80% = sobrecarga"
          />

          <StatCard
            label="Jobs Ativos"
            value={operations.jobsAtivos.toString()}
            icon="📋"
            tooltip="Total de jobs com status 'active' no momento"
          />
        </div>
      </Section>

      {/* ============================================ */}
      {/* BLOCO 3: GROWTH (GA4 + Firebase)           */}
      {/* ============================================ */}
      <Section title="📈 Crescimento (Últimos 7 dias)">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Visitantes"
            value={growth.visitantesUnicos.toString()}
            icon="👁️"
            tooltip="Visitantes únicos nos últimos 7 dias (Google Analytics 4)"
          />

          <StatCard
            label="Sessões"
            value={growth.sessoes.toString()}
            icon="🔄"
            tooltip="Total de sessões/visitas nos últimos 7 dias"
          />

          <StatCard
            label="Cadastros"
            value={growth.cadastros.toString()}
            icon="✍️"
            tooltip="Novos cadastros (Firebase users) nos últimos 7 dias"
          />

          <StatCard
            label="Conversão"
            value={`${growth.taxaConversao}%`}
            icon={growth.taxaConversao >= 3 ? '✅' : '⚠️'}
            tooltip="Taxa de conversão visitante → cadastro. Meta: > 3%"
          />

          <StatCard
            label="CAC"
            value={formatCurrency(growth.cac)}
            icon="💲"
            tooltip="Customer Acquisition Cost (custo por cadastro). Valor estimado."
          />
        </div>
      </Section>

      {/* ============================================ */}
      {/* BLOCO 4: QUALIDADE (Firebase)              */}
      {/* ============================================ */}
      <Section title="🎯 Qualidade & Satisfação">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="NPS Score"
            value={quality.npsScore.toString()}
            icon={quality.npsScore >= 50 ? '😍' : quality.npsScore >= 30 ? '😐' : '😞'}
            tooltip="Net Promoter Score. Baseado em feedbacks (ratings). Meta: > 50"
          />

          <StatCard
            label="Feedbacks"
            value={quality.feedbackCount.toString()}
            icon="💬"
            tooltip="Total de feedbacks/avaliações coletados"
          />

          <StatCard
            label="Tickets Abertos"
            value={quality.ticketsAbertos.toString()}
            icon={quality.ticketsAbertos < 20 ? '🟢' : quality.ticketsAbertos < 40 ? '🟡' : '🔴'}
            tooltip="Tickets com status open/pending/in_progress"
          />

          <StatCard
            label="Tickets em Atraso"
            value={quality.ticketsEmAtraso.toString()}
            icon={quality.ticketsEmAtraso === 0 ? '✅' : quality.ticketsEmAtraso < 10 ? '⚠️' : '🚨'}
            tooltip="Tickets sem resolução há mais de 48h. Meta: 0"
          />
        </div>
      </Section>

      {/* GRÁFICOS DIÁRIOS */}
      {!metricsLoading && (
        <Section title="📈 Métricas Diárias (Últimos 30 dias)">
          {dailyMetrics.length === 0 ? (
            <Card padding="md">
              <EmptyState
                icon="📊"
                title="Sem dados de métricas"
                description="Nenhum dado encontrado para os últimos 30 dias. Verifique se há eventos registrados no Firebase."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Visualizações */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Visualizações do Site (Dia a Dia)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR');
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Visualizações"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  Total: <span className="font-semibold text-slate-900">
                    {dailyMetrics.reduce((sum, d) => sum + d.views, 0).toLocaleString('pt-BR')}
                  </span> visualizações
                </div>
              </div>
            </Card>

            {/* Gráfico de Cadastros */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Cadastros na Plataforma (Dia a Dia)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR');
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="signups" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Cadastros"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  Total: <span className="font-semibold text-slate-900">
                    {dailyMetrics.reduce((sum, d) => sum + d.signups, 0).toLocaleString('pt-BR')}
                  </span> novos usuários
                </div>
              </div>
            </Card>
          </div>
          )}
        </Section>
      )}

      {/* MODULES - Mantido para navegação rápida */}
      <Section title="📱 Módulos Detalhados">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: 'Saúde Operacional', icon: '🏥', path: '/admin/operational-health' },
            { title: 'Service Desk', icon: '🎫', path: '/admin/service-desk' },
            { title: 'Central de Alertas', icon: '🚨', path: '/admin/alerts' },
            { title: 'Growth & Ativação', icon: '📈', path: '/admin/growth' },
            { title: 'Financeiro V2', icon: '💰', path: '/admin/financeiro-v2' },
            { title: 'Pipeline V2', icon: '🎯', path: '/admin/pipeline' },
            { title: 'Reports', icon: '📊', path: '/admin/reports' },
            { title: 'Dashboard V2', icon: '📱', path: '/admin/dashboard' },
            { title: 'Usuários', icon: '👥', path: '/admin/users' }
          ].map((module) => (
            <Card
              key={module.path}
              padding="md"
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => router.push(module.path)}
            >
              <div className="text-center">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {module.title}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Status Footer */}
      <Card padding="sm" className="bg-slate-50">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Sistema operacional</span>
          </div>
          <span>Última atualização: {new Date(dashboard.timestamp).toLocaleTimeString('pt-BR')}</span>
        </div>
      </Card>
    </AdminLayout>
  );
}
