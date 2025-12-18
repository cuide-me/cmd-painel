/**
 * COMPONENTE: KPI Dashboard
 * Grid de KPIs consolidados (Financial, Operational, Marketplace, Growth)
 */

'use client';

import React from 'react';
import type { TorreV3KPIs, KPIValue } from '@/services/admin/torre-v3/types';

interface KPIDashboardProps {
  kpis: TorreV3KPIs;
}

export default function KPIDashboard({ kpis }: KPIDashboardProps) {
  return (
    <div className="space-y-8">
      {/* FINANCIAL KPIs */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-blue-600">💰 KPIs Financeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="MRR"
            value={kpis.financial.mrr.value}
            unit="BRL"
            kpiData={kpis.financial.mrr}
            description="Monthly Recurring Revenue"
          />
          <KPICard
            title="ARR"
            value={kpis.financial.arr.value}
            unit="BRL"
            kpiData={kpis.financial.arr}
            description="Annual Recurring Revenue"
          />
          <KPICard
            title="MRR Growth"
            value={kpis.financial.mrrGrowth.value}
            unit="%"
            kpiData={kpis.financial.mrrGrowth}
            description="Crescimento MRR"
          />
          <KPICard
            title="ARPU"
            value={kpis.financial.arpu.value}
            unit="BRL"
            kpiData={kpis.financial.arpu}
            description="Receita média por usuário"
          />
          <KPICard
            title="LTV"
            value={kpis.financial.ltv.value}
            unit="BRL"
            kpiData={kpis.financial.ltv}
            description="Lifetime Value"
          />
          <KPICard
            title="Churn Rate"
            value={kpis.financial.churnRate.value}
            unit="%"
            kpiData={kpis.financial.churnRate}
            description="Taxa de cancelamento"
            invertColors
          />
          <KPICard
            title="Burn Rate"
            value={kpis.financial.burnRate.value}
            unit="BRL"
            kpiData={kpis.financial.burnRate}
            description="Gastos mensais (payouts)"
          />
          <KPICard
            title="Net Burn"
            value={kpis.financial.netBurn.value}
            unit="BRL"
            kpiData={kpis.financial.netBurn}
            description="MRR - Burn Rate"
          />
          <KPICard
            title="Runway"
            value={kpis.financial.runway.value === 999 ? '∞' : kpis.financial.runway.value}
            unit={kpis.financial.runway.value === 999 ? '' : 'meses'}
            kpiData={kpis.financial.runway}
            description="Meses de caixa"
          />
        </div>
      </section>

      {/* OPERATIONAL KPIs */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-green-600">⚙️ KPIs Operacionais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Jobs"
            value={kpis.operational.totalJobs.value}
            unit=""
            kpiData={kpis.operational.totalJobs}
            description="Contratações no período"
          />
          <KPICard
            title="Jobs Ativos"
            value={kpis.operational.activeJobs.value}
            unit=""
            kpiData={kpis.operational.activeJobs}
            description="Em andamento"
          />
          <KPICard
            title="Jobs Completados"
            value={kpis.operational.completedJobs.value}
            unit=""
            kpiData={kpis.operational.completedJobs}
            description="Finalizados"
          />
          <KPICard
            title="Taxa Aceitação"
            value={kpis.operational.acceptanceRate.value}
            unit="%"
            kpiData={kpis.operational.acceptanceRate}
            description="Jobs aceitos"
          />
          <KPICard
            title="Taxa Conclusão"
            value={kpis.operational.completionRate.value}
            unit="%"
            kpiData={kpis.operational.completionRate}
            description="Jobs finalizados"
          />
          <KPICard
            title="Tempo Resposta"
            value={kpis.operational.avgResponseTime.value}
            unit="h"
            kpiData={kpis.operational.avgResponseTime}
            description="Até aceitação"
            invertColors
          />
          <KPICard
            title="Rating Médio"
            value={kpis.operational.avgRating.value}
            unit="★"
            kpiData={kpis.operational.avgRating}
            description="Avaliação geral"
            decimals={2}
          />
          <KPICard
            title="NPS"
            value={kpis.operational.nps.value}
            unit=""
            kpiData={kpis.operational.nps}
            description="Net Promoter Score"
          />
          <KPICard
            title="Feedbacks"
            value={kpis.operational.feedbackCount}
            unit=""
            kpiData={kpis.operational.avgRating}
            description="Total no período"
          />
        </div>
      </section>

      {/* MARKETPLACE KPIs */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-purple-600">🏪 Saúde do Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Profissionais"
            value={kpis.marketplace.totalProfessionals.value}
            unit=""
            kpiData={kpis.marketplace.totalProfessionals}
            description="Cadastrados"
          />
          <KPICard
            title="Prof. Ativos"
            value={kpis.marketplace.activeProfessionals.value}
            unit=""
            kpiData={kpis.marketplace.activeProfessionals}
            description="Com jobs recentes"
          />
          <KPICard
            title="Clientes"
            value={kpis.marketplace.totalClients.value}
            unit=""
            kpiData={kpis.marketplace.totalClients}
            description="Cadastrados"
          />
          <KPICard
            title="Clientes Ativos"
            value={kpis.marketplace.activeClients.value}
            unit=""
            kpiData={kpis.marketplace.activeClients}
            description="Com jobs recentes"
          />
          <KPICard
            title="Supply/Demand"
            value={kpis.marketplace.supplyDemandRatio.value}
            unit=""
            kpiData={kpis.marketplace.supplyDemandRatio}
            description="Profissionais / Jobs"
            decimals={2}
          />
          <KPICard
            title="Match Rate"
            value={kpis.marketplace.matchRate.value}
            unit="%"
            kpiData={kpis.marketplace.matchRate}
            description="Jobs com profissional"
          />
          <KPICard
            title="Utilização"
            value={kpis.marketplace.utilizationRate.value}
            unit="%"
            kpiData={kpis.marketplace.utilizationRate}
            description="% prof. ativos"
          />
          <KPICard
            title="Jobs Pendentes"
            value={kpis.marketplace.pendingJobs}
            unit=""
            kpiData={kpis.marketplace.matchRate}
            description="Sem match"
          />
          <KPICard
            title="Prof. Inativos"
            value={kpis.marketplace.inactiveProfessionals}
            unit=""
            kpiData={kpis.marketplace.activeProfessionals}
            description="Sem jobs"
          />
        </div>
      </section>

      {/* GROWTH KPIs */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-orange-600">📈 KPIs de Crescimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Usuários Ativos"
            value={kpis.growth.activeUsers.value}
            unit=""
            kpiData={kpis.growth.activeUsers}
            description="GA4"
          />
          <KPICard
            title="Novos Usuários"
            value={kpis.growth.newUsers.value}
            unit=""
            kpiData={kpis.growth.newUsers}
            description="GA4"
          />
          <KPICard
            title="Sessões"
            value={kpis.growth.sessions.value}
            unit=""
            kpiData={kpis.growth.sessions}
            description="GA4"
          />
          <KPICard
            title="Novos Profissionais"
            value={kpis.growth.newProfessionals.value}
            unit=""
            kpiData={kpis.growth.newProfessionals}
            description="Cadastros Firebase"
          />
          <KPICard
            title="Novos Clientes"
            value={kpis.growth.newClients.value}
            unit=""
            kpiData={kpis.growth.newClients}
            description="Cadastros Firebase"
          />
          <KPICard
            title="Conv. Signup"
            value={kpis.growth.signupConversionRate.value}
            unit="%"
            kpiData={kpis.growth.signupConversionRate}
            description="Visitantes → Cadastro"
            decimals={2}
          />
          <KPICard
            title="Duração Sessão"
            value={kpis.growth.avgSessionDuration.value}
            unit="s"
            kpiData={kpis.growth.avgSessionDuration}
            description="Média"
          />
          <KPICard
            title="Bounce Rate"
            value={kpis.growth.bounceRate.value}
            unit="%"
            kpiData={kpis.growth.bounceRate}
            description="Saem imediatamente"
            invertColors
          />
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KPI CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

interface KPICardProps {
  title: string;
  value: number | string;
  unit: string;
  kpiData: KPIValue;
  description: string;
  decimals?: number;
  invertColors?: boolean; // Para métricas onde "down" é bom (ex: churn, bounce rate)
}

function KPICard({ title, value, unit, kpiData, description, decimals = 0, invertColors = false }: KPICardProps) {
  // Status colors
  const statusColors = {
    good: 'bg-green-50 border-green-300',
    warning: 'bg-yellow-50 border-yellow-300',
    critical: 'bg-red-50 border-red-300',
  };
  
  // Trend icons
  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→',
  };
  
  // Trend colors (considerar invertColors)
  const getTrendColor = () => {
    if (kpiData.trend === 'stable') return 'text-gray-500';
    
    const isGoodTrend = invertColors 
      ? kpiData.trend === 'down'  // Para churn/bounce, down é bom
      : kpiData.trend === 'up';   // Para receita, up é bom
    
    return isGoodTrend ? 'text-green-600' : 'text-red-600';
  };
  
  // Format value
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    if (unit === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(val);
    }
    
    return val.toFixed(decimals);
  };
  
  return (
    <div className={`p-4 border-2 rounded-lg ${statusColors[kpiData.status]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className={`text-xl ${getTrendColor()}`}>
          {trendIcons[kpiData.trend]}
        </span>
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </span>
        {unit && unit !== 'BRL' && (
          <span className="text-sm text-gray-600 ml-1">{unit}</span>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      
      {kpiData.changePercent !== undefined && kpiData.changePercent !== 0 && (
        <div className={`text-xs ${getTrendColor()}`}>
          {kpiData.changePercent > 0 ? '+' : ''}
          {kpiData.changePercent.toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  );
}
