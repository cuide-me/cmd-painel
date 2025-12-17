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
        setDashboard(data.data);
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

  const { businessHealth, operations, marketplace, urgentActions } = dashboard;

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper para cor de tendência
  const getTrendColor = (trend: string) => {
    if (trend === 'up' || trend === 'improving') return 'text-green-600';
    if (trend === 'down' || trend === 'worsening') return 'text-red-600';
    return 'text-slate-600';
  };

  // Helper para ícone de tendência
  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'improving') return '↑';
    if (trend === 'down' || trend === 'worsening') return '↓';
    return '→';
  };

  return (
    <AdminLayout 
      title="Torre de Controle" 
      subtitle="Dashboard Decisório - Cuide.me" 
      icon="🎯"
    >
      {/* BLOCO 1: REALIDADE DO NEGÓCIO */}
      <Section title="💰 Realidade do Negócio">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Receita do Mês */}
          <StatCard
            label="Receita do Mês"
            value={formatCurrency(businessHealth.monthRevenue.current)}
            change={businessHealth.monthRevenue.percentChange}
            trend={businessHealth.monthRevenue.trend === 'stable' ? 'neutral' : businessHealth.monthRevenue.trend}
            icon="💰"
            tooltip="MRR (Monthly Recurring Revenue) total do mês atual. Soma de todas as assinaturas ativas. Indica a saúde financeira recorrente do negócio."
          />

          {/* 2. Burn Rate */}
          <StatCard
            label="Burn Rate"
            value={formatCurrency(Math.abs(businessHealth.burnRate.netBurn))}
            icon={businessHealth.burnRate.status === 'profit' ? '💚' : businessHealth.burnRate.status === 'burning' ? '🔥' : '💛'}
            tooltip="Diferença entre receita e despesas mensais. Positivo = Lucro. Negativo = Queimando caixa. Mede se o negócio está sustentável financeiramente."
          />

          {/* 3. Runway */}
          <StatCard
            label="Runway"
            value={businessHealth.runway.months === 999 ? '∞' : `${businessHealth.runway.months} meses`}
            icon={businessHealth.runway.status === 'healthy' ? '🟢' : businessHealth.runway.status === 'warning' ? '🟡' : '🔴'}
            tooltip="Quantos meses a empresa sobrevive com o caixa atual se o Burn Rate continuar. Crítico se < 6 meses. Saudável se > 12 meses."
          />

          {/* 4. MRR em Risco */}
          <StatCard
            label="MRR em Risco"
            value={formatCurrency(businessHealth.mrrAtRisk.amount)}
            change={-businessHealth.mrrAtRisk.percentage}
            trend="down"
            icon="⚠️"
            tooltip="Valor mensal em risco de churn (cancelamento). Inclui clientes insatisfeitos, pagamentos atrasados, ou profissionais que desistiram pós-aceite. Requer ação imediata do CS."
          />

          {/* 5. Saúde do Sistema */}
          <StatCard
            label="Saúde do Sistema"
            value={`${businessHealth.systemHealth.score}/100`}
            icon={businessHealth.systemHealth.status === 'healthy' ? '✅' : businessHealth.systemHealth.status === 'warning' ? '⚠️' : '🚨'}
            tooltip="Score geral de saúde operacional (0-100). Considera SLA de atendimento, taxa de conversão, abandono de profissionais e gargalos. < 70 = crítico."
          />
        </div>

        {/* Detalhes do MRR em Risco */}
        {businessHealth.mrrAtRisk.amount > 0 && (
          <Card padding="sm" className="mt-3 bg-slate-50">
            <div className="text-xs text-slate-700">
              <span className="font-semibold">Motivos do risco:</span>
              <ul className="mt-2 space-y-1">
                {businessHealth.mrrAtRisk.reasons.map((reason, i) => (
                  <li key={i} className="flex justify-between">
                    <span>• {reason.label}</span>
                    <span className="font-medium">{formatCurrency(reason.value)} ({reason.count} casos)</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </Section>

      {/* BLOCO 2: GARGALOS OPERACIONAIS */}
      <Section title="⚙️ Gargalos Operacionais">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="SLA < 24h"
            value={operations.requestsBySLA.underTwentyFour.count.toString()}
            tooltip="Solicitações dentro do SLA ideal (criadas há menos de 24h). Meta: 80%+ das solicitações. Indica eficiência operacional e boa experiência do usuário."
          />
          
          <StatCard
            label="Tempo Médio Match"
            value={`${operations.averageTimeToMatch.hours.toFixed(1)}h`}
            tooltip="Tempo médio entre criar uma solicitação e encontrar um profissional. Meta: < 8h. Afeta diretamente a satisfação do cliente e taxa de conversão."
          />

          <StatCard
            label="SLA > 48h (CRÍTICO)"
            value={operations.requestsBySLA.overFortyEight.count.toString()}
            tooltip="Solicitações críticas com mais de 48h sem match. Alto risco de cancelamento. Requer ação urgente da equipe de operações."
          />
        </div>
      </Section>

      {/* BLOCO 3: SAÚDE DO MARKETPLACE */}
      <Section title="🎯 Saúde do Marketplace">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Profissionais Disponíveis"
            value={marketplace.availableProfessionals.count.toString()}
            tooltip="Número de profissionais disponíveis AGORA para atender. Comparado com demanda aberta para avaliar capacidade. Ratio ideal: > 1.2 profissionais por solicitação."
          />

          <StatCard
            label="Abandono Pós-Aceite"
            value={`${marketplace.postAcceptAbandonment.rate.toFixed(1)}%`}
            tooltip="Taxa de profissionais que aceitaram solicitação mas depois abandonaram. Limite aceitável: < 5%. Indica qualidade do match e comprometimento dos profissionais."
          />
        </div>
      </Section>

      {/* BLOCO 4: ANALYTICS (GA4) */}
      {dashboard.analytics && (
        <Section title="📊 Analytics - Tráfego (GA4)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Usuários Ativos (7d)"
              value={dashboard.analytics.activeUsers.toString()}
              tooltip="Total de usuários únicos que visitaram o site nos últimos 7 dias (dados do Google Analytics 4)"
            />

            <StatCard
              label="Novos Usuários (7d)"
              value={dashboard.analytics.newUsers.toString()}
              tooltip="Usuários visitando pela primeira vez nos últimos 7 dias"
            />

            <StatCard
              label="Sessões (7d)"
              value={dashboard.analytics.sessions.toString()}
              tooltip="Total de sessões/visitas nos últimos 7 dias"
            />

            <StatCard
              label="Pageviews (7d)"
              value={dashboard.analytics.pageViews.toString()}
              tooltip="Total de visualizações de página nos últimos 7 dias"
            />
          </div>
        </Section>
      )}

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

      {/* AÇÕES URGENTES */}
      {urgentActions.length > 0 && (
        <Section title="🚨 Ações Urgentes">
          <div className="space-y-3">
            {urgentActions.map((action) => (
              <Card 
                key={action.id}
                padding="md" 
                className={`border-l-4 ${
                  action.priority === 'critical' ? 'border-red-500 bg-red-50' :
                  action.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                  'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={
                          action.priority === 'critical' ? 'error' :
                          action.priority === 'high' ? 'warning' :
                          'info'
                        }
                      >
                        {action.priority === 'critical' && '🚨 CRÍTICO'}
                        {action.priority === 'high' && '⚠️ ALTA'}
                        {action.priority === 'medium' && 'ℹ️ MÉDIA'}
                      </Badge>
                      <span className="text-sm font-bold text-slate-900">{action.title}</span>
                    </div>
                    
                    <p className="text-xs text-slate-700 mb-2">{action.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-600">Impacto: </span>
                        <span className="font-semibold text-slate-900">{action.impact}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Ação: </span>
                        <span className="font-semibold text-blue-700">{action.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
