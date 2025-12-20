/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA: DASHBOARD EXECUTIVO
 * ═══════════════════════════════════════════════════════
 * Dashboard C-Level com GMV, Unit Economics, Growth, Financial Health
 * Fase 7 - Sprint 1-2
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/client/authFetch';
import { Card } from '@/components/admin/ui';
import { Sparkline, StatusBadge, MetaIndicador } from '@/components/admin/ui/Sparkline';
import type { ExecutiveDashboard } from '@/services/admin/executivo/types';

export default function ExecutivoDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ExecutiveDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await authFetch('/api/admin/executivo');
      
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
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-400">❌ {error || 'Erro ao carregar'}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { gmv, unitEconomics, growth, financialHealth, insights, healthScore } = dashboard;

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper para cor de insight
  const getInsightColor = (tipo: string) => {
    const colors = {
      positivo: 'border-green-500/30 bg-green-500/10',
      neutro: 'border-blue-500/30 bg-blue-500/10',
      atencao: 'border-yellow-500/30 bg-yellow-500/10',
      critico: 'border-red-500/30 bg-red-500/10',
    };
    return colors[tipo as keyof typeof colors] || colors.neutro;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎯 Dashboard Executivo</h1>
            <p className="text-slate-400 mt-1">Visão C-Level • CEO • CFO • COO</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Health Score</div>
            <div className="text-4xl font-bold">
              <span className={
                healthScore >= 80 ? 'text-green-400' :
                healthScore >= 60 ? 'text-blue-400' :
                healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'
              }>
                {healthScore}
              </span>
              <span className="text-slate-600">/100</span>
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        {insights && insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getInsightColor(insight.tipo)}`}
              >
                <h4 className="font-semibold text-sm mb-1">{insight.titulo}</h4>
                <p className="text-xs text-slate-300">{insight.descricao}</p>
              </div>
            ))}
          </div>
        )}

        {/* GRID PRINCIPAL - 4 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARD 1: GMV */}
          <Card title="GMV" subtitle="Gross Merchandise Value">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{formatCurrency(gmv.atual)}</div>
                  <StatusBadge status={gmv.status} />
                </div>
                <div className="text-sm text-slate-400">Meta: {formatCurrency(gmv.meta)}</div>
              </div>

              <MetaIndicador
                atual={gmv.atual}
                meta={gmv.meta}
                label="Meta Mensal"
                formato="moeda"
              />

              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Crescimento MoM</span>
                  <span className={`font-semibold ${
                    gmv.momGrowth >= 15 ? 'text-green-400' :
                    gmv.momGrowth >= 10 ? 'text-blue-400' :
                    gmv.momGrowth >= 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {gmv.momGrowth >= 0 ? '+' : ''}{gmv.momGrowth}%
                  </span>
                </div>
              </div>

              {gmv.historico12M && gmv.historico12M.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">Últimos 12 meses</div>
                  <Sparkline
                    data={gmv.historico12M}
                    width={200}
                    height={40}
                    color="#10b981"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* CARD 2: UNIT ECONOMICS */}
          <Card title="Unit Economics" subtitle="LTV, CAC, Payback">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{unitEconomics.ltvCacRatio.toFixed(1)}x</div>
                  <StatusBadge status={unitEconomics.status} />
                </div>
                <div className="text-sm text-slate-400">LTV:CAC Ratio</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">LTV</span>
                  <span className="font-semibold">{formatCurrency(unitEconomics.ltv)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">CAC</span>
                  <span className="font-semibold">{formatCurrency(unitEconomics.cac)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Payback</span>
                  <span className={`font-semibold ${
                    unitEconomics.paybackMonths <= 9 ? 'text-green-400' :
                    unitEconomics.paybackMonths <= 12 ? 'text-blue-400' :
                    'text-yellow-400'
                  }`}>
                    {unitEconomics.paybackMonths.toFixed(1)} meses
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Margem</span>
                  <span className="font-semibold">{unitEconomics.contributionMargin.toFixed(1)}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 text-xs text-slate-500">
                <div>Benchmark: LTV:CAC &gt; 3.0x</div>
                <div>Payback ideal: &lt; 12 meses</div>
              </div>
            </div>
          </Card>

          {/* CARD 3: GROWTH */}
          <Card title="Crescimento MoM" subtitle="Month-over-Month">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {((growth.familiasAtivas.momGrowth + growth.cuidadoresAtivos.momGrowth + 
                       growth.jobsCompletados.momGrowth + growth.revenueGrowth.momGrowth) / 4).toFixed(1)}%
                  </div>
                  <StatusBadge status={growth.status} />
                </div>
                <div className="text-sm text-slate-400">Média Geral</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Famílias</span>
                  <span className={`font-semibold ${
                    growth.familiasAtivas.momGrowth >= growth.familiasAtivas.meta ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    +{growth.familiasAtivas.momGrowth}% 
                    <span className="text-slate-600 text-xs ml-1">(meta: {growth.familiasAtivas.meta}%)</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Cuidadores</span>
                  <span className={`font-semibold ${
                    growth.cuidadoresAtivos.momGrowth >= growth.cuidadoresAtivos.meta ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    +{growth.cuidadoresAtivos.momGrowth}%
                    <span className="text-slate-600 text-xs ml-1">(meta: {growth.cuidadoresAtivos.meta}%)</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Jobs</span>
                  <span className={`font-semibold ${
                    growth.jobsCompletados.momGrowth >= growth.jobsCompletados.meta ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    +{growth.jobsCompletados.momGrowth}%
                    <span className="text-slate-600 text-xs ml-1">(meta: {growth.jobsCompletados.meta}%)</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Receita</span>
                  <span className={`font-semibold ${
                    growth.revenueGrowth.momGrowth >= growth.revenueGrowth.meta ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    +{growth.revenueGrowth.momGrowth}%
                    <span className="text-slate-600 text-xs ml-1">(meta: {growth.revenueGrowth.meta}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* CARD 4: FINANCIAL HEALTH */}
          <Card title="Saúde Financeira" subtitle="ARR, MRR, Runway">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{financialHealth.runway.toFixed(0)}m</div>
                  <StatusBadge status={financialHealth.status} />
                </div>
                <div className="text-sm text-slate-400">Meses de Runway</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">ARR</span>
                  <span className="font-semibold">{formatCurrency(financialHealth.arr)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">MRR</span>
                  <span className="font-semibold">{formatCurrency(financialHealth.mrr)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Burn Rate</span>
                  <span className="font-semibold text-red-400">-{formatCurrency(financialHealth.burnRate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Churn</span>
                  <span className={`font-semibold ${
                    financialHealth.churnRate <= 3 ? 'text-green-400' :
                    financialHealth.churnRate <= 5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {financialHealth.churnRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {financialHealth.breakEvenDate && (
                <div className="pt-4 border-t border-slate-700 text-xs">
                  <div className="text-slate-500">Break-even previsto</div>
                  <div className="font-semibold text-blue-400">{financialHealth.breakEvenDate}</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* BREAKDOWN DETALHADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LTV por Segmento */}
          {unitEconomics.breakdown?.ltvPorSegmento && unitEconomics.breakdown.ltvPorSegmento.length > 0 && (
            <Card title="LTV por Segmento" subtitle="Análise de valor por tipo de cliente">
              <div className="space-y-3">
                {unitEconomics.breakdown.ltvPorSegmento.map((seg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                    <div>
                      <div className="font-semibold text-sm">{seg.segmento}</div>
                      <div className="text-xs text-slate-400">{seg.count} clientes</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(seg.ltv)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CAC por Canal */}
          {unitEconomics.breakdown?.cacPorCanal && unitEconomics.breakdown.cacPorCanal.length > 0 && (
            <Card title="CAC por Canal" subtitle="Custo de aquisição por fonte">
              <div className="space-y-3">
                {unitEconomics.breakdown.cacPorCanal.map((canal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded">
                    <div>
                      <div className="font-semibold text-sm">{canal.canal}</div>
                      <div className="text-xs text-slate-400">{canal.volume} conversões</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(canal.cac)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-500">
          Última atualização: {new Date(dashboard.timestamp).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
