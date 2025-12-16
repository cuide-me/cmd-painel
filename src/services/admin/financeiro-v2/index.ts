/**
 * Financeiro V2 - Main Orchestrator
 * Coordena todos os serviços e gera insights
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  FinanceiroDashboard, 
  FinanceiroFilters,
  UnitEconomics,
  CohortRevenueAnalysis 
} from './types';
import { getMRRMetrics, getARRMetrics, getMRRHistory } from './mrrService';
import { getLTVMetrics } from './ltvService';
import { getChurnMetrics, getRevenueForecast } from './churnService';

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getFinanceiroDashboard(
  filters: FinanceiroFilters = {}
): Promise<FinanceiroDashboard> {
  const endDate = filters.dateTo || new Date();
  const startDate = filters.dateFrom || new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
  
  // ═══════════════════════════════════════════════════════════════
  // FETCH ALL METRICS IN PARALLEL
  // ═══════════════════════════════════════════════════════════════
  
  const [
    mrrMetrics,
    mrrHistory,
    ltvMetrics,
    churnMetrics
  ] = await Promise.all([
    getMRRMetrics(startDate, endDate),
    getMRRHistory(12),
    getLTVMetrics(startDate, endDate),
    getChurnMetrics(startDate, endDate)
  ]);
  
  // ARR metrics (depends on MRR)
  const arrMetrics = await getARRMetrics(mrrMetrics.currentMRR, mrrHistory);
  
  // Revenue forecast (depends on history)
  const forecast = await getRevenueForecast(mrrHistory);
  
  // ═══════════════════════════════════════════════════════════════
  // COHORT REVENUE ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  const cohorts = await getCohortRevenueAnalysis();
  
  // ═══════════════════════════════════════════════════════════════
  // UNIT ECONOMICS
  // ═══════════════════════════════════════════════════════════════
  
  const unitEconomics = await getUnitEconomics(
    mrrMetrics,
    ltvMetrics,
    arrMetrics
  );
  
  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  
  const customerCount = mrrMetrics.byPlan.reduce((sum, p) => sum + p.customers, 0);
  const arpu = customerCount > 0 ? mrrMetrics.currentMRR / customerCount : 0;
  
  const summary = {
    mrr: mrrMetrics.currentMRR,
    arr: arrMetrics.currentARR,
    mrrGrowthRate: mrrMetrics.mrrGrowthRate,
    customerCount,
    arpu,
    healthScore: calculateFinancialHealthScore(mrrMetrics, churnMetrics, unitEconomics)
  };
  
  // ═══════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════
  
  const insights = generateInsights(
    mrrMetrics,
    arrMetrics,
    ltvMetrics,
    churnMetrics,
    unitEconomics
  );
  
  // ═══════════════════════════════════════════════════════════════
  // TRENDS (Last 12 months)
  // ═══════════════════════════════════════════════════════════════
  
  const trends = mrrHistory.map((h, i) => ({
    month: h.month,
    mrr: h.mrr,
    arr: h.mrr * 12,
    customers: Math.floor(h.mrr / arpu) || 0, // Estimate
    churnRate: churnMetrics.customerChurnRate, // Simplified
    nrr: mrrMetrics.netRevenueRetention
  }));
  
  return {
    summary,
    mrr: mrrMetrics,
    arr: arrMetrics,
    ltv: ltvMetrics,
    churn: churnMetrics,
    forecast,
    cohorts,
    unitEconomics,
    periodStart: startDate,
    periodEnd: endDate,
    insights,
    trends
  };
}

// ═══════════════════════════════════════════════════════════════
// COHORT REVENUE ANALYSIS
// ═══════════════════════════════════════════════════════════════

async function getCohortRevenueAnalysis(): Promise<CohortRevenueAnalysis> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const cohorts = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);
    
    // Clientes que começaram neste mês
    const cohortSubs = await db.collection('subscriptions')
      .where('created', '>=', cohortDate)
      .where('created', '<=', cohortEnd)
      .get();
    
    if (cohortSubs.empty) continue;
    
    const initialCustomers = cohortSubs.size;
    let currentCustomers = 0;
    
    // Calcular revenue por mês
    const revenueByMonth: { [key: number]: number } = {};
    let totalRevenue = 0;
    
    for (const doc of cohortSubs.docs) {
      const data = doc.data();
      
      if (data.status === 'active') {
        currentCustomers++;
      }
      
      // Buscar invoices
      const invoices = await db.collection('invoices')
        .where('customerId', '==', data.customerId)
        .where('status', '==', 'paid')
        .get();
      
      invoices.forEach((inv: any) => {
        const invData = inv.data();
        const invDate = invData.created?.toDate();
        
        if (invDate) {
          const monthsSince = Math.floor(
            (invDate.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          
          const amount = invData.amountPaid / 100;
          revenueByMonth[monthsSince] = (revenueByMonth[monthsSince] || 0) + amount;
          totalRevenue += amount;
        }
      });
    }
    
    const ageInMonths = Math.floor(
      (now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    const avgRevenuePerCustomer = initialCustomers > 0 ? totalRevenue / initialCustomers : 0;
    const retentionRate = initialCustomers > 0 ? (currentCustomers / initialCustomers) * 100 : 0;
    
    // Projetar LTV
    const projectedLTV = ageInMonths > 0 
      ? avgRevenuePerCustomer * (24 / ageInMonths)
      : avgRevenuePerCustomer * 12;
    
    // CAC (mock)
    const avgCAC = 200;
    const paybackMonths = avgRevenuePerCustomer > 0 
      ? avgCAC / (avgRevenuePerCustomer / ageInMonths)
      : 0;
    
    const maturityStatus = ageInMonths < 3 ? 'immature' :
                          ageInMonths < 9 ? 'maturing' : 'mature';
    
    const dataQuality = ageInMonths < 2 ? 'low' :
                       ageInMonths < 6 ? 'medium' : 'high';
    
    cohorts.push({
      cohort: cohortDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
      cohortDate,
      initialCustomers,
      currentCustomers,
      revenue: {
        month0: revenueByMonth[0] || 0,
        month1: revenueByMonth[1] || 0,
        month2: revenueByMonth[2] || 0,
        month3: revenueByMonth[3] || 0,
        month6: revenueByMonth[6] || 0,
        month12: revenueByMonth[12] || 0,
        month24: revenueByMonth[24] || 0,
        total: totalRevenue
      },
      avgRevenuePerCustomer,
      projectedLTV,
      retentionRate,
      paybackMonths,
      ageInMonths,
      maturityStatus: maturityStatus as 'immature' | 'maturing' | 'mature',
      dataQuality: dataQuality as 'low' | 'medium' | 'high'
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // COHORT COMPARISON
  // ═══════════════════════════════════════════════════════════════
  
  const comparison = [];
  
  if (cohorts.length > 0) {
    // Best/Worst LTV
    const sortedByLTV = [...cohorts].sort((a, b) => b.projectedLTV - a.projectedLTV);
    comparison.push({
      metric: 'LTV' as const,
      bestCohort: sortedByLTV[0]?.cohort || '',
      worstCohort: sortedByLTV[sortedByLTV.length - 1]?.cohort || '',
      trend: 'improving' as const // TODO: Calculate real trend
    });
    
    // Best/Worst Retention
    const sortedByRetention = [...cohorts].sort((a, b) => b.retentionRate - a.retentionRate);
    comparison.push({
      metric: 'Retention' as const,
      bestCohort: sortedByRetention[0]?.cohort || '',
      worstCohort: sortedByRetention[sortedByRetention.length - 1]?.cohort || '',
      trend: 'stable' as const
    });
  }
  
  return {
    cohorts,
    comparison
  };
}

// ═══════════════════════════════════════════════════════════════
// UNIT ECONOMICS
// ═══════════════════════════════════════════════════════════════

async function getUnitEconomics(
  mrrMetrics: any,
  ltvMetrics: any,
  arrMetrics: any
): Promise<UnitEconomics> {
  // CAC (mock - integrar com dados reais)
  const cac = 200;
  const ltv = ltvMetrics.averageLTV;
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  
  // Gross Margin (80% típico para SaaS)
  const grossMargin = 80;
  const contributionMargin = 75;
  
  // Payback
  const monthlyRevenue = mrrMetrics.currentMRR / mrrMetrics.byPlan.reduce((s: number, p: any) => s + p.customers, 0);
  const paybackPeriod = monthlyRevenue > 0 ? cac / (monthlyRevenue * (grossMargin / 100)) : 0;
  const paybackPeriodTarget = 12; // months
  
  // Magic Number (efficiency)
  const netNewARR = mrrMetrics.netNewMRR * 12;
  const salesMarketingSpend = cac * mrrMetrics.byPlan.reduce((s: number, p: any) => s + p.customers, 0);
  const magicNumber = salesMarketingSpend > 0 ? netNewARR / salesMarketingSpend : 0;
  
  const cacPaybackMonths = paybackPeriod;
  
  // By channel (mock)
  const byChannel = [
    {
      channel: 'Organic',
      cac: 50,
      ltv: ltv * 1.2,
      ltvCacRatio: (ltv * 1.2) / 50,
      roi: 240,
      efficiency: 'excellent' as const
    },
    {
      channel: 'Paid Ads',
      cac: 300,
      ltv: ltv,
      ltvCacRatio: ltv / 300,
      roi: 150,
      efficiency: 'good' as const
    },
    {
      channel: 'Referral',
      cac: 25,
      ltv: ltv * 1.1,
      ltvCacRatio: (ltv * 1.1) / 25,
      roi: 440,
      efficiency: 'excellent' as const
    }
  ];
  
  // Burn metrics (mock)
  const burnRate = 50000; // R$/month
  const runway = 18; // months
  const burnMultiple = netNewARR > 0 ? burnRate / netNewARR : 0;
  
  return {
    cac,
    ltv,
    ltvCacRatio,
    paybackPeriod,
    paybackPeriodTarget,
    grossMargin,
    contributionMargin,
    magicNumber,
    cacPaybackMonths,
    byChannel,
    burnRate,
    runway,
    burnMultiple
  };
}

// ═══════════════════════════════════════════════════════════════
// HEALTH SCORE
// ═══════════════════════════════════════════════════════════════

function calculateFinancialHealthScore(
  mrrMetrics: any,
  churnMetrics: any,
  unitEconomics: any
): number {
  let score = 0;
  
  // MRR Growth (0-25 points)
  if (mrrMetrics.mrrGrowthRate > 15) score += 25;
  else if (mrrMetrics.mrrGrowthRate > 10) score += 20;
  else if (mrrMetrics.mrrGrowthRate > 5) score += 15;
  else if (mrrMetrics.mrrGrowthRate > 0) score += 10;
  
  // Quick Ratio (0-20 points)
  if (mrrMetrics.quickRatio > 4) score += 20;
  else if (mrrMetrics.quickRatio > 2) score += 15;
  else if (mrrMetrics.quickRatio > 1) score += 10;
  else score += 5;
  
  // Churn Rate (0-20 points)
  if (churnMetrics.grossRevenueChurnRate < 3) score += 20;
  else if (churnMetrics.grossRevenueChurnRate < 5) score += 15;
  else if (churnMetrics.grossRevenueChurnRate < 7) score += 10;
  else score += 5;
  
  // LTV:CAC Ratio (0-20 points)
  if (unitEconomics.ltvCacRatio > 5) score += 20;
  else if (unitEconomics.ltvCacRatio > 3) score += 15;
  else if (unitEconomics.ltvCacRatio > 2) score += 10;
  else score += 5;
  
  // NRR (0-15 points)
  if (mrrMetrics.netRevenueRetention > 110) score += 15;
  else if (mrrMetrics.netRevenueRetention > 100) score += 12;
  else if (mrrMetrics.netRevenueRetention > 90) score += 8;
  else score += 3;
  
  return score;
}

// ═══════════════════════════════════════════════════════════════
// INSIGHTS GENERATION
// ═══════════════════════════════════════════════════════════════

function generateInsights(
  mrrMetrics: any,
  arrMetrics: any,
  ltvMetrics: any,
  churnMetrics: any,
  unitEconomics: any
) {
  const insights = [];
  
  // MRR Growth Insight
  if (mrrMetrics.mrrGrowthRate > 15) {
    insights.push({
      type: 'success' as const,
      category: 'mrr' as const,
      title: 'Crescimento Excepcional de MRR',
      description: `MRR cresceu ${mrrMetrics.mrrGrowthRate.toFixed(1)}% no período - bem acima da média do mercado (10-15%)`,
      impact: 'high' as const,
      recommendation: 'Manter estratégias atuais e documentar os fatores de sucesso para replicação',
      estimatedValue: mrrMetrics.mrrGrowthAbsolute
    });
  } else if (mrrMetrics.mrrGrowthRate < 5) {
    insights.push({
      type: 'warning' as const,
      category: 'mrr' as const,
      title: 'Crescimento de MRR Abaixo do Esperado',
      description: `MRR cresceu apenas ${mrrMetrics.mrrGrowthRate.toFixed(1)}% - abaixo da meta (10%+)`,
      impact: 'high' as const,
      recommendation: 'Revisar estratégias de aquisição e retenção. Considerar campanhas de reativação.',
      estimatedValue: (mrrMetrics.currentMRR * 0.05) // 5% potential gain
    });
  }
  
  // Quick Ratio Insight
  if (mrrMetrics.quickRatio > 4) {
    insights.push({
      type: 'success' as const,
      category: 'mrr' as const,
      title: 'Quick Ratio Excelente',
      description: `Quick Ratio de ${mrrMetrics.quickRatio.toFixed(1)} indica crescimento saudável e eficiente`,
      impact: 'medium' as const,
      recommendation: 'Empresa em posição forte para escalar investimentos em aquisição'
    });
  } else if (mrrMetrics.quickRatio < 2) {
    insights.push({
      type: 'critical' as const,
      category: 'mrr' as const,
      title: 'Quick Ratio Crítico',
      description: `Quick Ratio de ${mrrMetrics.quickRatio.toFixed(1)} indica churn alto demais para o crescimento`,
      impact: 'high' as const,
      recommendation: 'URGENTE: Focar em redução de churn antes de escalar aquisição',
      estimatedValue: mrrMetrics.churnedMRR * 12
    });
  }
  
  // Churn Insight
  if (churnMetrics.grossRevenueChurnRate > 7) {
    insights.push({
      type: 'critical' as const,
      category: 'churn' as const,
      title: 'Churn Rate Crítico',
      description: `Churn de ${churnMetrics.grossRevenueChurnRate.toFixed(1)}% está muito acima do aceitável (<5%)`,
      impact: 'high' as const,
      recommendation: 'Implementar programa de retenção urgente. Analisar motivos de cancelamento.',
      estimatedValue: churnMetrics.voluntaryChurn.mrr * 12
    });
  }
  
  // LTV:CAC Insight
  if (unitEconomics.ltvCacRatio < 3) {
    insights.push({
      type: 'warning' as const,
      category: 'unit_economics' as const,
      title: 'LTV:CAC Ratio Baixo',
      description: `Ratio de ${unitEconomics.ltvCacRatio.toFixed(1)} indica custos de aquisição muito altos`,
      impact: 'high' as const,
      recommendation: 'Otimizar canais de aquisição ou aumentar preços/LTV',
      estimatedValue: unitEconomics.cac * 100
    });
  } else if (unitEconomics.ltvCacRatio > 5) {
    insights.push({
      type: 'opportunity' as const,
      category: 'unit_economics' as const,
      title: 'Oportunidade de Acelerar Crescimento',
      description: `LTV:CAC de ${unitEconomics.ltvCacRatio.toFixed(1)} permite investir mais em aquisição`,
      impact: 'high' as const,
      recommendation: 'Considerar aumentar budget de marketing em 50-100%',
      estimatedValue: mrrMetrics.currentMRR * 0.5
    });
  }
  
  // Rule of 40
  if (arrMetrics.ruleOf40Score > 40) {
    insights.push({
      type: 'success' as const,
      category: 'arr' as const,
      title: 'Rule of 40 Atingida',
      description: `Score de ${arrMetrics.ruleOf40Score.toFixed(0)} indica negócio saudável e sustentável`,
      impact: 'medium' as const,
      recommendation: 'Empresa em posição forte para investimentos e expansão'
    });
  }
  
  // Involuntary Churn
  if (churnMetrics.involuntaryChurn.recoverable > 5) {
    insights.push({
      type: 'opportunity' as const,
      category: 'churn' as const,
      title: 'Recuperação de Churn Involuntário',
      description: `${churnMetrics.involuntaryChurn.recoverable} clientes recuperáveis (falhas de pagamento)`,
      impact: 'medium' as const,
      recommendation: 'Implementar dunning automático e retry de pagamentos',
      estimatedValue: churnMetrics.involuntaryChurn.mrr * 0.4 * 12
    });
  }
  
  return insights;
}
