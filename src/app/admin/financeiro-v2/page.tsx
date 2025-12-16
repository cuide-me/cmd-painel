'use client';

/**
 * Financeiro V2 - Advanced Revenue Analytics Dashboard
 * MRR/ARR tracking, LTV, Forecasting, Cohort Analysis
 */

import { useState, useEffect } from 'react';
import { FinanceiroDashboard } from '@/services/admin/financeiro-v2/types';

export default function FinanceiroV2Page() {
  const [dashboard, setDashboard] = useState<FinanceiroDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [dateRange, setDateRange] = useState('30');
  const [segment, setSegment] = useState('all');
  const [selectedView, setSelectedView] = useState<'overview' | 'mrr' | 'ltv' | 'churn' | 'forecast'>('overview');
  
  useEffect(() => {
    fetchDashboard();
  }, [dateRange, segment]);
  
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (segment !== 'all') params.append('segment', segment);
      
      const response = await fetch(`/api/admin/financeiro-v2?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar dados');
      }
      
      setDashboard(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-white rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 font-medium">Erro ao carregar dashboard</p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <button
              onClick={fetchDashboard}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financeiro 2.0</h1>
            <p className="text-slate-600 mt-1">Revenue Analytics & Forecasting</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Filters */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
            
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <option value="all">Todos</option>
              <option value="professional">Profissionais</option>
              <option value="family">Famílias</option>
              <option value="enterprise">Enterprise</option>
            </select>
            
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Atualizar
            </button>
          </div>
        </div>
        
        {/* Health Score & Key Metrics */}
        <div className="grid grid-cols-4 gap-6">
          <MetricCard
            label="MRR"
            value={formatCurrency(dashboard.summary.mrr)}
            change={dashboard.summary.mrrGrowthRate}
            trend={dashboard.summary.mrrGrowthRate > 0 ? 'up' : 'down'}
          />
          <MetricCard
            label="ARR"
            value={formatCurrency(dashboard.summary.arr)}
            change={dashboard.arr.arrGrowthRate}
            trend={dashboard.arr.arrGrowthRate > 0 ? 'up' : 'down'}
          />
          <MetricCard
            label="ARPU"
            value={formatCurrency(dashboard.summary.arpu)}
            subtitle={`${dashboard.summary.customerCount} clientes`}
          />
          <HealthScoreCard score={dashboard.summary.healthScore} />
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'mrr', label: 'MRR Analysis', icon: '💰' },
              { id: 'ltv', label: 'LTV & CAC', icon: '📈' },
              { id: 'churn', label: 'Churn', icon: '⚠️' },
              { id: 'forecast', label: 'Forecast', icon: '🔮' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedView === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        {selectedView === 'overview' && <OverviewSection dashboard={dashboard} />}
        {selectedView === 'mrr' && <MRRSection dashboard={dashboard} />}
        {selectedView === 'ltv' && <LTVSection dashboard={dashboard} />}
        {selectedView === 'churn' && <ChurnSection dashboard={dashboard} />}
        {selectedView === 'forecast' && <ForecastSection dashboard={dashboard} />}
        
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW SECTION
// ═══════════════════════════════════════════════════════════════

function OverviewSection({ dashboard }: { dashboard: FinanceiroDashboard }) {
  return (
    <div className="space-y-6">
      
      {/* Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🎯 Insights & Recomendações</h2>
        <div className="space-y-3">
          {dashboard.insights.slice(0, 5).map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Quick Ratio */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Quick Ratio</div>
          <div className="text-4xl font-bold mb-2">{dashboard.mrr.quickRatio.toFixed(1)}</div>
          <div className="text-sm opacity-80">Target: &gt;4.0</div>
          <div className="mt-4 text-xs">
            Eficiência: {dashboard.mrr.quickRatio > 4 ? 'Excelente 🎯' : dashboard.mrr.quickRatio > 2 ? 'Boa ✅' : 'Precisa melhorar ⚠️'}
          </div>
        </div>
        
        {/* NRR */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Net Revenue Retention</div>
          <div className="text-4xl font-bold mb-2">{dashboard.mrr.netRevenueRetention.toFixed(0)}%</div>
          <div className="text-sm opacity-80">Target: &gt;100%</div>
          <div className="mt-4 text-xs">
            {dashboard.mrr.netRevenueRetention > 110 ? 'Excepcional 🚀' : dashboard.mrr.netRevenueRetention > 100 ? 'Muito bom ✨' : 'Atenção ⚠️'}
          </div>
        </div>
        
        {/* Rule of 40 */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Rule of 40</div>
          <div className="text-4xl font-bold mb-2">{dashboard.arr.ruleOf40Score.toFixed(0)}</div>
          <div className="text-sm opacity-80">Target: &gt;40</div>
          <div className="mt-4 text-xs">
            Growth: {dashboard.arr.growthRate.toFixed(1)}% + Margin: {dashboard.arr.profitMargin.toFixed(1)}%
          </div>
        </div>
        
      </div>
      
      {/* MRR Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">MRR Trend (12 meses)</h3>
        <TrendChart data={dashboard.trends} />
      </div>
      
      {/* Unit Economics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Unit Economics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">LTV</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(dashboard.unitEconomics.ltv)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">CAC</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(dashboard.unitEconomics.cac)}</span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">LTV:CAC Ratio</span>
                <span className={`text-2xl font-bold ${
                  dashboard.unitEconomics.ltvCacRatio > 3 ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {dashboard.unitEconomics.ltvCacRatio.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Payback: {dashboard.unitEconomics.paybackPeriod.toFixed(1)} meses
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Magic Number</h3>
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900 mb-2">
              {dashboard.unitEconomics.magicNumber.toFixed(2)}
            </div>
            <div className="text-slate-600 text-sm mb-4">
              Eficiência de S&M Spend
            </div>
            <div className="text-xs text-slate-500">
              {dashboard.unitEconomics.magicNumber > 0.75 ? 
                '✅ Excelente eficiência' : 
                dashboard.unitEconomics.magicNumber > 0.5 ? 
                  '⚠️ Boa, mas pode melhorar' : 
                  '🔴 Revisar estratégia'}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MRR SECTION
// ═══════════════════════════════════════════════════════════════

function MRRSection({ dashboard }: { dashboard: FinanceiroDashboard }) {
  return (
    <div className="space-y-6">
      
      {/* MRR Movement */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">MRR Movement Analysis</h2>
        
        <div className="grid grid-cols-5 gap-4">
          <MovementCard
            label="New MRR"
            value={dashboard.mrr.newMRR}
            color="emerald"
            icon="➕"
          />
          <MovementCard
            label="Expansion"
            value={dashboard.mrr.expansionMRR}
            color="blue"
            icon="📈"
          />
          <MovementCard
            label="Contraction"
            value={dashboard.mrr.contractionMRR}
            color="amber"
            icon="📉"
          />
          <MovementCard
            label="Churned"
            value={dashboard.mrr.churnedMRR}
            color="red"
            icon="❌"
          />
          <MovementCard
            label="Net New"
            value={dashboard.mrr.netNewMRR}
            color="purple"
            icon="💎"
          />
        </div>
        
        {/* Waterfall visual */}
        <div className="mt-6">
          <MRRWaterfall mrr={dashboard.mrr} />
        </div>
      </div>
      
      {/* By Plan */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">MRR por Plano</h2>
        <div className="space-y-3">
          {dashboard.mrr.byPlan.map((plan, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900">{plan.planName}</div>
                <div className="text-sm text-slate-600">{plan.customers} clientes · ARPU: {formatCurrency(plan.arpu)}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">{formatCurrency(plan.mrr)}</div>
                <div className={`text-sm font-medium ${plan.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {plan.growth > 0 ? '+' : ''}{plan.growth.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* By Customer Type */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">MRR por Tipo de Cliente</h2>
        <div className="space-y-3">
          {dashboard.mrr.byCustomerType.map((type, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-slate-700 capitalize">{type.type}</span>
                  <span className="text-sm text-slate-600">{type.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{formatCurrency(type.mrr)}</div>
                <div className={`text-xs ${type.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {type.growth > 0 ? '+' : ''}{type.growth.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LTV SECTION
// ═══════════════════════════════════════════════════════════════

function LTVSection({ dashboard }: { dashboard: FinanceiroDashboard }) {
  return (
    <div className="space-y-6">
      
      {/* LTV Overview */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90 mb-2">Average LTV</div>
          <div className="text-4xl font-bold mb-4">{formatCurrency(dashboard.ltv.averageLTV)}</div>
          <div className="text-sm opacity-80">Median: {formatCurrency(dashboard.ltv.medianLTV)}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-4">LTV:CAC por Segmento</h3>
          <div className="space-y-3">
            {dashboard.ltv.bySegment.slice(0, 3).map((seg, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-slate-700 capitalize">{seg.segment}</span>
                <span className={`font-bold ${seg.ltvCacRatio > 3 ? 'text-green-600' : 'text-amber-600'}`}>
                  {seg.ltvCacRatio.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* By Segment Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">LTV por Segmento</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="pb-3 text-sm font-semibold text-slate-600">Segmento</th>
                <th className="pb-3 text-sm font-semibold text-slate-600">LTV</th>
                <th className="pb-3 text-sm font-semibold text-slate-600">CAC</th>
                <th className="pb-3 text-sm font-semibold text-slate-600">Ratio</th>
                <th className="pb-3 text-sm font-semibold text-slate-600">Payback</th>
                <th className="pb-3 text-sm font-semibold text-slate-600">Churn%</th>
                <th className="pb-3 text-sm font-semibold text-slate-600">Confiança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.ltv.bySegment.map((seg, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 capitalize font-medium text-slate-900">{seg.segment}</td>
                  <td className="py-3 text-slate-700">{formatCurrency(seg.ltv)}</td>
                  <td className="py-3 text-slate-700">{formatCurrency(seg.cac)}</td>
                  <td className={`py-3 font-bold ${seg.ltvCacRatio > 3 ? 'text-green-600' : 'text-amber-600'}`}>
                    {seg.ltvCacRatio.toFixed(1)}
                  </td>
                  <td className="py-3 text-slate-700">{seg.paybackPeriod.toFixed(0)} m</td>
                  <td className="py-3 text-slate-700">{seg.churnRate.toFixed(1)}%</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      seg.confidence > 80 ? 'bg-green-100 text-green-700' :
                      seg.confidence > 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {seg.confidence.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Cohort LTV */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">LTV por Cohort</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="pb-3 font-semibold text-slate-600">Cohort</th>
                <th className="pb-3 font-semibold text-slate-600">Size</th>
                <th className="pb-3 font-semibold text-slate-600">M1</th>
                <th className="pb-3 font-semibold text-slate-600">M3</th>
                <th className="pb-3 font-semibold text-slate-600">M6</th>
                <th className="pb-3 font-semibold text-slate-600">M12</th>
                <th className="pb-3 font-semibold text-slate-600">Projected</th>
                <th className="pb-3 font-semibold text-slate-600">Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.ltv.cohorts.slice(0, 6).map((cohort, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 font-medium text-slate-900">{cohort.cohort}</td>
                  <td className="py-2 text-slate-700">{cohort.size}</td>
                  <td className="py-2 text-slate-700">{formatCurrency(cohort.ltv1Month)}</td>
                  <td className="py-2 text-slate-700">{formatCurrency(cohort.ltv3Months)}</td>
                  <td className="py-2 text-slate-700">{formatCurrency(cohort.ltv6Months)}</td>
                  <td className="py-2 text-slate-700">{formatCurrency(cohort.ltv12Months)}</td>
                  <td className="py-2 font-bold text-slate-900">{formatCurrency(cohort.projectedLifetimeLTV)}</td>
                  <td className="py-2">
                    <span className={`font-medium ${
                      cohort.retentionRate > 80 ? 'text-green-600' :
                      cohort.retentionRate > 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {cohort.retentionRate.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHURN SECTION
// ═══════════════════════════════════════════════════════════════

function ChurnSection({ dashboard }: { dashboard: FinanceiroDashboard }) {
  return (
    <div className="space-y-6">
      
      {/* Churn Rates */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Gross Revenue Churn</div>
          <div className={`text-3xl font-bold mb-2 ${
            dashboard.churn.grossRevenueChurnRate < 5 ? 'text-green-600' : 'text-red-600'
          }`}>
            {dashboard.churn.grossRevenueChurnRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Target: &lt;5%</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Net Revenue Churn</div>
          <div className={`text-3xl font-bold mb-2 ${
            dashboard.churn.netRevenueChurnRate < 0 ? 'text-green-600' : 'text-amber-600'
          }`}>
            {dashboard.churn.netRevenueChurnRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Negativo é bom!</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm text-slate-600 mb-2">Customer Churn</div>
          <div className={`text-3xl font-bold mb-2 ${
            dashboard.churn.customerChurnRate < 5 ? 'text-green-600' : 'text-red-600'
          }`}>
            {dashboard.churn.customerChurnRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Target: &lt;5%</div>
        </div>
      </div>
      
      {/* Voluntary vs Involuntary */}
      <div className="grid grid-cols-2 gap-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Voluntary Churn</h3>
          <div className="mb-4">
            <div className="text-2xl font-bold text-slate-900">{dashboard.churn.voluntaryChurn.customers} clientes</div>
            <div className="text-sm text-slate-600">{formatCurrency(dashboard.churn.voluntaryChurn.mrr)} MRR</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700 mb-2">Top Motivos:</div>
            {dashboard.churn.voluntaryChurn.topReasons.map((reason, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{reason.reason}</span>
                <span className="font-medium text-slate-900">{reason.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Involuntary Churn</h3>
          <div className="mb-4">
            <div className="text-2xl font-bold text-slate-900">{dashboard.churn.involuntaryChurn.customers} clientes</div>
            <div className="text-sm text-slate-600">{formatCurrency(dashboard.churn.involuntaryChurn.mrr)} MRR</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm font-medium text-amber-900 mb-1">Recuperáveis</div>
            <div className="text-2xl font-bold text-amber-700">{dashboard.churn.involuntaryChurn.recoverable}</div>
            <div className="text-xs text-amber-600 mt-2">
              Implementar dunning automático
            </div>
          </div>
        </div>
        
      </div>
      
      {/* At Risk Customers */}
      <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">⚠️ Clientes em Risco</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm opacity-90 mb-2">Total em Risco</div>
            <div className="text-3xl font-bold">{dashboard.churn.atRisk.count} clientes</div>
            <div className="text-sm opacity-80 mt-1">{formatCurrency(dashboard.churn.atRisk.mrr)} MRR</div>
          </div>
          <div>
            <div className="text-sm opacity-90 mb-2">Por Segmento</div>
            <div className="space-y-1">
              {dashboard.churn.atRisk.segments.slice(0, 3).map((seg, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="capitalize">{seg.segment}</span>
                  <span className="font-bold">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FORECAST SECTION
// ═══════════════════════════════════════════════════════════════

function ForecastSection({ dashboard }: { dashboard: FinanceiroDashboard }) {
  return (
    <div className="space-y-6">
      
      {/* Scenarios */}
      <div className="grid grid-cols-3 gap-6">
        {dashboard.forecast.scenarios.map((scenario, i) => (
          <div
            key={i}
            className={`rounded-xl shadow-lg p-6 text-white ${
              scenario.name === 'Best Case' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
              scenario.name === 'Base Case' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
              'bg-gradient-to-br from-slate-500 to-gray-600'
            }`}
          >
            <div className="text-sm font-medium opacity-90 mb-2">{scenario.name}</div>
            <div className="text-3xl font-bold mb-4">{formatCurrency(scenario.mrr12Months)}</div>
            <div className="text-sm opacity-80 mb-3">MRR em 12 meses</div>
            <div className="text-xs opacity-75">
              Probabilidade: {scenario.probability}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Forecast Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Forecast Timeline</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="pb-3 font-semibold text-slate-600">Período</th>
                <th className="pb-3 font-semibold text-slate-600">MRR</th>
                <th className="pb-3 font-semibold text-slate-600">ARR</th>
                <th className="pb-3 font-semibold text-slate-600">Range</th>
                <th className="pb-3 font-semibold text-slate-600">Confiança</th>
                <th className="pb-3 font-semibold text-slate-600">Novos</th>
                <th className="pb-3 font-semibold text-slate-600">Churn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.forecast.forecasts.slice(0, 6).map((f, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-900">{f.period}</td>
                  <td className="py-3 text-slate-700">{formatCurrency(f.predictedMRR)}</td>
                  <td className="py-3 text-slate-700">{formatCurrency(f.predictedARR)}</td>
                  <td className="py-3 text-xs text-slate-600">
                    {formatCurrency(f.lowEstimate)} - {formatCurrency(f.highEstimate)}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      f.confidence > 80 ? 'bg-green-100 text-green-700' :
                      f.confidence > 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {f.confidence}%
                    </span>
                  </td>
                  <td className="py-3 text-green-600 font-medium">+{f.expectedNewCustomers}</td>
                  <td className="py-3 text-red-600 font-medium">-{f.expectedChurn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Model Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Model Performance</h2>
        <div className="grid grid-cols-3 gap-6">
          {dashboard.forecast.models.map((model, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-lg">
              <div className="font-semibold text-slate-900 mb-3">{model.name}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Accuracy</span>
                  <span className="font-medium text-slate-900">{model.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">MAPE</span>
                  <span className="font-medium text-slate-900">{model.mape.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">RMSE</span>
                  <span className="font-medium text-slate-900">{formatCurrency(model.rmse)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

function MetricCard({ 
  label, 
  value, 
  change, 
  trend, 
  subtitle 
}: { 
  label: string; 
  value: string; 
  change?: number; 
  trend?: 'up' | 'down'; 
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="text-sm text-slate-600 mb-2">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      {change !== undefined && (
        <div className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

function HealthScoreCard({ score }: { score: number }) {
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red';
  
  return (
    <div className={`bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl shadow-lg p-6 text-white`}>
      <div className="text-sm font-medium opacity-90 mb-2">Health Score</div>
      <div className="text-4xl font-bold mb-2">{score}/100</div>
      <div className="text-sm opacity-80">
        {score >= 80 ? 'Excelente 🎯' : score >= 60 ? 'Bom ✅' : 'Precisa atenção ⚠️'}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: any }) {
  const colors: Record<string, string> = {
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
    opportunity: 'bg-blue-50 border-blue-200 text-blue-900'
  };
  
  const icons: Record<string, string> = {
    success: '✅',
    warning: '⚠️',
    critical: '🔴',
    opportunity: '💡'
  };
  
  return (
    <div className={`p-4 rounded-lg border ${colors[insight.type] || colors.warning}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[insight.type] || '📊'}</span>
        <div className="flex-1">
          <div className="font-semibold mb-1">{insight.title}</div>
          <div className="text-sm mb-2">{insight.description}</div>
          <div className="text-xs opacity-75 italic">{insight.recommendation}</div>
          {insight.estimatedValue && (
            <div className="text-xs font-medium mt-2">
              Impacto: {formatCurrency(insight.estimatedValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MovementCard({ label, value, color, icon }: any) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
    purple: 'from-purple-500 to-pink-600'
  };
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-4 text-white`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs opacity-80 mb-1">{label}</div>
      <div className="text-xl font-bold">{formatCurrency(value)}</div>
    </div>
  );
}

function MRRWaterfall({ mrr }: any) {
  return (
    <div className="flex items-end gap-2 h-32">
      <div className="flex-1 bg-slate-300 rounded-t" style={{ height: '100%' }}>
        <div className="text-xs text-center mt-2">Previous</div>
        <div className="text-xs text-center font-bold">{formatCurrency(mrr.previousMRR)}</div>
      </div>
      <div className="flex-1 bg-green-500 rounded-t" style={{ height: `${(mrr.newMRR / mrr.currentMRR) * 100}%` }}>
        <div className="text-xs text-center mt-2 text-white">New</div>
      </div>
      <div className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(mrr.expansionMRR / mrr.currentMRR) * 100}%` }}>
        <div className="text-xs text-center mt-2 text-white">Expansion</div>
      </div>
      <div className="flex-1 bg-amber-500 rounded-t" style={{ height: `${(mrr.contractionMRR / mrr.currentMRR) * 100}%` }}>
        <div className="text-xs text-center mt-2 text-white">Contract</div>
      </div>
      <div className="flex-1 bg-red-500 rounded-t" style={{ height: `${(mrr.churnedMRR / mrr.currentMRR) * 100}%` }}>
        <div className="text-xs text-center mt-2 text-white">Churn</div>
      </div>
      <div className="flex-1 bg-slate-700 rounded-t" style={{ height: '100%' }}>
        <div className="text-xs text-center mt-2 text-white">Current</div>
        <div className="text-xs text-center font-bold text-white">{formatCurrency(mrr.currentMRR)}</div>
      </div>
    </div>
  );
}

function TrendChart({ data }: any) {
  const max = Math.max(...data.map((d: any) => d.mrr));
  
  return (
    <div className="space-y-2">
      {data.map((d: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 text-xs text-slate-600">{d.month}</div>
          <div className="flex-1">
            <div className="w-full bg-slate-100 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${(d.mrr / max) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="w-24 text-right text-sm font-medium text-slate-900">
            {formatCurrency(d.mrr)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
