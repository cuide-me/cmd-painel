/**
 * Pipeline V2 - Main Orchestrator
 * Coordinates all pipeline services and generates insights
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { PipelineDashboard, PipelineFilters, Deal, PipelineHealthAnalysis, PipelineForecast } from './types';
import { getDeals, getPipelineMetrics } from './pipelineService';
import { calculateSalesVelocity, calculateConversionAnalytics } from './velocityService';

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getPipelineDashboard(
  filters: PipelineFilters = {}
): Promise<PipelineDashboard> {
  
  const endDate = filters.dateTo || new Date();
  const startDate = filters.dateFrom || new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
  
  // ═══════════════════════════════════════════════════════════════
  // FETCH ALL DEALS
  // ═══════════════════════════════════════════════════════════════
  
  const allDeals = await getDeals(startDate, endDate, filters);
  
  const activeDeals = allDeals.filter(d => d.status === 'active');
  const closedWonDeals = allDeals.filter(d => d.status === 'won');
  const closedLostDeals = allDeals.filter(d => d.status === 'lost');
  
  // ═══════════════════════════════════════════════════════════════
  // CALCULATE ALL METRICS IN PARALLEL
  // ═══════════════════════════════════════════════════════════════
  
  const [
    metrics,
    velocity,
    conversions
  ] = await Promise.all([
    getPipelineMetrics(allDeals),
    calculateSalesVelocity(allDeals, closedWonDeals, closedLostDeals),
    calculateConversionAnalytics(allDeals, closedWonDeals)
  ]);
  
  // Update metrics with velocity data
  metrics.velocity = velocity;
  
  // ═══════════════════════════════════════════════════════════════
  // HEALTH ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  const health = await getPipelineHealthAnalysis(activeDeals, metrics);
  
  // ═══════════════════════════════════════════════════════════════
  // FORECAST
  // ═══════════════════════════════════════════════════════════════
  
  const forecast = await getPipelineForecast(activeDeals, metrics.winRate, metrics.averageSalesCycle);
  
  // ═══════════════════════════════════════════════════════════════
  // TOP DEALS & CLOSING SOON
  // ═══════════════════════════════════════════════════════════════
  
  const topDeals = [...activeDeals]
    .sort((a, b) => b.weightedValue - a.weightedValue)
    .slice(0, 10);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const closingSoon = activeDeals
    .filter(d => d.expectedCloseDate <= thirtyDaysFromNow && d.probability >= 50)
    .sort((a, b) => a.expectedCloseDate.getTime() - b.expectedCloseDate.getTime())
    .slice(0, 10);
  
  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  
  const summary = {
    totalDeals: activeDeals.length,
    totalValue: metrics.totalValue,
    weightedValue: metrics.weightedValue,
    winRate: metrics.winRate,
    averageDealSize: metrics.averageDealSize,
    averageSalesCycle: metrics.averageSalesCycle,
    velocity: velocity.currentVelocity
  };
  
  // ═══════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════
  
  const insights = generateInsights(metrics, velocity, conversions, health);
  
  return {
    summary,
    metrics,
    velocity,
    conversions,
    health,
    forecast,
    deals: activeDeals,
    topDeals,
    closingSoon,
    insights,
    periodStart: startDate,
    periodEnd: endDate
  };
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE HEALTH ANALYSIS
// ═══════════════════════════════════════════════════════════════

async function getPipelineHealthAnalysis(
  activeDeals: Deal[],
  metrics: any
): Promise<PipelineHealthAnalysis> {
  
  // ═══════════════════════════════════════════════════════════════
  // OVERALL HEALTH SCORE
  // ═══════════════════════════════════════════════════════════════
  
  const healthScore = metrics.pipelineHealth.score;
  
  // ═══════════════════════════════════════════════════════════════
  // COVERAGE
  // ═══════════════════════════════════════════════════════════════
  
  const monthlyTarget = 100000; // R$ 100k - would come from settings
  const currentPipelineValue = metrics.weightedValue;
  const coverageRatio = monthlyTarget > 0 ? currentPipelineValue / monthlyTarget : 0;
  const months = coverageRatio > 0 ? coverageRatio : 0;
  
  const coverageStatus = coverageRatio >= 3 ? 'healthy' : 
                        coverageRatio >= 2 ? 'warning' : 'critical';
  
  const coverage = {
    currentPipelineValue,
    monthlyTarget,
    coverageRatio,
    months,
    status: coverageStatus as 'healthy' | 'warning' | 'critical'
  };
  
  // ═══════════════════════════════════════════════════════════════
  // DISTRIBUTION ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  const distribution = [];
  
  // Stage distribution
  const stageConcentration = Math.max(...metrics.byStage.map((s: any) => s.count));
  const totalDeals = activeDeals.length;
  const stageConcentrationPct = totalDeals > 0 ? (stageConcentration / totalDeals) * 100 : 0;
  
  if (stageConcentrationPct > 50) {
    distribution.push({
      metric: 'stage' as const,
      analysis: `${stageConcentrationPct.toFixed(0)}% dos deals concentrados em um estágio`,
      riskLevel: 'high' as const,
      recommendation: 'Distribuir esforços entre múltiplos estágios para balancear pipeline'
    });
  }
  
  // Owner distribution
  const ownerConcentration = Math.max(...metrics.byOwner.map((o: any) => o.dealsCount));
  const ownerConcentrationPct = totalDeals > 0 ? (ownerConcentration / totalDeals) * 100 : 0;
  
  if (ownerConcentrationPct > 60) {
    distribution.push({
      metric: 'owner' as const,
      analysis: `${ownerConcentrationPct.toFixed(0)}% dos deals com um único vendedor`,
      riskLevel: 'medium' as const,
      recommendation: 'Redistribuir leads para balancear carga e reduzir risco'
    });
  }
  
  // Age distribution
  const oldDeals = activeDeals.filter(d => d.daysInPipeline > 60).length;
  const oldDealsPct = totalDeals > 0 ? (oldDeals / totalDeals) * 100 : 0;
  
  if (oldDealsPct > 30) {
    distribution.push({
      metric: 'age' as const,
      analysis: `${oldDealsPct.toFixed(0)}% dos deals com mais de 60 dias`,
      riskLevel: 'high' as const,
      recommendation: 'Revisar deals antigos - qualificar ou descartar'
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // AT-RISK DEALS
  // ═══════════════════════════════════════════════════════════════
  
  const atRisk = activeDeals
    .filter(d => d.riskLevel === 'high')
    .map(deal => {
      const riskFactors = [];
      
      if (deal.daysInStage > 14) riskFactors.push('Parado no estágio há muito tempo');
      if (deal.daysInPipeline > 60) riskFactors.push('Deal muito antigo');
      
      const daysSinceActivity = Math.floor(
        (Date.now() - deal.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity > 7) riskFactors.push('Sem atividade recente');
      
      if (deal.activitiesCount < 3) riskFactors.push('Poucas interações');
      
      return {
        deal,
        riskFactors,
        riskScore: deal.healthScore,
        recommendation: getRiskRecommendation(riskFactors)
      };
    })
    .sort((a, b) => a.riskScore - b.riskScore)
    .slice(0, 10);
  
  // ═══════════════════════════════════════════════════════════════
  // STALE DEALS
  // ═══════════════════════════════════════════════════════════════
  
  const staleDeals = activeDeals
    .filter(d => {
      const daysSinceActivity = Math.floor(
        (Date.now() - d.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceActivity > 7;
    })
    .map(deal => {
      const daysStale = Math.floor(
        (Date.now() - deal.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        deal,
        daysStale,
        lastActivity: deal.lastActivity,
        recommendedAction: daysStale > 14 ? 'Requalificar ou descartar' :
                          daysStale > 7 ? 'Contato urgente' :
                          'Agendar follow-up'
      };
    })
    .sort((a, b) => b.daysStale - a.daysStale)
    .slice(0, 15);
  
  // ═══════════════════════════════════════════════════════════════
  // QUALITY INDICATORS
  // ═══════════════════════════════════════════════════════════════
  
  const quality = [
    {
      indicator: 'Taxa de Atividade',
      value: metrics.pipelineHealth.staleDeals / totalDeals * 100,
      target: 20,
      status: (metrics.pipelineHealth.staleDeals / totalDeals * 100) < 20 ? 'good' : 'warning' as any
    },
    {
      indicator: 'Cobertura de Pipeline',
      value: coverageRatio,
      target: 3,
      status: coverageStatus === 'healthy' ? 'good' : coverageStatus === 'warning' ? 'warning' : 'poor' as any
    },
    {
      indicator: 'Win Rate',
      value: metrics.winRate,
      target: 30,
      status: metrics.winRate > 30 ? 'good' : metrics.winRate > 20 ? 'warning' : 'poor' as any
    },
    {
      indicator: 'Ciclo de Vendas',
      value: metrics.averageSalesCycle,
      target: 45,
      status: metrics.averageSalesCycle < 45 ? 'good' : metrics.averageSalesCycle < 60 ? 'warning' : 'poor' as any
    }
  ];
  
  return {
    healthScore,
    coverage,
    distribution,
    atRisk,
    staleDeals,
    quality
  };
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE FORECAST
// ═══════════════════════════════════════════════════════════════

async function getPipelineForecast(
  activeDeals: Deal[],
  winRate: number,
  avgSalesCycle: number
): Promise<PipelineForecast> {
  
  // Generate forecast for next 3 months
  const periods = [];
  const now = new Date();
  
  for (let i = 0; i < 3; i++) {
    const periodDate = new Date(now);
    periodDate.setMonth(periodDate.getMonth() + i);
    
    const period = periodDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
    
    // Filter deals expected to close in this period
    const monthStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const monthEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
    
    const periodDeals = activeDeals.filter(d => 
      d.expectedCloseDate >= monthStart && d.expectedCloseDate <= monthEnd
    );
    
    const committed = periodDeals
      .filter(d => d.probability >= 70)
      .reduce((sum, d) => sum + d.value, 0);
    
    const bestCase = periodDeals
      .filter(d => d.probability >= 50)
      .reduce((sum, d) => sum + d.value, 0);
    
    const mostLikely = periodDeals
      .reduce((sum, d) => sum + d.weightedValue, 0);
    
    const worstCase = periodDeals
      .filter(d => d.probability >= 90)
      .reduce((sum, d) => sum + d.value, 0);
    
    const expectedCloses = periodDeals.filter(d => d.probability >= 50).length;
    
    // Confidence decreases with time
    const confidence = Math.max(50, 90 - (i * 15));
    
    periods.push({
      period,
      periodType: 'month' as const,
      committed,
      bestCase,
      mostLikely,
      worstCase,
      expectedCloses,
      confidence
    });
  }
  
  // Deal-based forecast
  const deals = activeDeals.map(deal => {
    const forecastCategory = deal.probability >= 90 ? 'commit' :
                            deal.probability >= 70 ? 'best_case' :
                            deal.probability >= 30 ? 'pipeline' : 'omitted';
    
    const expectedCloseMonth = deal.expectedCloseDate.toLocaleDateString('pt-BR', 
      { year: 'numeric', month: 'short' }
    );
    
    return {
      deal,
      forecastCategory: forecastCategory as any,
      expectedCloseMonth,
      confidence: deal.probability
    };
  });
  
  // Accuracy tracking (mock - would need historical data)
  const accuracy = [
    {
      period: 'Nov 2024',
      forecasted: 95000,
      actual: 88000,
      accuracy: 92.6,
      variance: -7000
    },
    {
      period: 'Dez 2024',
      forecasted: 105000,
      actual: 112000,
      accuracy: 93.6,
      variance: 7000
    }
  ];
  
  return {
    periods,
    deals,
    accuracy
  };
}

// ═══════════════════════════════════════════════════════════════
// INSIGHTS GENERATION
// ═══════════════════════════════════════════════════════════════

function generateInsights(
  metrics: any,
  velocity: any,
  conversions: any,
  health: any
) {
  const insights = [];
  
  // Velocity insights
  if (velocity.velocityChange > 20) {
    insights.push({
      type: 'success' as const,
      category: 'velocity' as const,
      title: 'Velocidade de Vendas Acelerou',
      description: `Velocity aumentou ${velocity.velocityChange.toFixed(1)}% - R$ ${velocity.currentVelocity.toFixed(0)}/dia`,
      impact: 'high' as const,
      recommendation: 'Documentar e replicar as práticas que levaram a esta melhoria',
      estimatedValue: velocity.currentVelocity * 30
    });
  } else if (velocity.velocityChange < -10) {
    insights.push({
      type: 'warning' as const,
      category: 'velocity' as const,
      title: 'Velocity em Queda',
      description: `Velocity caiu ${Math.abs(velocity.velocityChange).toFixed(1)}%`,
      impact: 'high' as const,
      recommendation: 'Revisar processo de vendas e identificar gargalos urgentemente'
    });
  }
  
  // Bottleneck insights
  if (velocity.bottlenecks.length > 0) {
    const topBottleneck = velocity.bottlenecks[0];
    insights.push({
      type: 'critical' as const,
      category: 'velocity' as const,
      title: `Gargalo Crítico: ${topBottleneck.stageName}`,
      description: `${topBottleneck.affectedDeals} deals parados há ${topBottleneck.averageStuckDays.toFixed(0)} dias`,
      impact: 'high' as const,
      recommendation: topBottleneck.recommendation,
      estimatedValue: topBottleneck.estimatedImpact * 30
    });
  }
  
  // Conversion insights
  const poorConversions = conversions.stageConversions.filter((c: any) => c.performance === 'below');
  if (poorConversions.length > 0) {
    insights.push({
      type: 'warning' as const,
      category: 'conversion' as const,
      title: 'Conversões Abaixo do Benchmark',
      description: `${poorConversions.length} estágios com conversão abaixo da média do mercado`,
      impact: 'medium' as const,
      recommendation: 'Treinar time e revisar playbook de vendas'
    });
  }
  
  // Drop-off insights
  const highDropoffs = conversions.dropoffs.filter((d: any) => d.dropoffRate > 30);
  if (highDropoffs.length > 0) {
    const worst = highDropoffs[0];
    insights.push({
      type: 'critical' as const,
      category: 'conversion' as const,
      title: `Alto Drop-off em ${worst.stageName}`,
      description: `${worst.dropoffRate.toFixed(0)}% dos deals perdidos neste estágio`,
      impact: 'high' as const,
      recommendation: `Analisar motivos: ${worst.topReasons.join(', ')}`,
      estimatedValue: worst.lostValue
    });
  }
  
  // Health insights
  if (health.coverage.status === 'critical') {
    insights.push({
      type: 'critical' as const,
      category: 'health' as const,
      title: 'Cobertura de Pipeline Crítica',
      description: `Pipeline atual cobre apenas ${health.coverage.coverageRatio.toFixed(1)}x da meta (precisa 3-5x)`,
      impact: 'high' as const,
      recommendation: 'URGENTE: Intensificar geração de leads e qualificação'
    });
  }
  
  if (health.atRisk.length > 5) {
    insights.push({
      type: 'warning' as const,
      category: 'health' as const,
      title: `${health.atRisk.length} Deals em Alto Risco`,
      description: 'Deals com baixo health score precisam de atenção imediata',
      impact: 'high' as const,
      recommendation: 'Priorizar follow-ups e revisar estratégia de engajamento',
      estimatedValue: health.atRisk.reduce((sum: number, d: any) => sum + d.deal.value, 0)
    });
  }
  
  // Win rate insights
  if (metrics.winRate > 40) {
    insights.push({
      type: 'success' as const,
      category: 'conversion' as const,
      title: 'Excelente Win Rate',
      description: `Win rate de ${metrics.winRate.toFixed(0)}% acima da média (30%)`,
      impact: 'medium' as const,
      recommendation: 'Considerar aumentar volume de leads - eficiência comprovada'
    });
  } else if (metrics.winRate < 20) {
    insights.push({
      type: 'warning' as const,
      category: 'conversion' as const,
      title: 'Win Rate Baixo',
      description: `Win rate de ${metrics.winRate.toFixed(0)}% abaixo do aceitável`,
      impact: 'high' as const,
      recommendation: 'Melhorar qualificação de leads e revisar proposta de valor'
    });
  }
  
  return insights;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getRiskRecommendation(riskFactors: string[]): string {
  if (riskFactors.includes('Parado no estágio há muito tempo')) {
    return 'Contato imediato para entender blockers e definir próximos passos';
  }
  if (riskFactors.includes('Sem atividade recente')) {
    return 'Reagendar reunião urgente ou enviar email de re-engajamento';
  }
  if (riskFactors.includes('Poucas interações')) {
    return 'Aumentar frequência de touchpoints e criar mais valor na conversa';
  }
  return 'Revisar estratégia e considerar desqualificar se não houver progresso';
}
