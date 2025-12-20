'use client';

/**
 * ═══════════════════════════════════════════════════════
 * TORRE DE CONTROLE - HOMEPAGE
 * ═══════════════════════════════════════════════════════
 * Dashboard principal com 5 cards KPI
 * 
 * Responde em 5 segundos:
 * 1. Como está a demanda? (Famílias)
 * 2. Como está a oferta? (Cuidadores)
 * 3. O core MVP está funcionando? (Marketplace)
 * 4. Estamos ganhando dinheiro? (Financeiro)
 * 5. Os usuários confiam em nós? (Confiança)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { LoadingSkeleton, EmptyState } from '@/components/admin/AdminLayout';
import { Top5Problemas } from '@/components/admin/Top5Problemas';
import { Sparkline, StatusBadge, Comparacao, MetaIndicador } from '@/components/admin/ui/Sparkline';
import type { TorreControleDashboard } from '@/services/admin/torre-controle/types';
import Link from 'next/link';

export default function TorreControleHomepage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<TorreControleDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar autenticação
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
      const response = await authFetch('/api/admin/torre-controle');
      
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
        <LoadingSkeleton lines={5} />
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

  const { demanda, oferta, coreMvp, financeiro, confianca } = dashboard;

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper para cor de trend
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-slate-600';
  };

  // Helper para ícone de trend
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <AdminLayout 
      title="Torre de Controle" 
      subtitle="Dashboard Executivo - Cuide.me" 
      icon="🎯"
    >
      {/* TOP 5 PROBLEMAS - Quick Win #3 */}
      {dashboard.top5Problemas && dashboard.top5Problemas.length > 0 && (
        <div className="mb-6">
          <Top5Problemas problemas={dashboard.top5Problemas} />
        </div>
      )}

      {/* GRID PRINCIPAL - 5 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* CARD 1: DEMANDA (Famílias) */}
        <Link href="/admin/familias" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">DEMANDA</h3>
              <div className="flex items-center gap-2">
                {demanda.status && <StatusBadge status={demanda.status} />}
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-3xl font-bold text-slate-900">{demanda.totalFamilias}</div>
                <div className="text-xs text-slate-500">Famílias Ativas</div>
                {demanda.historico && (
                  <div className="mt-2">
                    <Sparkline data={demanda.historico} width={120} height={30} color="#10b981" />
                  </div>
                )}
              </div>
              
              {demanda.metas && (
                <MetaIndicador 
                  atual={demanda.totalFamilias}
                  meta={demanda.metas.totalFamilias}
                  label="Meta"
                  formato="numero"
                />
              )}
              
              {demanda.comparacao && (
                <Comparacao 
                  atual={demanda.totalFamilias}
                  anterior={demanda.comparacao.mesAnterior.totalFamilias}
                  variacao={demanda.comparacao.mesAnterior.variacao}
                />
              )}
              
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-600">Novas (30d)</span>
                <span className={`font-semibold ${getTrendColor(demanda.trend)}`}>
                  {demanda.novasFamilias30d} {getTrendIcon(demanda.trend)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Taxa Conversão</span>
                <span className="font-semibold text-slate-900">{demanda.taxaConversao}%</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tempo 1º Job</span>
                <span className="font-semibold text-slate-900">{demanda.tempoMedioPrimeiroJob}h</span>
              </div>
            </div>
          </div>
        </Link>

        {/* CARD 2: OFERTA (Cuidadores) */}
        <Link href="/admin/cuidadores" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">OFERTA</h3>
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-3xl font-bold text-slate-900">{oferta.totalCuidadores}</div>
                <div className="text-xs text-slate-500">Cuidadores Ativos</div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Novos (30d)</span>
                <span className={`font-semibold ${getTrendColor(oferta.trend)}`}>
                  {oferta.novosCuidadores30d} {getTrendIcon(oferta.trend)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Taxa Ativação</span>
                <span className="font-semibold text-slate-900">{oferta.taxaAtivacao}%</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Disponibilidade</span>
                <span className="font-semibold text-slate-900">{oferta.disponibilidadeMedia}%</span>
              </div>
            </div>
          </div>
        </Link>

        {/* CARD 3: CORE MVP (Marketplace) */}
        <Link href="/admin/marketplace" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">CORE MVP</h3>
              <span className="text-2xl">🎯</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-3xl font-bold text-slate-900">{coreMvp.jobsAtivos}</div>
                <div className="text-xs text-slate-500">Jobs Ativos</div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Taxa Match</span>
                <span className={`font-semibold ${getTrendColor(coreMvp.trend)}`}>
                  {coreMvp.taxaMatch}% {getTrendIcon(coreMvp.trend)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tempo Match</span>
                <span className="font-semibold text-slate-900">{coreMvp.tempoMedioMatch}h</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Conversão</span>
                <span className="font-semibold text-slate-900">{coreMvp.taxaConversao}%</span>
              </div>
            </div>
          </div>
        </Link>

        {/* CARD 4: FINANCEIRO */}
        <Link href="/admin/financeiro" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">FINANCEIRO</h3>
              <span className="text-2xl">💰</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-3xl font-bold text-slate-900">{formatCurrency(financeiro.gmv)}</div>
                <div className="text-xs text-slate-500">GMV (30d)</div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Receita</span>
                <span className={`font-semibold ${getTrendColor(financeiro.trend)}`}>
                  {formatCurrency(financeiro.receita)} {getTrendIcon(financeiro.trend)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Ticket Médio</span>
                <span className="font-semibold text-slate-900">{formatCurrency(financeiro.ticketMedio)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Conversão</span>
                <span className="font-semibold text-slate-900">{financeiro.taxaConversao}%</span>
              </div>
            </div>
          </div>
        </Link>

        {/* CARD 5: CONFIANÇA */}
        <Link href="/admin/confianca" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-600">CONFIANÇA</h3>
              <span className="text-2xl">⭐</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-3xl font-bold text-slate-900">{confianca.ratingMedio.toFixed(1)}</div>
                <div className="text-xs text-slate-500">Rating Médio (5.0)</div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tickets Abertos</span>
                <span className={`font-semibold ${confianca.ticketsAbertos > 10 ? 'text-red-600' : 'text-slate-900'}`}>
                  {confianca.ticketsAbertos}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Alertas Críticos</span>
                <span className={`font-semibold ${confianca.alertasCriticos > 5 ? 'text-red-600' : 'text-slate-900'}`}>
                  {confianca.alertasCriticos}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">NPS</span>
                <span className="font-semibold text-slate-900">
                  {confianca.nps !== null ? confianca.nps : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-6 text-center text-xs text-slate-500">
        Última atualização: {new Date(dashboard.timestamp).toLocaleString('pt-BR')}
      </div>
    </AdminLayout>
  );
}
