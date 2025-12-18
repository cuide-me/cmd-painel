/**
 * TORRE DE CONTROLE V3 - KPIs SERVICE
 * Agrega KPIs de Stripe + Firebase + GA4
 * NÃO modifica lógica existente, apenas consolida dados
 */

import { getStripeClient } from '@/lib/server/stripe';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { fetchGoogleAnalyticsMetrics } from '@/services/admin/analyticsService';
import { toDate } from '@/lib/dateUtils';
import type { 
  TorreV3KPIs, 
  FinancialKPIs, 
  OperationalKPIs, 
  MarketplaceKPIs,
  GrowthKPIs,
  KPIValue 
} from './types';

// ═══════════════════════════════════════════════════════════════
// MAIN KPI AGGREGATOR
// ═══════════════════════════════════════════════════════════════

export async function getTorreV3KPIs(period: 'week' | 'month' | 'quarter' = 'month'): Promise<TorreV3KPIs> {
  console.log('[Torre V3 KPIs] Iniciando agregação de KPIs...');
  
  const startTime = Date.now();
  
  try {
    // Executar agregações em paralelo
    const [financial, operational, marketplace, growth] = await Promise.all([
      getFinancialKPIs(period),
      getOperationalKPIs(period),
      getMarketplaceKPIs(period),
      getGrowthKPIs(period)
    ]);
    
    const elapsed = Date.now() - startTime;
    console.log(`[Torre V3 KPIs] ✅ Agregação completa em ${elapsed}ms`);
    
    return { financial, operational, marketplace, growth };
  } catch (error) {
    console.error('[Torre V3 KPIs] ❌ Erro:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// FINANCIAL KPIs (STRIPE)
// ═══════════════════════════════════════════════════════════════

async function getFinancialKPIs(period: string): Promise<FinancialKPIs> {
  const stripe = getStripeClient();
  
  try {
    // Buscar assinaturas ativas
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });
    
    // Calcular MRR atual
    let currentMRR = 0;
    activeSubscriptions.data.forEach(sub => {
      const amount = sub.items.data[0]?.price.unit_amount || 0;
      const interval = sub.items.data[0]?.price.recurring?.interval || 'month';
      
      let mrr = amount / 100; // Converter centavos para reais
      if (interval === 'year') mrr = mrr / 12;
      
      currentMRR += mrr;
    });
    
    // Buscar cancelamentos do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTimestamp = Math.floor(startOfMonth.getTime() / 1000);
    
    const canceledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
    });
    
    const canceledThisMonth = canceledSubs.data.filter(
      sub => sub.canceled_at && sub.canceled_at >= startTimestamp
    ).length;
    
    // Calcular Churn Rate
    const totalCustomers = activeSubscriptions.data.length + canceledThisMonth;
    const churnRate = totalCustomers > 0 ? (canceledThisMonth / totalCustomers) * 100 : 0;
    
    // Calcular ARPU
    const arpu = totalCustomers > 0 ? currentMRR / totalCustomers : 0;
    
    // LTV simplificado (assumir 12 meses de retenção média)
    const avgLifetimeMonths = churnRate > 0 ? 1 / (churnRate / 100) : 12;
    const ltv = arpu * avgLifetimeMonths;
    
    // Buscar payouts para Burn Rate
    const payouts = await stripe.payouts.list({
      created: { gte: startTimestamp },
      limit: 100,
    });
    
    const burnRate = payouts.data.reduce((sum, payout) => sum + (payout.amount / 100), 0);
    const netBurn = currentMRR - burnRate;
    
    // Buscar balance para Runway
    const balance = await stripe.balance.retrieve();
    const totalAvailable = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const totalPending = balance.pending.reduce((sum, b) => sum + b.amount, 0);
    const cashBalance = (totalAvailable + totalPending) / 100;
    
    const runway = netBurn > 0 ? 999 : (burnRate > 0 ? cashBalance / burnRate : 999);
    
    // MRR Growth (estimativa - seria necessário histórico)
    const previousMRR = currentMRR * 0.95; // Placeholder
    const mrrGrowth = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;
    
    return {
      mrr: createKPIValue(currentMRR, previousMRR, 'BRL', currentMRR > 10000 ? 'good' : 'warning'),
      arr: createKPIValue(currentMRR * 12, previousMRR * 12, 'BRL', currentMRR * 12 > 120000 ? 'good' : 'warning'),
      mrrGrowth: createKPIValue(mrrGrowth, 0, '%', mrrGrowth > 5 ? 'good' : mrrGrowth > 0 ? 'warning' : 'critical'),
      
      arpu: createKPIValue(arpu, arpu * 0.95, 'BRL', arpu > 100 ? 'good' : 'warning'),
      ltv: createKPIValue(ltv, ltv * 0.95, 'BRL', ltv > 1000 ? 'good' : 'warning'),
      churnRate: createKPIValue(churnRate, churnRate * 1.1, '%', churnRate < 5 ? 'good' : churnRate < 10 ? 'warning' : 'critical'),
      
      burnRate: createKPIValue(burnRate, burnRate * 1.05, 'BRL', burnRate < currentMRR ? 'good' : 'critical'),
      netBurn: createKPIValue(netBurn, 0, 'BRL', netBurn > 0 ? 'good' : 'critical'),
      runway: createKPIValue(runway, runway, 'months', runway > 12 ? 'good' : runway > 6 ? 'warning' : 'critical'),
      
      totalSubscriptions: totalCustomers,
      activeSubscriptions: activeSubscriptions.data.length,
      canceledThisMonth,
      cashBalance,
    };
  } catch (error) {
    console.error('[Financial KPIs] Erro:', error);
    return getEmptyFinancialKPIs();
  }
}

// ═══════════════════════════════════════════════════════════════
// OPERATIONAL KPIs (FIREBASE)
// ═══════════════════════════════════════════════════════════════

async function getOperationalKPIs(period: string): Promise<OperationalKPIs> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  try {
    // Buscar jobs do período
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    const jobsSnap = await db.collection('jobs')
      .where('createdAt', '>=', startDate)
      .limit(500)
      .get();
    
    let totalJobs = 0;
    let acceptedJobs = 0;
    let completedJobs = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    jobsSnap.forEach(doc => {
      const data = doc.data();
      totalJobs++;
      
      if (data.status === 'accepted' || data.status === 'completed') {
        acceptedJobs++;
        
        // Calcular tempo de resposta
        const createdAt = toDate(data.createdAt);
        const acceptedAt = toDate(data.acceptedAt);
        
        if (createdAt && acceptedAt) {
          const responseTime = (acceptedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // Horas
          totalResponseTime += responseTime;
          responseTimeCount++;
        }
      }
      
      if (data.status === 'completed') {
        completedJobs++;
      }
    });
    
    const acceptanceRate = totalJobs > 0 ? (acceptedJobs / totalJobs) * 100 : 0;
    const completionRate = acceptedJobs > 0 ? (completedJobs / acceptedJobs) * 100 : 0;
    const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    // Buscar ratings
    const ratingsSnap = await db.collection('ratings')
      .where('createdAt', '>=', startDate)
      .limit(500)
      .get();
    
    let totalRating = 0;
    let ratingCount = 0;
    
    ratingsSnap.forEach(doc => {
      const data = doc.data();
      if (typeof data.rating === 'number') {
        totalRating += data.rating;
        ratingCount++;
      }
    });
    
    const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    
    // NPS simplificado (ratings 4-5 = promoters, 1-2 = detractors)
    let promoters = 0;
    let detractors = 0;
    ratingsSnap.forEach(doc => {
      const rating = doc.data().rating;
      if (rating >= 4) promoters++;
      if (rating <= 2) detractors++;
    });
    const nps = ratingCount > 0 ? ((promoters - detractors) / ratingCount) * 100 : 0;
    
    // Buscar feedbacks count
    const feedbacksSnap = await db.collection('feedbacks')
      .where('createdAt', '>=', startDate)
      .get();
    
    return {
      totalJobs: createKPIValue(totalJobs, totalJobs * 0.9, '', totalJobs > 10 ? 'good' : 'warning'),
      activeJobs: createKPIValue(acceptedJobs - completedJobs, 0, '', true ? 'good' : 'warning'),
      completedJobs: createKPIValue(completedJobs, completedJobs * 0.9, '', completedJobs > 5 ? 'good' : 'warning'),
      
      acceptanceRate: createKPIValue(acceptanceRate, acceptanceRate * 0.95, '%', acceptanceRate > 60 ? 'good' : acceptanceRate > 40 ? 'warning' : 'critical'),
      completionRate: createKPIValue(completionRate, completionRate * 0.95, '%', completionRate > 80 ? 'good' : completionRate > 60 ? 'warning' : 'critical'),
      avgResponseTime: createKPIValue(avgResponseTime, avgResponseTime * 1.1, 'hours', avgResponseTime < 24 ? 'good' : avgResponseTime < 48 ? 'warning' : 'critical'),
      
      avgRating: createKPIValue(avgRating, avgRating * 0.98, '', avgRating > 4 ? 'good' : avgRating > 3 ? 'warning' : 'critical'),
      nps: createKPIValue(nps, nps * 0.95, '', nps > 50 ? 'good' : nps > 0 ? 'warning' : 'critical'),
      feedbackCount: feedbacksSnap.size,
    };
  } catch (error) {
    console.error('[Operational KPIs] Erro:', error);
    return getEmptyOperationalKPIs();
  }
}

// ═══════════════════════════════════════════════════════════════
// MARKETPLACE KPIs (FIREBASE)
// ═══════════════════════════════════════════════════════════════

async function getMarketplaceKPIs(period: string): Promise<MarketplaceKPIs> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  try {
    // Buscar profissionais
    const professionalSnap = await db.collection('users')
      .where('perfil', '==', 'profissional')
      .limit(500)
      .get();
    
    const totalProfessionals = professionalSnap.size;
    
    // Buscar clientes
    const clientSnap = await db.collection('users')
      .where('perfil', '==', 'cliente')
      .limit(500)
      .get();
    
    const totalClients = clientSnap.size;
    
    // Buscar jobs pendentes
    const pendingJobsSnap = await db.collection('jobs')
      .where('status', '==', 'pending')
      .limit(500)
      .get();
    
    const pendingJobs = pendingJobsSnap.size;
    
    // Calcular profissionais ativos (com jobs aceitos nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeJobsSnap = await db.collection('jobs')
      .where('status', 'in', ['accepted', 'completed'])
      .where('acceptedAt', '>=', thirtyDaysAgo)
      .limit(500)
      .get();
    
    const activeProfessionalIds = new Set<string>();
    activeJobsSnap.forEach(doc => {
      const specialistId = doc.data().specialistId || doc.data().professionalId;
      if (specialistId) activeProfessionalIds.add(specialistId);
    });
    
    const activeProfessionals = activeProfessionalIds.size;
    
    // Calcular clientes ativos (com jobs criados nos últimos 30 dias)
    const activeClientIds = new Set<string>();
    const recentJobsSnap = await db.collection('jobs')
      .where('createdAt', '>=', thirtyDaysAgo)
      .limit(500)
      .get();
    
    recentJobsSnap.forEach(doc => {
      const clientId = doc.data().clientId || doc.data().familyId;
      if (clientId) activeClientIds.add(clientId);
    });
    
    const activeClients = activeClientIds.size;
    
    // Calcular métricas
    const supplyDemandRatio = pendingJobs > 0 ? totalProfessionals / pendingJobs : totalProfessionals;
    
    const totalJobsSnap = await db.collection('jobs').limit(500).get();
    const acceptedCount = totalJobsSnap.docs.filter(doc => {
      const status = doc.data().status;
      return status === 'accepted' || status === 'completed';
    }).length;
    const matchRate = totalJobsSnap.size > 0 ? (acceptedCount / totalJobsSnap.size) * 100 : 0;
    
    const utilizationRate = totalProfessionals > 0 ? (activeProfessionals / totalProfessionals) * 100 : 0;
    
    const jobsWithoutMatch = pendingJobsSnap.size;
    const inactiveProfessionals = totalProfessionals - activeProfessionals;
    
    return {
      totalProfessionals: createKPIValue(totalProfessionals, totalProfessionals * 0.95, '', totalProfessionals > 50 ? 'good' : 'warning'),
      activeProfessionals: createKPIValue(activeProfessionals, activeProfessionals * 0.95, '', activeProfessionals > 20 ? 'good' : 'warning'),
      totalClients: createKPIValue(totalClients, totalClients * 0.95, '', totalClients > 100 ? 'good' : 'warning'),
      activeClients: createKPIValue(activeClients, activeClients * 0.95, '', activeClients > 30 ? 'good' : 'warning'),
      
      supplyDemandRatio: createKPIValue(supplyDemandRatio, supplyDemandRatio, '', supplyDemandRatio > 0.5 ? 'good' : supplyDemandRatio > 0.3 ? 'warning' : 'critical'),
      matchRate: createKPIValue(matchRate, matchRate * 0.95, '%', matchRate > 60 ? 'good' : matchRate > 40 ? 'warning' : 'critical'),
      utilizationRate: createKPIValue(utilizationRate, utilizationRate * 0.95, '%', utilizationRate > 50 ? 'good' : utilizationRate > 30 ? 'warning' : 'critical'),
      
      pendingJobs,
      jobsWithoutMatch,
      inactiveProfessionals,
    };
  } catch (error) {
    console.error('[Marketplace KPIs] Erro:', error);
    return getEmptyMarketplaceKPIs();
  }
}

// ═══════════════════════════════════════════════════════════════
// GROWTH KPIs (GA4 + FIREBASE)
// ═══════════════════════════════════════════════════════════════

async function getGrowthKPIs(period: string): Promise<GrowthKPIs> {
  try {
    // Buscar métricas GA4
    const ga4Metrics = await fetchGoogleAnalyticsMetrics();
    
    // Buscar novos cadastros Firebase
    getFirebaseAdmin();
    const db = getFirestore();
    
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    const newProfsSnap = await db.collection('users')
      .where('perfil', '==', 'profissional')
      .where('createdAt', '>=', startDate)
      .limit(500)
      .get();
    
    const newClientsSnap = await db.collection('users')
      .where('perfil', '==', 'cliente')
      .where('createdAt', '>=', startDate)
      .limit(500)
      .get();
    
    const newProfessionals = newProfsSnap.size;
    const newClients = newClientsSnap.size;
    const totalNewUsers = newProfessionals + newClients;
    
    // Signup conversion (novos usuários / sessões)
    const signupConversionRate = ga4Metrics.sessions > 0 ? (totalNewUsers / ga4Metrics.sessions) * 100 : 0;
    
    return {
      activeUsers: createKPIValue(ga4Metrics.activeUsers, ga4Metrics.activeUsers * 0.9, '', ga4Metrics.activeUsers > 100 ? 'good' : 'warning'),
      newUsers: createKPIValue(ga4Metrics.newUsers, ga4Metrics.newUsers * 0.9, '', ga4Metrics.newUsers > 50 ? 'good' : 'warning'),
      sessions: createKPIValue(ga4Metrics.sessions, ga4Metrics.sessions * 0.9, '', ga4Metrics.sessions > 200 ? 'good' : 'warning'),
      
      newProfessionals: createKPIValue(newProfessionals, newProfessionals * 0.9, '', newProfessionals > 5 ? 'good' : 'warning'),
      newClients: createKPIValue(newClients, newClients * 0.9, '', newClients > 10 ? 'good' : 'warning'),
      signupConversionRate: createKPIValue(signupConversionRate, signupConversionRate * 0.95, '%', signupConversionRate > 2 ? 'good' : signupConversionRate > 1 ? 'warning' : 'critical'),
      
      avgSessionDuration: createKPIValue(ga4Metrics.averageSessionDuration, ga4Metrics.averageSessionDuration * 0.95, 'seconds', ga4Metrics.averageSessionDuration > 60 ? 'good' : 'warning'),
      bounceRate: createKPIValue(ga4Metrics.bounceRate, ga4Metrics.bounceRate * 1.05, '%', ga4Metrics.bounceRate < 50 ? 'good' : ga4Metrics.bounceRate < 70 ? 'warning' : 'critical'),
    };
  } catch (error) {
    console.error('[Growth KPIs] Erro:', error);
    return getEmptyGrowthKPIs();
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function createKPIValue(
  value: number, 
  previousValue: number, 
  unit: string = '',
  status: 'good' | 'warning' | 'critical' = 'good'
): KPIValue {
  const change = value - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) > 1) {
    trend = changePercent > 0 ? 'up' : 'down';
  }
  
  return {
    value,
    previousValue,
    change,
    changePercent,
    trend,
    status,
    unit,
  };
}

function getEmptyFinancialKPIs(): FinancialKPIs {
  const emptyKPI = createKPIValue(0, 0, '', 'warning');
  return {
    mrr: emptyKPI,
    arr: emptyKPI,
    mrrGrowth: emptyKPI,
    arpu: emptyKPI,
    ltv: emptyKPI,
    churnRate: emptyKPI,
    burnRate: emptyKPI,
    netBurn: emptyKPI,
    runway: emptyKPI,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    canceledThisMonth: 0,
    cashBalance: 0,
  };
}

function getEmptyOperationalKPIs(): OperationalKPIs {
  const emptyKPI = createKPIValue(0, 0, '', 'warning');
  return {
    totalJobs: emptyKPI,
    activeJobs: emptyKPI,
    completedJobs: emptyKPI,
    acceptanceRate: emptyKPI,
    completionRate: emptyKPI,
    avgResponseTime: emptyKPI,
    avgRating: emptyKPI,
    nps: emptyKPI,
    feedbackCount: 0,
  };
}

function getEmptyMarketplaceKPIs(): MarketplaceKPIs {
  const emptyKPI = createKPIValue(0, 0, '', 'warning');
  return {
    totalProfessionals: emptyKPI,
    activeProfessionals: emptyKPI,
    totalClients: emptyKPI,
    activeClients: emptyKPI,
    supplyDemandRatio: emptyKPI,
    matchRate: emptyKPI,
    utilizationRate: emptyKPI,
    pendingJobs: 0,
    jobsWithoutMatch: 0,
    inactiveProfessionals: 0,
  };
}

function getEmptyGrowthKPIs(): GrowthKPIs {
  const emptyKPI = createKPIValue(0, 0, '', 'warning');
  return {
    activeUsers: emptyKPI,
    newUsers: emptyKPI,
    sessions: emptyKPI,
    newProfessionals: emptyKPI,
    newClients: emptyKPI,
    signupConversionRate: emptyKPI,
    avgSessionDuration: emptyKPI,
    bounceRate: emptyKPI,
  };
}
