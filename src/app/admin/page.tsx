'use client';

/**
 * Torre de Controle - Dashboard Decisório
 * 5 blocos principais: Demanda, Oferta, Core MVP, Financeiro, Confiança
 * 3-source architecture: Firebase (operational) + Stripe (financial) + GA4 (behavioral)
 * Read-only, no writes to production
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, EmptyState, LoadingSkeleton } from '@/components/admin/AdminLayout';
import type { TorreHomeData, DailyMetric } from '@/services/admin/torre/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TorreControleHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [torre, setTorre] = useState<TorreHomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    fetchTorreData();
    fetchDailyMetrics();
    
    const interval = setInterval(() => {
      fetchTorreData();
      fetchDailyMetrics();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [router]);

  const fetchTorreData = async () => {
    try {
      const response = await authFetch('/api/admin/torre-home');
      
      if (response.ok) {
        const data = await response.json();
        setTorre(data);
        setError(null);
      } else {
        setError('Erro ao carregar torre de controle');
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
        setDailyMetrics(data.data || []);
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

  if (error || !torre) {
    return (
      <AdminLayout title="Torre de Controle" subtitle="Erro" icon="🎯">
        <EmptyState
          icon="⚠️"
          title="Erro ao carregar"
          description={error || 'Não foi possível carregar os dados'}
          action="Tentar novamente"
          onAction={fetchTorreData}
        />
      </AdminLayout>
    );
  }

  const { demanda, oferta, coreMVP, financeiro, confianca, urgentActions } = torre;

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
      {/* BLOCO 1: DEMANDA */}
      <Section title="📍 Demanda">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Solicitações Abertas"
            value={demanda.solicitacoesAbertas.total.toString()}
            change={demanda.solicitacoesAbertas.change}
            trend={demanda.solicitacoesAbertas.trend === 'stable' ? 'neutral' : demanda.solicitacoesAbertas.trend}
            icon="📋"
            tooltip="Total de solicitações aguardando correspondência com profissional"
          />

          <StatCard
            label="Tempo Médio de Match"
            value={`${demanda.tempoMedioMatch.hours.toFixed(1)}h`}
            change={demanda.tempoMedioMatch.change}
            trend={demanda.tempoMedioMatch.trend === 'stable' ? 'neutral' : demanda.tempoMedioMatch.trend}
            icon="⏱️"
            tooltip="Tempo médio entre criação da solicitação e match com profissional"
          />

          <StatCard
            label="SLA em Risco (>48h)"
            value={`${demanda.slaRisco.count} (${demanda.slaRisco.percentage.toFixed(1)}%)`}
            icon="🚨"
            tooltip="Solicitações há mais de 48h sem match - risco crítico de cancelamento"
          />
        </div>
      </Section>

      {/* BLOCO 2: OFERTA */}
      <Section title="👥 Oferta">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Profissionais Disponíveis"
            value={oferta.profissionaisDisponiveis.total.toString()}
            change={oferta.profissionaisDisponiveis.change}
            trend={oferta.profissionaisDisponiveis.trend === 'stable' ? 'neutral' : oferta.profissionaisDisponiveis.trend}
            icon="✅"
            tooltip="Profissionais ativos e disponíveis para aceitar solicitações"
          />

          <StatCard
            label="Taxa de Conversão (Aceite)"
            value={`${oferta.taxaConversaoAceite.percentage.toFixed(1)}%`}
            change={oferta.taxaConversaoAceite.change}
            trend={oferta.taxaConversaoAceite.trend === 'stable' ? 'neutral' : oferta.taxaConversaoAceite.trend}
            icon="✔️"
            tooltip="Percentual de solicitações aceitas por profissionais"
          />

          <StatCard
            label="Abandono Pós-Aceite"
            value={`${oferta.abandonoPosAceite.percentage.toFixed(1)}%`}
            icon="⚠️"
            tooltip={`${oferta.abandonoPosAceite.count} profissionais abandonaram após aceitar`}
          />

          <StatCard
            label="Profissionais Inativos (30d)"
            value={`${oferta.profissionaisInativos30d.count} (${oferta.profissionaisInativos30d.percentage.toFixed(1)}%)`}
            icon="💤"
            tooltip="Profissionais sem atividade nos últimos 30 dias"
          />
        </div>
      </Section>

      {/* BLOCO 3: CORE MVP */}
      <Section title="🎯 Núcleo do Negócio">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Atendimentos Concluídos (Mês)"
            value={coreMVP.matchesConcluidos.total.toString()}
            change={coreMVP.matchesConcluidos.change}
            trend={coreMVP.matchesConcluidos.trend === 'stable' ? 'neutral' : coreMVP.matchesConcluidos.trend}
            icon="✅"
            tooltip="Total de atendimentos finalizados com sucesso no mês atual"
          />

          <StatCard
            label="NPS (Índice de Satisfação)"
            value={`${coreMVP.nps.score} - ${coreMVP.nps.category}`}
            change={coreMVP.nps.change}
            icon={
              coreMVP.nps.category === 'excelente' ? '🌟' :
              coreMVP.nps.category === 'bom' ? '😊' :
              coreMVP.nps.category === 'razoavel' ? '😐' : '😞'
            }
            tooltip="Índice de Satisfação dos usuários (-100 a 100)"
          />
        </div>
      </Section>

      {/* BLOCO 4: FINANCEIRO */}
      <Section title="💰 Financeiro">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="GMV do Mês"
            value={formatCurrency(financeiro.gmvMes.value)}
            change={financeiro.gmvMes.change}
            trend={financeiro.gmvMes.trend === 'stable' ? 'neutral' : financeiro.gmvMes.trend}
            icon="💵"
            tooltip="Volume Bruto de Mercadoria - valor total transacionado no mês"
          />

          <StatCard
            label="Receita Líquida (Mês)"
            value={formatCurrency(financeiro.receitaLiquidaMes.value)}
            change={financeiro.receitaLiquidaMes.change}
            trend={financeiro.receitaLiquidaMes.trend === 'stable' ? 'neutral' : financeiro.receitaLiquidaMes.trend}
            icon="💰"
            tooltip="Receita da plataforma (comissão) no mês atual"
          />

          <StatCard
            label="Ticket Médio"
            value={formatCurrency(financeiro.ticketMedio.value)}
            change={financeiro.ticketMedio.change}
            trend={financeiro.ticketMedio.trend === 'stable' ? 'neutral' : financeiro.ticketMedio.trend}
            icon="🎫"
            tooltip="Valor médio por transação"
          />

          <StatCard
            label="Taxa de Cancelamento"
            value={`${financeiro.churnRate.percentage.toFixed(1)}%`}
            icon="📉"
            tooltip={`${financeiro.churnRate.count} cancelamentos no período`}
          />
        </div>
      </Section>

      {/* BLOCO 5: CONFIANÇA */}
      <Section title="🛡️ Confiança">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Tickets Abertos"
            value={confianca.ticketsAbertos.total.toString()}
            icon="🎫"
            tooltip="Total de tickets aguardando resolução"
          />

          <StatCard
            label="Tickets Críticos"
            value={confianca.ticketsAbertos.criticos.toString()}
            icon="🚨"
            tooltip="Tickets de alta prioridade que exigem atenção imediata"
          />

          <StatCard
            label="SLA 24h"
            value={`${confianca.ticketsAbertos.sla24h.toFixed(1)}%`}
            icon={confianca.ticketsAbertos.sla24h >= 80 ? '✅' : '⚠️'}
            tooltip="Percentual de tickets atendidos dentro de 24 horas"
          />
        </div>
      </Section>

      {/* GRÁFICOS DIÁRIOS */}
      {!metricsLoading && dailyMetrics.length > 0 && (
        <Section title="📈 Métricas Diárias (Últimos 30 dias)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Visualizações do Site</h3>
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
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Visualizações"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Cadastros na Plataforma</h3>
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
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="signups" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Cadastros"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
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

      {/* MODULES */}
      <Section title="📱 Módulos Detalhados">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: 'Validação Marketplace', icon: '🔍', path: '/admin/marketplace-validation' },
            { title: 'Famílias', icon: '👨‍👩‍👧', path: '/admin/families' },
            { title: 'Cuidadores', icon: '👥', path: '/admin/caregivers' },
            { title: 'Pipeline', icon: '🎯', path: '/admin/pipeline' },
            { title: 'Financeiro', icon: '💰', path: '/admin/financeiro' },
            { title: 'Confiança & Qualidade', icon: '🛡️', path: '/admin/trust' },
            { title: 'Friction Points', icon: '⚠️', path: '/admin/friction' },
            { title: 'Usuários', icon: '👤', path: '/admin/users' }
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

      {/* STATUS FOOTER */}
      <Card padding="sm" className="bg-slate-50">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Sistema operacional</span>
          </div>
          <span>Última atualização: {new Date(torre.timestamp).toLocaleTimeString('pt-BR')}</span>
        </div>
      </Card>
    </AdminLayout>
  );
}
