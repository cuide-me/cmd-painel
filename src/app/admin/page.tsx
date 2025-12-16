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

export default function TorreControleV2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ControlTowerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se está logado
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    fetchDashboard();
    
    // Auto-refresh a cada 60 segundos
    const interval = setInterval(fetchDashboard, 60000);
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
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700">Receita do Mês</span>
                {businessHealth.monthRevenue.isMock && (
                  <span className="text-xs py-0 px-1 bg-yellow-100 text-yellow-700 rounded font-medium">SIMULADO</span>
                )}
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(businessHealth.monthRevenue.current)}
              </div>
              <div className={`text-xs font-medium ${getTrendColor(businessHealth.monthRevenue.trend)}`}>
                {getTrendIcon(businessHealth.monthRevenue.trend)} {businessHealth.monthRevenue.percentChange > 0 ? '+' : ''}
                {businessHealth.monthRevenue.percentChange.toFixed(1)}% vs mês anterior
              </div>
            </div>
          </Card>

          {/* 2. Burn Rate */}
          <Card padding="md" className={`border-2 ${
            businessHealth.burnRate.status === 'profit' ? 'bg-green-50 border-green-300' :
            businessHealth.burnRate.status === 'burning' ? 'bg-red-50 border-red-300' :
            'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Burn Rate Mensal</span>
                {businessHealth.burnRate.isMock && (
                  <span className="text-xs py-0 px-1 bg-yellow-100 text-yellow-700 rounded font-medium">SIMULADO</span>
                )}
              </div>
              <div className={`text-2xl font-bold ${
                businessHealth.burnRate.status === 'profit' ? 'text-green-700' :
                businessHealth.burnRate.status === 'burning' ? 'text-red-700' :
                'text-yellow-700'
              }`}>
                {formatCurrency(Math.abs(businessHealth.burnRate.netBurn))}
              </div>
              <div className="text-xs font-medium text-slate-700">
                {businessHealth.burnRate.status === 'profit' ? '✅ Lucrando' :
                 businessHealth.burnRate.status === 'burning' ? '⚠️ Queimando caixa' :
                 '→ Neutro'}
              </div>
            </div>
          </Card>

          {/* 3. Runway */}
          <Card padding="md" className={`border-2 ${
            businessHealth.runway.status === 'healthy' ? 'bg-green-50 border-green-300' :
            businessHealth.runway.status === 'warning' ? 'bg-yellow-50 border-yellow-300' :
            'bg-red-50 border-red-300'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Runway</span>
                {businessHealth.runway.isMock && (
                  <span className="text-xs py-0 px-1 bg-yellow-100 text-yellow-700 rounded font-medium">SIMULADO</span>
                )}
              </div>
              <div className={`text-2xl font-bold ${
                businessHealth.runway.status === 'healthy' ? 'text-green-700' :
                businessHealth.runway.status === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {businessHealth.runway.months === 999 ? '∞' : `${businessHealth.runway.months}m`}
              </div>
              <div className="text-xs font-medium text-slate-700">
                {businessHealth.runway.status === 'healthy' && '🟢 Saudável'}
                {businessHealth.runway.status === 'warning' && '🟡 Atenção'}
                {businessHealth.runway.status === 'critical' && '🔴 Crítico'}
              </div>
            </div>
          </Card>

          {/* 4. MRR em Risco */}
          <Card padding="md" className={`border-2 ${
            businessHealth.mrrAtRisk.percentage > 15 ? 'bg-red-50 border-red-300' :
            businessHealth.mrrAtRisk.percentage > 5 ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700">MRR em Risco</span>
              <div className={`text-2xl font-bold ${
                businessHealth.mrrAtRisk.percentage > 15 ? 'text-red-700' :
                businessHealth.mrrAtRisk.percentage > 5 ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {formatCurrency(businessHealth.mrrAtRisk.amount)}
              </div>
              <div className="text-xs font-medium text-slate-700">
                {businessHealth.mrrAtRisk.percentage.toFixed(1)}% do MRR total
              </div>
            </div>
          </Card>

          {/* 5. Saúde do Sistema */}
          <Card padding="md" className={`border-2 ${
            businessHealth.systemHealth.status === 'healthy' ? 'bg-green-50 border-green-300' :
            businessHealth.systemHealth.status === 'warning' ? 'bg-yellow-50 border-yellow-300' :
            'bg-red-50 border-red-300'
          }`}>
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-700">Saúde do Sistema</span>
              <div className={`text-2xl font-bold ${
                businessHealth.systemHealth.status === 'healthy' ? 'text-green-700' :
                businessHealth.systemHealth.status === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {businessHealth.systemHealth.score}/100
              </div>
              <div className="text-xs font-medium text-slate-700">
                {businessHealth.systemHealth.status === 'healthy' && '✅ Operacional'}
                {businessHealth.systemHealth.status === 'warning' && '⚠️ Com alertas'}
                {businessHealth.systemHealth.status === 'critical' && '🚨 Crítico'}
              </div>
            </div>
          </Card>
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
          {/* 6. Solicitações por SLA */}
          <Card padding="md">
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900">Solicitações Abertas</span>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-green-50">
                  <span className="text-xs font-medium text-green-700">{'< 24h'}</span>
                  <span className="text-lg font-bold text-green-700">
                    {operations.requestsBySLA.underTwentyFour.count}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-yellow-50">
                  <span className="text-xs font-medium text-yellow-700">24-48h</span>
                  <span className="text-lg font-bold text-yellow-700">
                    {operations.requestsBySLA.twentyFourToFortyEight.count}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-red-50 border-2 border-red-300">
                  <span className="text-xs font-medium text-red-700">{'> 48h (CRÍTICO)'}</span>
                  <span className="text-lg font-bold text-red-700">
                    {operations.requestsBySLA.overFortyEight.count}
                  </span>
                </div>
              </div>

              {operations.requestsBySLA.overFortyEight.count > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Ação urgente necessária
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 7. Tempo Médio até Match */}
          <Card padding="md">
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900">Tempo Médio até Match</span>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  operations.averageTimeToMatch.status === 'good' ? 'text-green-600' :
                  operations.averageTimeToMatch.status === 'acceptable' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {operations.averageTimeToMatch.hours.toFixed(1)}h
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Meta: {operations.averageTimeToMatch.target}h
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs">
                <span className={`font-medium ${getTrendColor(operations.averageTimeToMatch.trend)}`}>
                  {getTrendIcon(operations.averageTimeToMatch.trend)}
                  {operations.averageTimeToMatch.trend === 'improving' && ' Melhorando'}
                  {operations.averageTimeToMatch.trend === 'stable' && ' Estável'}
                  {operations.averageTimeToMatch.trend === 'worsening' && ' Piorando'}
                </span>
              </div>

              {/* Mini-gráfico dos últimos 7 dias */}
              <div className="flex items-end justify-between h-12 gap-1 pt-2 border-t border-slate-200">
                {operations.averageTimeToMatch.last7Days.map((value, i) => {
                  const maxValue = Math.max(...operations.averageTimeToMatch.last7Days);
                  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div 
                        className={`w-full rounded-t ${
                          value <= operations.averageTimeToMatch.target ? 'bg-green-300' :
                          value <= operations.averageTimeToMatch.target * 2 ? 'bg-yellow-300' :
                          'bg-red-300'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* 8. Funil de Conversão */}
          <Card padding="md">
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900">Funil de Conversão</span>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">Solicitações Criadas</span>
                    <span className="font-bold text-slate-900">{operations.conversionFunnel.created.count}</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full"></div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">Match Realizado</span>
                    <span className="font-bold text-slate-900">
                      {operations.conversionFunnel.matched.count} ({operations.conversionFunnel.matched.conversionRate.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full">
                    <div 
                      className="h-2 bg-green-400 rounded-full" 
                      style={{ width: `${operations.conversionFunnel.matched.percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">Pagamento Concluído</span>
                    <span className="font-bold text-slate-900">
                      {operations.conversionFunnel.paid.count} ({operations.conversionFunnel.paid.conversionRate.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ width: `${operations.conversionFunnel.paid.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                Dropoffs: {operations.conversionFunnel.dropoffs.createdToMatched} criação→match, {operations.conversionFunnel.dropoffs.matchedToPaid} match→pago
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* BLOCO 3: SAÚDE DO MARKETPLACE */}
      <Section title="🎯 Saúde do Marketplace">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 9. Profissionais Disponíveis */}
          <Card padding="md">
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900">Profissionais Disponíveis AGORA</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {marketplace.availableProfessionals.count}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    disponíveis para atender
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-700">
                    {marketplace.availableProfessionals.openDemand}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    solicitações abertas
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-lg text-center ${
                marketplace.availableProfessionals.balance === 'surplus' ? 'bg-green-100 text-green-700' :
                marketplace.availableProfessionals.balance === 'balanced' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                <div className="text-lg font-bold">
                  {marketplace.availableProfessionals.balance === 'surplus' && '✅ Superávit'}
                  {marketplace.availableProfessionals.balance === 'balanced' && '⚖️ Balanceado'}
                  {marketplace.availableProfessionals.balance === 'deficit' && '⚠️ Déficit'}
                </div>
                <div className="text-xs mt-1">
                  Ratio: {marketplace.availableProfessionals.ratio.toFixed(2)} profissionais/demanda
                </div>
              </div>
            </div>
          </Card>

          {/* 10. Abandono Pós-Aceite */}
          <Card padding="md">
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900">Abandono Pós-Aceite</span>
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  marketplace.postAcceptAbandonment.status === 'ok' ? 'text-green-600' :
                  marketplace.postAcceptAbandonment.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {marketplace.postAcceptAbandonment.rate.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Limite aceitável: {marketplace.postAcceptAbandonment.acceptableLimit}%
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs">
                <span className={`font-medium ${getTrendColor(marketplace.postAcceptAbandonment.trend)}`}>
                  {getTrendIcon(marketplace.postAcceptAbandonment.trend)}
                  {marketplace.postAcceptAbandonment.trend === 'improving' && ' Melhorando'}
                  {marketplace.postAcceptAbandonment.trend === 'stable' && ' Estável'}
                  {marketplace.postAcceptAbandonment.trend === 'worsening' && ' Piorando'}
                </span>
              </div>

              <div className={`p-3 rounded-lg text-center text-sm ${
                marketplace.postAcceptAbandonment.status === 'ok' ? 'bg-green-50 text-green-700' :
                marketplace.postAcceptAbandonment.status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                'bg-red-50 text-red-700'
              }`}>
                {marketplace.postAcceptAbandonment.count} abandonos nos últimos 30 dias
              </div>
            </div>
          </Card>
        </div>
      </Section>

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
