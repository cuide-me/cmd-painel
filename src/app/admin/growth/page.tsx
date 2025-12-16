'use client';

/**
 * Growth & Activation Dashboard
 * AARRR Framework: Acquisition, Activation, Retention, Revenue, Referral
 */

import { useState, useEffect } from 'react';
import type { GrowthDashboard } from '@/services/admin/growth/types';

export default function GrowthPage() {
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral'>('acquisition');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/admin/growth');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Error loading growth data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando métricas de crescimento...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
        <div className="text-center text-slate-600">Erro ao carregar dados</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          📈 Growth & Activation
        </h1>
        <p className="text-slate-600">
          Framework AARRR: Aquisição, Ativação, Retenção, Receita, Referral
        </p>
      </div>

      {/* Overall Health Score */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-1">Saúde Geral do Crescimento</h2>
            <p className="text-sm text-slate-500">Score ponderado de todos os pilares AARRR</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(data.overallHealth)}`}>
              {data.overallHealth}
            </div>
            <div className="text-sm text-slate-600">/100</div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${data.overallHealth}%` }}
          />
        </div>
      </div>

      {/* AARRR Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <PillarCard
          icon="🎯"
          title="Aquisição"
          score={data.acquisition.score}
          active={activeTab === 'acquisition'}
          onClick={() => setActiveTab('acquisition')}
        />
        <PillarCard
          icon="⚡"
          title="Ativação"
          score={data.activation.score}
          active={activeTab === 'activation'}
          onClick={() => setActiveTab('activation')}
        />
        <PillarCard
          icon="🔄"
          title="Retenção"
          score={data.retention.score}
          active={activeTab === 'retention'}
          onClick={() => setActiveTab('retention')}
        />
        <PillarCard
          icon="💰"
          title="Receita"
          score={data.revenue.score}
          active={activeTab === 'revenue'}
          onClick={() => setActiveTab('revenue')}
        />
        <PillarCard
          icon="🚀"
          title="Referral"
          score={data.referral.score}
          active={activeTab === 'referral'}
          onClick={() => setActiveTab('referral')}
        />
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <h2 className="text-xl font-bold text-slate-900 mb-4">💡 Insights & Recomendações</h2>
          <div className="space-y-3">
            {data.insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        {activeTab === 'acquisition' && <AcquisitionTab data={data.acquisition.metrics} />}
        {activeTab === 'activation' && <ActivationTab data={data.activation} />}
        {activeTab === 'retention' && <RetentionTab data={data.retention.metrics} />}
        {activeTab === 'revenue' && <RevenueTab data={data.revenue.metrics} />}
        {activeTab === 'referral' && <ReferralTab data={data.referral.metrics} />}
      </div>
    </div>
  );
}

// Components

function PillarCard({ icon, title, score, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl transition-all ${
        active
          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg scale-105'
          : 'bg-white hover:bg-slate-50 text-slate-700'
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-sm mb-1">{title}</div>
      <div className={`text-2xl font-bold ${active ? 'text-white' : getScoreColor(score)}`}>
        {score}
      </div>
    </button>
  );
}

function InsightCard({ insight }: any) {
  const typeIcons = {
    opportunity: '🎯',
    warning: '⚠️',
    success: '✅',
  };

  const typeColors = {
    opportunity: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-orange-50 border-orange-200 text-orange-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  };

  return (
    <div className={`border rounded-xl p-4 ${typeColors[insight.type]}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{typeIcons[insight.type]}</div>
        <div className="flex-1">
          <div className="font-bold mb-1">{insight.title}</div>
          <div className="text-sm mb-2">{insight.description}</div>
          <div className="text-xs font-semibold">💡 {insight.recommendation}</div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${insight.impact === 'high' ? 'bg-red-200 text-red-800' : insight.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-slate-200 text-slate-700'}`}>
          {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
        </div>
      </div>
    </div>
  );
}

function AcquisitionTab({ data }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">🎯 Aquisição de Usuários</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Visitantes" value={data.totalVisitors} />
        <MetricCard label="Cadastros" value={data.totalSignups} />
        <MetricCard label="Conversões" value={data.totalConversions} />
        <MetricCard label="Taxa Conversão" value={`${data.conversionRate.toFixed(1)}%`} />
      </div>

      {/* Funnel */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">Funil de Aquisição</h3>
        <div className="space-y-2">
          <FunnelStage label="Visitantes" value={data.funnel.stage1_visitors} percentage={100} />
          <FunnelStage label="Cadastros" value={data.funnel.stage2_signups} percentage={data.funnel.visitorToSignup} />
          <FunnelStage label="Completos" value={data.funnel.stage3_completed} percentage={data.funnel.signupToComplete} />
          <FunnelStage label="Verificados" value={data.funnel.stage4_verified} percentage={data.funnel.completeToVerified} />
          <FunnelStage label="Perfil 100%" value={data.funnel.stage5_profileComplete} percentage={data.funnel.verifiedToProfile} />
          <FunnelStage label="Primeira Ação" value={data.funnel.stage6_firstAction} percentage={data.funnel.profileToAction} />
        </div>
      </div>

      {/* Channels */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Canais de Aquisição</h3>
        <div className="space-y-2">
          {data.byChannel.map((channel: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium">{channel.label}</div>
                <div className="text-sm text-slate-600">{channel.conversions} conversões</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-600">{channel.conversionRate.toFixed(1)}%</div>
                <div className="text-xs text-slate-500">{channel.trend === 'up' ? '📈' : channel.trend === 'down' ? '📉' : '➡️'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivationTab({ data }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">⚡ Ativação de Usuários</h2>
      
      {/* Health Score */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Score de Ativação</h3>
            <p className="text-sm text-slate-600">{data.health.status === 'excellent' ? 'Excelente' : data.health.status === 'good' ? 'Bom' : data.health.status === 'needs_improvement' ? 'Precisa Melhorar' : 'Crítico'}</p>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(data.health.score)}`}>
            {data.health.score}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-slate-600 mb-1">D1 Retention</div>
            <div className="font-bold">{data.health.metrics.d1Retention.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">D7 Retention</div>
            <div className="font-bold">{data.health.metrics.d7Retention.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">D30 Retention</div>
            <div className="font-bold">{data.health.metrics.d30Retention.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">Marcos de Ativação</h3>
        <div className="space-y-2">
          {data.metrics.milestones.map((milestone: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{milestone.label}</div>
                <div className="text-sm font-bold text-purple-600">{milestone.percentage.toFixed(0)}%</div>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{milestone.users} usuários</span>
                <span>⏱️ {Math.round(milestone.avgTimeFromSignup)}min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues */}
      {data.health.issues.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">⚠️ Issues Identificados</h3>
          <div className="space-y-2">
            {data.health.issues.map((issue: any, idx: number) => (
              <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-medium text-orange-900 mb-1">{issue.issue}</div>
                <div className="text-sm text-orange-800">💡 {issue.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RetentionTab({ data }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">🔄 Retenção de Usuários</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="D1 Retention" value={`${data.retentionRates.d1.toFixed(0)}%`} />
        <MetricCard label="D7 Retention" value={`${data.retentionRates.d7.toFixed(0)}%`} />
        <MetricCard label="D30 Retention" value={`${data.retentionRates.d30.toFixed(0)}%`} />
        <MetricCard label="D90 Retention" value={`${data.retentionRates.d90.toFixed(0)}%`} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">🔮 Churn Prediction</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-blue-700 mb-1">Usuários em Risco</div>
            <div className="text-2xl font-bold text-blue-900">{data.churn.churnPrediction.atRiskUsers}</div>
          </div>
          <div>
            <div className="text-sm text-blue-700 mb-1">Churn Previsto (30d)</div>
            <div className="text-2xl font-bold text-blue-900">{data.churn.churnPrediction.predictedChurnNext30Days}</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-700">
          Confiança: {data.churn.churnPrediction.confidence}%
        </div>
      </div>
    </div>
  );
}

function RevenueTab({ data }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">💰 Receita & LTV</h2>
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-4">🚧</div>
        <p className="font-semibold mb-2">Financeiro 2.0 em Desenvolvimento</p>
        <p className="text-sm">MRR/ARR tracking, LTV calculations, e revenue forecasting</p>
      </div>
    </div>
  );
}

function ReferralTab({ data }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">🚀 Programa de Referral</h2>
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-4">🚧</div>
        <p className="font-semibold mb-2">Referral Tracking em Desenvolvimento</p>
        <p className="text-sm">Viral coefficient, K-factor, e growth loops</p>
      </div>
    </div>
  );
}

// Utility Components

function MetricCard({ label, value }: any) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function FunnelStage({ label, value, percentage }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-8 bg-slate-200 rounded-lg overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end px-3 text-white text-xs font-semibold transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && `${percentage.toFixed(0)}%`}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}
