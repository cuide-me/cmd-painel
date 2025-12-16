/**
 * MRR/ARR Tracking Service
 * Calcula Monthly Recurring Revenue e Annual Recurring Revenue com breakdown detalhado
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { MRRMetrics, ARRMetrics } from './types';

// ═══════════════════════════════════════════════════════════════
// MRR CALCULATION
// ═══════════════════════════════════════════════════════════════

export async function getMRRMetrics(
  startDate: Date,
  endDate: Date
): Promise<MRRMetrics> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // Get current month subscriptions (active)
  const currentMonth = new Date(endDate);
  const previousMonth = new Date(currentMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  
  // Buscar assinaturas ativas
  const subscriptionsRef = db.collection('subscriptions');
  
  // Current MRR
  const currentSubs = await subscriptionsRef
    .where('status', '==', 'active')
    .where('currentPeriodEnd', '>', currentMonth)
    .get();
  
  // Previous MRR
  const previousSubs = await subscriptionsRef
    .where('status', '==', 'active')
    .where('currentPeriodEnd', '>', previousMonth)
    .where('currentPeriodEnd', '<=', currentMonth)
    .get();
  
  // Calculate current MRR
  let currentMRR = 0;
  const currentSubsMap = new Map();
  const planBreakdown = new Map<string, { mrr: number; customers: number; previousMrr: number }>();
  
  currentSubs.forEach((doc: any) => {
    const data = doc.data();
    const amount = normalizeToMonthlyAmount(data.amount, data.interval);
    currentMRR += amount;
    currentSubsMap.set(data.customerId, { amount, plan: data.plan, created: data.created });
    
    // Por plano
    const existing = planBreakdown.get(data.plan) || { mrr: 0, customers: 0, previousMrr: 0 };
    existing.mrr += amount;
    existing.customers += 1;
    planBreakdown.set(data.plan, existing);
  });
  
  // Calculate previous MRR
  let previousMRR = 0;
  const previousSubsMap = new Map();
  
  previousSubs.forEach((doc: any) => {
    const data = doc.data();
    const amount = normalizeToMonthlyAmount(data.amount, data.interval);
    previousMRR += amount;
    previousSubsMap.set(data.customerId, { amount, plan: data.plan });
    
    // Adicionar ao breakdown de planos (previous)
    const existing = planBreakdown.get(data.plan);
    if (existing) {
      existing.previousMrr += amount;
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // MRR MOVEMENT ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  let newMRR = 0;
  let expansionMRR = 0;
  let contractionMRR = 0;
  let churnedMRR = 0;
  let reactivationMRR = 0;
  
  // Analyze customer movements
  currentSubsMap.forEach((current, customerId) => {
    const previous = previousSubsMap.get(customerId);
    
    if (!previous) {
      // Nova assinatura
      // Verificar se é reativação (já foi cliente antes)
      const wasCustomerBefore = false; // TODO: check historical subscriptions
      if (wasCustomerBefore) {
        reactivationMRR += current.amount;
      } else {
        newMRR += current.amount;
      }
    } else {
      // Cliente existente
      const diff = current.amount - previous.amount;
      if (diff > 0) {
        expansionMRR += diff; // Upgrade
      } else if (diff < 0) {
        contractionMRR += Math.abs(diff); // Downgrade
      }
    }
  });
  
  // Clientes que cancelaram
  previousSubsMap.forEach((previous, customerId) => {
    if (!currentSubsMap.has(customerId)) {
      churnedMRR += previous.amount;
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // CALCULATE METRICS
  // ═══════════════════════════════════════════════════════════════
  
  const mrrGrowthAbsolute = currentMRR - previousMRR;
  const mrrGrowthRate = previousMRR > 0 ? (mrrGrowthAbsolute / previousMRR) * 100 : 0;
  
  const netNewMRR = newMRR + expansionMRR - contractionMRR - churnedMRR;
  
  // Net Revenue Retention (NRR)
  const nrr = previousMRR > 0
    ? ((previousMRR + expansionMRR - contractionMRR - churnedMRR) / previousMRR) * 100
    : 100;
  
  // Gross Revenue Retention (GRR)
  const grr = previousMRR > 0
    ? ((previousMRR - churnedMRR - contractionMRR) / previousMRR) * 100
    : 100;
  
  // Quick Ratio (growth efficiency)
  const quickRatio = (contractionMRR + churnedMRR) > 0
    ? (newMRR + expansionMRR) / (contractionMRR + churnedMRR)
    : 10; // Se não há churn, ratio é muito alto
  
  // ═══════════════════════════════════════════════════════════════
  // BY PLAN BREAKDOWN
  // ═══════════════════════════════════════════════════════════════
  
  const byPlan = Array.from(planBreakdown.entries()).map(([planName, data]) => {
    const arpu = data.customers > 0 ? data.mrr / data.customers : 0;
    const growth = data.previousMrr > 0 
      ? ((data.mrr - data.previousMrr) / data.previousMrr) * 100
      : 0;
    
    return {
      planName,
      mrr: data.mrr,
      customers: data.customers,
      arpu,
      growth
    };
  }).sort((a, b) => b.mrr - a.mrr);
  
  // ═══════════════════════════════════════════════════════════════
  // BY CUSTOMER TYPE
  // ═══════════════════════════════════════════════════════════════
  
  // TODO: Integrar com dados de tipo de cliente
  const byCustomerType = [
    {
      type: 'professional' as const,
      mrr: currentMRR * 0.6, // Mock - substituir por dados reais
      percentage: 60,
      growth: mrrGrowthRate * 1.2
    },
    {
      type: 'family' as const,
      mrr: currentMRR * 0.35,
      percentage: 35,
      growth: mrrGrowthRate * 0.8
    },
    {
      type: 'enterprise' as const,
      mrr: currentMRR * 0.05,
      percentage: 5,
      growth: mrrGrowthRate * 1.5
    }
  ];
  
  return {
    currentMRR,
    previousMRR,
    mrrGrowthRate,
    mrrGrowthAbsolute,
    
    newMRR,
    expansionMRR,
    contractionMRR,
    churnedMRR,
    reactivationMRR,
    
    netNewMRR,
    netRevenueRetention: nrr,
    grossRevenueRetention: grr,
    quickRatio,
    
    byPlan,
    byCustomerType
  };
}

// ═══════════════════════════════════════════════════════════════
// ARR CALCULATION
// ═══════════════════════════════════════════════════════════════

export async function getARRMetrics(
  currentMRR: number,
  historicalData?: { month: string; mrr: number }[]
): Promise<ARRMetrics> {
  // Current ARR (simples)
  const currentARR = currentMRR * 12;
  
  // Projected ARR (baseado em tendência)
  const projectedARR = await calculateProjectedARR(currentMRR, historicalData);
  
  // YoY Growth (se temos dados históricos)
  let arrGrowthRate = 0;
  if (historicalData && historicalData.length >= 12) {
    const lastYearMRR = historicalData[historicalData.length - 12]?.mrr || 0;
    const lastYearARR = lastYearMRR * 12;
    arrGrowthRate = lastYearARR > 0 ? ((currentARR - lastYearARR) / lastYearARR) * 100 : 0;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // RULE OF 40
  // ═══════════════════════════════════════════════════════════════
  
  // TODO: Integrar com dados reais de custos
  const profitMargin = 25; // % - Mock (Revenue - Costs) / Revenue
  const growthRate = arrGrowthRate;
  const ruleOf40Score = growthRate + profitMargin;
  
  // ═══════════════════════════════════════════════════════════════
  // FORECASTING (30/60/90/365 days)
  // ═══════════════════════════════════════════════════════════════
  
  const forecasts = await forecastARR(currentMRR, historicalData);
  
  return {
    currentARR,
    projectedARR,
    arrGrowthRate,
    
    ruleOf40Score,
    growthRate,
    profitMargin,
    
    arr30Days: forecasts.arr30,
    arr60Days: forecasts.arr60,
    arr90Days: forecasts.arr90,
    arr12Months: forecasts.arr365,
    
    forecastConfidence: forecasts.confidence,
    forecastMethod: forecasts.method
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function normalizeToMonthlyAmount(amount: number, interval: 'month' | 'year' | 'week'): number {
  // Convert cents to reais and normalize to monthly
  const amountInReais = amount / 100;
  
  switch (interval) {
    case 'year':
      return amountInReais / 12;
    case 'week':
      return (amountInReais * 52) / 12;
    case 'month':
    default:
      return amountInReais;
  }
}

async function calculateProjectedARR(
  currentMRR: number,
  historicalData?: { month: string; mrr: number }[]
): Promise<number> {
  if (!historicalData || historicalData.length < 3) {
    // Sem histórico suficiente, usar MRR atual
    return currentMRR * 12;
  }
  
  // Calcular crescimento médio dos últimos 3 meses
  const recent = historicalData.slice(-3);
  const growthRates: number[] = [];
  
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1].mrr;
    const curr = recent[i].mrr;
    if (prev > 0) {
      growthRates.push((curr - prev) / prev);
    }
  }
  
  const avgGrowthRate = growthRates.length > 0
    ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
    : 0;
  
  // Projetar MRR para 12 meses com crescimento médio
  let projectedMRR = currentMRR;
  for (let i = 0; i < 12; i++) {
    projectedMRR = projectedMRR * (1 + avgGrowthRate);
  }
  
  return projectedMRR * 12;
}

async function forecastARR(
  currentMRR: number,
  historicalData?: { month: string; mrr: number }[]
): Promise<{
  arr30: number;
  arr60: number;
  arr90: number;
  arr365: number;
  confidence: number;
  method: 'linear' | 'exponential' | 'moving_average';
}> {
  if (!historicalData || historicalData.length < 3) {
    // Forecast simples (linear baseado em MRR atual)
    return {
      arr30: currentMRR * 12,
      arr60: currentMRR * 12,
      arr90: currentMRR * 12,
      arr365: currentMRR * 12,
      confidence: 50,
      method: 'linear'
    };
  }
  
  // Moving average method (últimos 3 meses)
  const recent = historicalData.slice(-3);
  const avgMRR = recent.reduce((sum, d) => sum + d.mrr, 0) / recent.length;
  
  // Calcular tendência
  const growthRates: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prev = historicalData[i - 1].mrr;
    const curr = historicalData[i].mrr;
    if (prev > 0) {
      growthRates.push((curr - prev) / prev);
    }
  }
  
  const avgMonthlyGrowth = growthRates.length > 0
    ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
    : 0;
  
  // Projetar
  const mrr1Month = currentMRR * (1 + avgMonthlyGrowth);
  const mrr2Months = mrr1Month * (1 + avgMonthlyGrowth);
  const mrr3Months = mrr2Months * (1 + avgMonthlyGrowth);
  
  let mrr12Months = currentMRR;
  for (let i = 0; i < 12; i++) {
    mrr12Months = mrr12Months * (1 + avgMonthlyGrowth);
  }
  
  // Confiança baseada em consistência do histórico
  const variance = calculateVariance(growthRates);
  const confidence = Math.max(50, Math.min(95, 100 - (variance * 100)));
  
  return {
    arr30: mrr1Month * 12,
    arr60: mrr2Months * 12,
    arr90: mrr3Months * 12,
    arr365: mrr12Months * 12,
    confidence,
    method: 'moving_average'
  };
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  
  return Math.sqrt(variance); // Standard deviation
}

// ═══════════════════════════════════════════════════════════════
// HISTORICAL DATA
// ═══════════════════════════════════════════════════════════════

export async function getMRRHistory(months: number = 12): Promise<{ month: string; mrr: number }[]> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  const history: { month: string; mrr: number }[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setMonth(targetDate.getMonth() - i);
    
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    
    // Buscar assinaturas ativas naquele mês
    const subs = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .where('currentPeriodEnd', '>', monthStart)
      .where('currentPeriodEnd', '<=', monthEnd)
      .get();
    
    let monthMRR = 0;
    subs.forEach((doc: any) => {
      const data = doc.data();
      monthMRR += normalizeToMonthlyAmount(data.amount, data.interval);
    });
    
    history.push({
      month: targetDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
      mrr: monthMRR
    });
  }
  
  return history;
}
