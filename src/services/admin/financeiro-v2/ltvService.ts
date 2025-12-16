/**
 * LTV (Lifetime Value) Service
 * 4 métodos de cálculo: Histórico, Preditivo, Cohort, e Tradicional
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { LTVMetrics } from './types';

// ═══════════════════════════════════════════════════════════════
// LTV CALCULATION
// ═══════════════════════════════════════════════════════════════

export async function getLTVMetrics(
  startDate: Date,
  endDate: Date
): Promise<LTVMetrics> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // ═══════════════════════════════════════════════════════════════
  // MÉTODO 1: HISTÓRICO (clientes que já cancelaram)
  // ═══════════════════════════════════════════════════════════════
  
  const historicalLTV = await calculateHistoricalLTV(db);
  
  // ═══════════════════════════════════════════════════════════════
  // MÉTODO 2: PREDITIVO (todos os clientes)
  // ═══════════════════════════════════════════════════════════════
  
  const predictiveLTV = await calculatePredictiveLTV(db);
  
  // ═══════════════════════════════════════════════════════════════
  // BY SEGMENT
  // ═══════════════════════════════════════════════════════════════
  
  const bySegment = await calculateLTVBySegment(db);
  
  // ═══════════════════════════════════════════════════════════════
  // COHORT ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  const cohorts = await calculateCohortLTV(db);
  
  // ═══════════════════════════════════════════════════════════════
  // PREDICTIONS
  // ═══════════════════════════════════════════════════════════════
  
  const predictions = await predictFutureLTV(db, bySegment);
  
  return {
    averageLTV: predictiveLTV.average,
    medianLTV: predictiveLTV.median,
    bySegment,
    cohorts,
    predictions
  };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 1: HISTORICAL LTV
// Baseado apenas em clientes que já cancelaram
// ═══════════════════════════════════════════════════════════════

async function calculateHistoricalLTV(db: FirebaseFirestore.Firestore) {
  // Buscar assinaturas canceladas
  const canceledSubs = await db.collection('subscriptions')
    .where('status', '==', 'canceled')
    .get();
  
  const ltvValues: number[] = [];
  
  for (const doc of canceledSubs.docs) {
    const data = doc.data();
    
    // Calcular tempo de vida
    const created = data.created?.toDate();
    const canceled = data.canceledAt?.toDate();
    
    if (!created || !canceled) continue;
    
    const lifespanMs = canceled.getTime() - created.getTime();
    const lifespanMonths = lifespanMs / (1000 * 60 * 60 * 24 * 30);
    
    // Buscar todas as invoices pagas deste cliente
    const invoices = await db.collection('invoices')
      .where('customerId', '==', data.customerId)
      .where('status', '==', 'paid')
      .get();
    
    const totalRevenue = invoices.docs.reduce((sum, inv) => {
      return sum + (inv.data().amountPaid / 100); // cents to reais
    }, 0);
    
    ltvValues.push(totalRevenue);
  }
  
  return {
    average: ltvValues.length > 0 ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length : 0,
    median: calculateMedian(ltvValues),
    sampleSize: ltvValues.length
  };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 2: PREDICTIVE LTV
// Fórmula: ARPU × Gross Margin / Churn Rate
// ═══════════════════════════════════════════════════════════════

async function calculatePredictiveLTV(db: FirebaseFirestore.Firestore) {
  // Buscar assinaturas ativas
  const activeSubs = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .get();
  
  if (activeSubs.empty) {
    return { average: 0, median: 0, sampleSize: 0 };
  }
  
  // Calcular ARPU (Average Revenue Per User)
  let totalMonthlyRevenue = 0;
  activeSubs.forEach((doc: any) => {
    const data = doc.data();
    const monthlyAmount = normalizeToMonthly(data.amount, data.interval);
    totalMonthlyRevenue += monthlyAmount;
  });
  
  const arpu = totalMonthlyRevenue / activeSubs.size;
  
  // Calcular Churn Rate (últimos 3 meses)
  const churnRate = await calculateChurnRate(db, 3);
  
  // Gross Margin (assumir 80% para SaaS - ou buscar de configuração)
  const grossMargin = 0.80;
  
  // LTV = ARPU × Gross Margin / Churn Rate
  const avgLTV = churnRate > 0 ? (arpu * grossMargin) / (churnRate / 100) : arpu * 24; // Default 24 months
  
  return {
    average: avgLTV,
    median: avgLTV, // Para predictive, average = median
    sampleSize: activeSubs.size
  };
}

// ═══════════════════════════════════════════════════════════════
// BY SEGMENT
// ═══════════════════════════════════════════════════════════════

async function calculateLTVBySegment(db: FirebaseFirestore.Firestore) {
  const segments = ['basic', 'pro', 'premium', 'enterprise'];
  const results = [];
  
  for (const segment of segments) {
    // Buscar clientes deste segmento
    const subs = await db.collection('subscriptions')
      .where('plan', '==', segment)
      .where('status', '==', 'active')
      .get();
    
    if (subs.empty) continue;
    
    // Calcular métricas
    let totalMonthlyRevenue = 0;
    let totalLifespanMonths = 0;
    let customerCount = 0;
    
    for (const doc of subs.docs) {
      const data = doc.data();
      const monthlyAmount = normalizeToMonthly(data.amount, data.interval);
      totalMonthlyRevenue += monthlyAmount;
      
      // Lifespan
      const created = data.created?.toDate();
      if (created) {
        const lifespanMs = Date.now() - created.getTime();
        const lifespanMonths = lifespanMs / (1000 * 60 * 60 * 24 * 30);
        totalLifespanMonths += lifespanMonths;
      }
      
      customerCount++;
    }
    
    const avgMonthlyRevenue = totalMonthlyRevenue / customerCount;
    const avgCustomerLifespan = totalLifespanMonths / customerCount;
    const avgGrossMargin = 0.80; // 80% para SaaS
    
    // Churn rate específico do segmento
    const churnRate = await calculateSegmentChurnRate(db, segment, 3);
    
    // LTV = Avg Monthly Revenue × Avg Lifespan × Gross Margin
    const ltv = avgMonthlyRevenue * avgCustomerLifespan * avgGrossMargin;
    
    // CAC (mock - integrar com dados reais de marketing)
    const cac = segment === 'basic' ? 150 : 
                segment === 'pro' ? 300 :
                segment === 'premium' ? 600 : 1200;
    
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const paybackPeriod = avgMonthlyRevenue > 0 ? cac / (avgMonthlyRevenue * avgGrossMargin) : 0;
    
    // Confiança baseada no tamanho da amostra
    const confidence = Math.min(95, 50 + (customerCount / 10));
    
    results.push({
      segment,
      ltv,
      calculationMethod: 'predictive' as const,
      avgMonthlyRevenue,
      avgCustomerLifespan,
      avgGrossMargin,
      churnRate,
      cac,
      ltvCacRatio,
      paybackPeriod,
      confidence
    });
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════
// COHORT LTV
// Agrupar por mês de signup e calcular LTV ao longo do tempo
// ═══════════════════════════════════════════════════════════════

async function calculateCohortLTV(db: FirebaseFirestore.Firestore) {
  const cohorts = [];
  const now = new Date();
  
  // Últimos 12 meses de cohorts
  for (let i = 11; i >= 0; i--) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);
    
    // Clientes que começaram neste mês
    const cohortSubs = await db.collection('subscriptions')
      .where('created', '>=', cohortDate)
      .where('created', '<=', cohortEnd)
      .get();
    
    if (cohortSubs.empty) continue;
    
    const cohortSize = cohortSubs.size;
    let totalRevenue = 0;
    let activeCount = 0;
    
    // Revenue por período
    const revenueByMonth: { [key: number]: number } = {};
    
    for (const doc of cohortSubs.docs) {
      const data = doc.data();
      
      // Buscar invoices
      const invoices = await db.collection('invoices')
        .where('customerId', '==', data.customerId)
        .where('status', '==', 'paid')
        .get();
      
      invoices.forEach((inv: any) => {
        const invData = inv.data();
        const invDate = invData.created?.toDate();
        if (invDate) {
          const monthsSinceCohort = Math.floor(
            (invDate.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          
          revenueByMonth[monthsSinceCohort] = (revenueByMonth[monthsSinceCohort] || 0) 
            + (invData.amountPaid / 100);
        }
        
        totalRevenue += invData.amountPaid / 100;
      });
      
      if (data.status === 'active') {
        activeCount++;
      }
    }
    
    const avgRevenuePerCustomer = cohortSize > 0 ? totalRevenue / cohortSize : 0;
    const retentionRate = cohortSize > 0 ? (activeCount / cohortSize) * 100 : 0;
    
    // Projetar LTV baseado em tendência
    const ageInMonths = Math.floor((now.getTime() - cohortDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const projectedLifetimeLTV = avgRevenuePerCustomer * (24 / Math.max(1, ageInMonths));
    
    cohorts.push({
      cohort: cohortDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
      size: cohortSize,
      
      ltv1Month: revenueByMonth[1] || 0,
      ltv3Months: revenueByMonth[3] || 0,
      ltv6Months: revenueByMonth[6] || 0,
      ltv12Months: revenueByMonth[12] || 0,
      projectedLifetimeLTV,
      
      totalRevenue,
      avgRevenuePerCustomer,
      retentionRate
    });
  }
  
  return cohorts;
}

// ═══════════════════════════════════════════════════════════════
// PREDICTIONS
// ═══════════════════════════════════════════════════════════════

async function predictFutureLTV(
  db: FirebaseFirestore.Firestore,
  currentSegments: any[]
) {
  const predictions = [];
  
  for (const segment of currentSegments) {
    // Buscar histórico de LTV para este segmento (últimos 6 meses)
    // TODO: Implementar storage de métricas históricas
    
    // Mock: baseado em tendência atual
    const currentLTV = segment.ltv;
    const growthRate = segment.churnRate < 5 ? 1.15 : 
                       segment.churnRate < 10 ? 1.05 : 0.95;
    
    const predicted6MonthLTV = currentLTV * growthRate;
    const predicted12MonthLTV = currentLTV * Math.pow(growthRate, 2);
    
    const growthTrajectory = growthRate > 1.1 ? 'accelerating' :
                            growthRate > 0.95 ? 'steady' : 'declining';
    
    predictions.push({
      segment: segment.segment,
      currentLTV,
      predicted6MonthLTV,
      predicted12MonthLTV,
      growthTrajectory: growthTrajectory as 'accelerating' | 'steady' | 'declining'
    });
  }
  
  return predictions;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function normalizeToMonthly(amount: number, interval: 'month' | 'year' | 'week'): number {
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

async function calculateChurnRate(
  db: FirebaseFirestore.Firestore,
  months: number
): Promise<number> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);
  
  // Clientes ativos no início do período
  const initialSubs = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .where('created', '<', startDate)
    .get();
  
  // Clientes que cancelaram durante o período
  const churned = await db.collection('subscriptions')
    .where('status', '==', 'canceled')
    .where('canceledAt', '>=', startDate)
    .where('canceledAt', '<=', now)
    .get();
  
  const churnRate = initialSubs.size > 0 
    ? (churned.size / initialSubs.size) * 100 / months // Monthly churn rate
    : 0;
  
  return churnRate;
}

async function calculateSegmentChurnRate(
  db: FirebaseFirestore.Firestore,
  segment: string,
  months: number
): Promise<number> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);
  
  // Clientes ativos deste segmento no início
  const initialSubs = await db.collection('subscriptions')
    .where('plan', '==', segment)
    .where('status', '==', 'active')
    .where('created', '<', startDate)
    .get();
  
  // Cancelamentos
  const churned = await db.collection('subscriptions')
    .where('plan', '==', segment)
    .where('status', '==', 'canceled')
    .where('canceledAt', '>=', startDate)
    .where('canceledAt', '<=', now)
    .get();
  
  const churnRate = initialSubs.size > 0 
    ? (churned.size / initialSubs.size) * 100 / months
    : 0;
  
  return churnRate;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

// ═══════════════════════════════════════════════════════════════
// CAC (Customer Acquisition Cost) Integration
// ═══════════════════════════════════════════════════════════════

export async function calculateCAC(
  db: FirebaseFirestore.Firestore,
  startDate: Date,
  endDate: Date,
  channel?: string
): Promise<number> {
  // TODO: Integrar com dados de marketing spend
  // Por enquanto retornar valores mock baseados em channel
  
  if (channel === 'organic') return 50;
  if (channel === 'paid') return 300;
  if (channel === 'referral') return 25;
  
  return 150; // Average
}
