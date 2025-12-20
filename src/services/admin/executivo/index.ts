/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD EXECUTIVO - INDEX
 * ═══════════════════════════════════════════════════════
 * Orquestra todas as métricas executivas
 */

import { getGMVMetrics } from './gmv';
import { getUnitEconomics } from './unitEconomics';
import { getGrowthMetrics } from './growth';
import { getFinancialHealth } from './financialHealth';
import type { ExecutiveDashboard } from './types';

export async function getExecutiveDashboard(): Promise<ExecutiveDashboard> {
  try {
    // Buscar todas as métricas em paralelo
    const [gmv, unitEconomics, growth, financialHealth] = await Promise.all([
      getGMVMetrics(),
      getUnitEconomics(),
      getGrowthMetrics(),
      getFinancialHealth(),
    ]);

    // Gerar insights automáticos
    const insights = gerarInsights(gmv, unitEconomics, growth, financialHealth);

    // Calcular Health Score (0-100)
    const healthScore = calcularHealthScore(gmv, unitEconomics, growth, financialHealth);

    return {
      gmv,
      unitEconomics,
      growth,
      financialHealth,
      insights,
      healthScore,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('[ExecutiveDashboard] Erro:', error);
    throw error;
  }
}

/**
 * Gera insights automáticos baseados nas métricas
 */
function gerarInsights(gmv: any, unitEconomics: any, growth: any, financialHealth: any) {
  const insights: Array<{
    tipo: 'positivo' | 'neutro' | 'atencao' | 'critico';
    titulo: string;
    descricao: string;
    valor?: number;
  }> = [];

  // Insight 1: GMV vs Meta
  if (gmv.atual >= gmv.meta) {
    insights.push({
      tipo: 'positivo',
      titulo: '🎯 Meta de GMV atingida',
      descricao: `GMV de R$ ${(gmv.atual / 1000).toFixed(0)}k superou a meta de R$ ${(gmv.meta / 1000).toFixed(0)}k`,
      valor: gmv.atual,
    });
  } else if (gmv.atual >= gmv.meta * 0.9) {
    insights.push({
      tipo: 'neutro',
      titulo: '📊 GMV próximo da meta',
      descricao: `Faltam R$ ${((gmv.meta - gmv.atual) / 1000).toFixed(0)}k para atingir a meta`,
      valor: gmv.atual,
    });
  } else {
    insights.push({
      tipo: 'atencao',
      titulo: '⚠️ GMV abaixo da meta',
      descricao: `GMV está ${Math.round((1 - gmv.atual / gmv.meta) * 100)}% abaixo da meta`,
      valor: gmv.atual,
    });
  }

  // Insight 2: LTV:CAC Ratio
  if (unitEconomics.ltvCacRatio >= 4.0) {
    insights.push({
      tipo: 'positivo',
      titulo: '💎 Unit Economics excelentes',
      descricao: `LTV:CAC de ${unitEconomics.ltvCacRatio.toFixed(1)}x está muito acima do benchmark (3.0x)`,
      valor: unitEconomics.ltvCacRatio,
    });
  } else if (unitEconomics.ltvCacRatio >= 3.0) {
    insights.push({
      tipo: 'positivo',
      titulo: '✅ Unit Economics saudáveis',
      descricao: `LTV:CAC de ${unitEconomics.ltvCacRatio.toFixed(1)}x está no benchmark ideal`,
      valor: unitEconomics.ltvCacRatio,
    });
  } else if (unitEconomics.ltvCacRatio >= 2.0) {
    insights.push({
      tipo: 'atencao',
      titulo: '⚠️ Unit Economics precisa melhorar',
      descricao: `LTV:CAC de ${unitEconomics.ltvCacRatio.toFixed(1)}x está abaixo do ideal (3.0x)`,
      valor: unitEconomics.ltvCacRatio,
    });
  } else {
    insights.push({
      tipo: 'critico',
      titulo: '🚨 Unit Economics crítico',
      descricao: `LTV:CAC de ${unitEconomics.ltvCacRatio.toFixed(1)}x está muito baixo. Revisar CAC urgente`,
      valor: unitEconomics.ltvCacRatio,
    });
  }

  // Insight 3: Crescimento
  const mediaGrowth = (
    growth.familiasAtivas.momGrowth +
    growth.cuidadoresAtivos.momGrowth +
    growth.jobsCompletados.momGrowth +
    growth.revenueGrowth.momGrowth
  ) / 4;

  if (mediaGrowth >= 15) {
    insights.push({
      tipo: 'positivo',
      titulo: '🚀 Crescimento acelerado',
      descricao: `Crescimento médio de ${mediaGrowth.toFixed(1)}% MoM está excelente`,
      valor: mediaGrowth,
    });
  } else if (mediaGrowth >= 10) {
    insights.push({
      tipo: 'positivo',
      titulo: '📈 Crescimento saudável',
      descricao: `Crescimento médio de ${mediaGrowth.toFixed(1)}% MoM está bom`,
      valor: mediaGrowth,
    });
  } else if (mediaGrowth >= 5) {
    insights.push({
      tipo: 'neutro',
      titulo: '📊 Crescimento moderado',
      descricao: `Crescimento médio de ${mediaGrowth.toFixed(1)}% MoM pode acelerar`,
      valor: mediaGrowth,
    });
  } else {
    insights.push({
      tipo: 'atencao',
      titulo: '⚠️ Crescimento lento',
      descricao: `Crescimento de ${mediaGrowth.toFixed(1)}% MoM precisa acelerar`,
      valor: mediaGrowth,
    });
  }

  // Insight 4: Runway
  if (financialHealth.runway >= 24) {
    insights.push({
      tipo: 'positivo',
      titulo: '💰 Runway confortável',
      descricao: `${financialHealth.runway.toFixed(0)} meses de runway garante tranquilidade`,
      valor: financialHealth.runway,
    });
  } else if (financialHealth.runway >= 12) {
    insights.push({
      tipo: 'neutro',
      titulo: '📊 Runway adequado',
      descricao: `${financialHealth.runway.toFixed(0)} meses de runway é razoável`,
      valor: financialHealth.runway,
    });
  } else if (financialHealth.runway >= 6) {
    insights.push({
      tipo: 'atencao',
      titulo: '⚠️ Runway curto',
      descricao: `Apenas ${financialHealth.runway.toFixed(0)} meses de runway. Planejar captação`,
      valor: financialHealth.runway,
    });
  } else {
    insights.push({
      tipo: 'critico',
      titulo: '🚨 Runway crítico',
      descricao: `Apenas ${financialHealth.runway.toFixed(0)} meses de runway. Urgente captar`,
      valor: financialHealth.runway,
    });
  }

  // Insight 5: Churn
  if (financialHealth.churnRate <= 3) {
    insights.push({
      tipo: 'positivo',
      titulo: '🎯 Churn excelente',
      descricao: `Churn de ${financialHealth.churnRate.toFixed(1)}% está muito bom`,
      valor: financialHealth.churnRate,
    });
  } else if (financialHealth.churnRate <= 5) {
    insights.push({
      tipo: 'neutro',
      titulo: '📊 Churn aceitável',
      descricao: `Churn de ${financialHealth.churnRate.toFixed(1)}% pode melhorar`,
      valor: financialHealth.churnRate,
    });
  } else {
    insights.push({
      tipo: 'atencao',
      titulo: '⚠️ Churn alto',
      descricao: `Churn de ${financialHealth.churnRate.toFixed(1)}% precisa reduzir`,
      valor: financialHealth.churnRate,
    });
  }

  return insights.slice(0, 5); // Top 5 insights
}

/**
 * Calcula Health Score geral (0-100)
 */
function calcularHealthScore(gmv: any, unitEconomics: any, growth: any, financialHealth: any): number {
  let score = 0;

  // GMV vs Meta (20 pontos)
  const gmvScore = Math.min((gmv.atual / gmv.meta) * 20, 20);
  score += gmvScore;

  // LTV:CAC Ratio (25 pontos)
  const ltvCacScore = Math.min((unitEconomics.ltvCacRatio / 4.0) * 25, 25);
  score += ltvCacScore;

  // Growth (20 pontos)
  const mediaGrowth = (
    growth.familiasAtivas.momGrowth +
    growth.cuidadoresAtivos.momGrowth +
    growth.jobsCompletados.momGrowth +
    growth.revenueGrowth.momGrowth
  ) / 4;
  const growthScore = Math.min((mediaGrowth / 15) * 20, 20);
  score += growthScore;

  // Runway (20 pontos)
  const runwayScore = Math.min((financialHealth.runway / 24) * 20, 20);
  score += runwayScore;

  // Churn (15 pontos - inverso)
  const churnScore = Math.max(15 - (financialHealth.churnRate / 10) * 15, 0);
  score += churnScore;

  return Math.round(score);
}

export * from './types';
export * from './gmv';
export * from './unitEconomics';
export * from './growth';
export * from './financialHealth';
