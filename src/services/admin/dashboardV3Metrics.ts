/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD V3 - METRICS SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Serviço enterprise para cálculo de métricas do painel administrativo.
 * 
 * Otimizações aplicadas:
 * - Single-pass data processing (evita múltiplas iterações)
 * - Batched queries para reduzir round-trips ao Firestore
 * - In-memory caching para períodos anteriores
 * - Parallel queries para dados independentes
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getRegionKey, type RegionData } from './region';
import {
  type DashboardV3Response,
  type HealthScore,
  type LiquidityMetrics,
  type FinancialMetrics,
  type QualityMetrics,
  type ActivationMetrics,
  type OperationalMetrics,
  type RegionalMetrics,
  type OperationalAlert,
  type AlertSeverity,
  type TimeWindow,
  type TrendDirection,
  type RegionBreakdown,
  type JobSummary,
  getHealthLevel,
  getTrendDirection,
  calculateChangePercent,
  HEALTH_THRESHOLDS,
} from './dashboardV3Types';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  return null;
}

function hoursSince(date: Date | null): number {
  if (!date) return 0;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function daysSince(date: Date | null): number {
  if (!date) return 0;
  return hoursSince(date) / 24;
}

function normalizeStatus(status: string | undefined): string {
  if (!status) return 'unknown';
  const s = status.toLowerCase().trim();
  
  // Pending variants
  if (['pending', 'pendente', 'open', 'aberto', 'novo', 'new'].includes(s)) return 'pending';
  // In progress
  if (['in_progress', 'em_andamento', 'proposta_enviada', 'proposta_aceita', 'accepted', 'confirmed'].includes(s)) return 'in_progress';
  // Completed
  if (['completed', 'concluido', 'concluído', 'finalizado', 'done'].includes(s)) return 'completed';
  // Cancelled
  if (['cancelled', 'cancelado', 'canceled'].includes(s)) return 'cancelled';
  
  return status;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADER - Single batch load with parallel queries
// ═══════════════════════════════════════════════════════════════════════════

interface LoadedData {
  jobs: any[];
  users: any[];
  payments: any[];
  transacoes: any[];
  tickets: any[];
  feedbacks: any[];
  currentPeriod: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
}

async function loadAllData(windowDays: TimeWindow): Promise<LoadedData> {
  const db = getFirestore();
  const now = new Date();
  
  const currentPeriod = {
    start: new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000),
    end: now,
  };
  
  const previousPeriod = {
    start: new Date(currentPeriod.start.getTime() - windowDays * 24 * 60 * 60 * 1000),
    end: currentPeriod.start,
  };

  // Parallel queries para dados independentes
  const [jobsSnapshot, usersSnapshot, paymentsSnapshot, transacoesSnapshot, ticketsSnapshot, feedbacksSnapshot] = 
    await Promise.all([
      // Jobs dos últimos 2 períodos (para comparação)
      db.collection('jobs')
        .where('createdAt', '>=', Timestamp.fromDate(previousPeriod.start))
        .get(),
      
      // Todos os usuários
      db.collection('users').get(),
      
      // Pagamentos dos últimos 60 dias
      db.collection('payment_confirmations')
        .where('confirmedAt', '>=', Timestamp.fromDate(previousPeriod.start))
        .get(),
      
      // Transações dos últimos 60 dias
      db.collection('transacoes')
        .where('createdAt', '>=', Timestamp.fromDate(previousPeriod.start))
        .get(),
      
      // Tickets ativos
      db.collection('tickets')
        .where('status', 'in', ['open', 'pending', 'in_progress', 'aberto', 'pendente'])
        .get()
        .catch(() => ({ docs: [] })),
      
      // Feedbacks recentes
      db.collection('feedbacks')
        .where('createdAt', '>=', Timestamp.fromDate(currentPeriod.start))
        .get()
        .catch(() => ({ docs: [] })),
    ]);

  return {
    jobs: jobsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
    users: usersSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ uid: doc.id, ...doc.data() })),
    payments: paymentsSnapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data())
      .filter((p: any) => p.businessStatus === 'confirmed'),
    transacoes: transacoesSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data()),
    tickets: ticketsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
    feedbacks: feedbacksSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data()),
    currentPeriod,
    previousPeriod,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE-PASS PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════

interface ProcessedMetrics {
  // Liquidez
  uniqueFamilies: Set<string>;
  uniqueCaregivers: Set<string>;
  familiesByRegion: Map<string, { count: number; data: RegionData }>;
  caregiversByRegion: Map<string, { count: number; data: RegionData }>;
  
  // Match timing
  matchTimes: number[];
  totalJobs: number;
  jobsWithMatch: number;
  
  // Status counts
  pendingJobs: any[];
  completedJobs: any[];
  cancelledJobs: any[];
  
  // Cancelamento por tipo
  cancelledByFamily: number;
  cancelledByCaregiver: number;
  
  // Ratings
  ratings: number[];
  ratingsByCaregiver: Map<string, number[]>;
  
  // Financeiro
  gmvTotal: number;
  transactionValues: number[];
  
  // Por região para ranking
  regionStats: Map<string, RegionStats>;
}

interface RegionStats {
  region: string;
  label: string;
  cidade?: string;
  estado?: string;
  gmv: number;
  jobs: number;
  completed: number;
  pending: number;
  matchTimes: number[];
  families: Set<string>;
  caregivers: Set<string>;
}

function processSinglePass(jobs: any[], payments: any[], transacoes: any[], currentPeriod: { start: Date; end: Date }): ProcessedMetrics {
  const result: ProcessedMetrics = {
    uniqueFamilies: new Set(),
    uniqueCaregivers: new Set(),
    familiesByRegion: new Map(),
    caregiversByRegion: new Map(),
    matchTimes: [],
    totalJobs: 0,
    jobsWithMatch: 0,
    pendingJobs: [],
    completedJobs: [],
    cancelledJobs: [],
    cancelledByFamily: 0,
    cancelledByCaregiver: 0,
    ratings: [],
    ratingsByCaregiver: new Map(),
    gmvTotal: 0,
    transactionValues: [],
    regionStats: new Map(),
  };

  // Processar jobs em single pass
  for (const job of jobs) {
    const createdAt = toDate(job.createdAt);
    if (!createdAt || createdAt < currentPeriod.start || createdAt > currentPeriod.end) continue;

    result.totalJobs++;
    
    const clientId = job.clientId || job.familyId;
    const professionalId = job.specialistId || job.professionalId;
    const region = getRegionKey(job);
    const status = normalizeStatus(job.status);

    // Contagem de famílias
    if (clientId) {
      result.uniqueFamilies.add(clientId);
      if (!result.familiesByRegion.has(region.key)) {
        result.familiesByRegion.set(region.key, { count: 0, data: region });
      }
      result.familiesByRegion.get(region.key)!.count++;
    }

    // Contagem de cuidadores e match
    if (professionalId) {
      result.uniqueCaregivers.add(professionalId);
      result.jobsWithMatch++;
      
      if (!result.caregiversByRegion.has(region.key)) {
        result.caregiversByRegion.set(region.key, { count: 0, data: region });
      }
      result.caregiversByRegion.get(region.key)!.count++;
    }

    // Tempo de match
    if (job.proposal?.sentAt && createdAt) {
      const sentAt = toDate(job.proposal.sentAt);
      if (sentAt) {
        const matchTimeHours = (sentAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        if (matchTimeHours > 0 && matchTimeHours < 720) { // < 30 dias
          result.matchTimes.push(matchTimeHours);
        }
      }
    }

    // Por status
    if (status === 'pending' || status === 'in_progress') {
      result.pendingJobs.push(job);
    } else if (status === 'completed') {
      result.completedJobs.push(job);
    } else if (status === 'cancelled') {
      result.cancelledJobs.push(job);
      if (job.canceledBy === 'cliente' || job.cancelledBy === 'client') {
        result.cancelledByFamily++;
      } else if (job.canceledBy === 'profissional' || job.cancelledBy === 'professional') {
        result.cancelledByCaregiver++;
      }
    }

    // Ratings
    if (job.reviews?.client?.rating) {
      const rating = Number(job.reviews.client.rating);
      if (rating >= 1 && rating <= 5) {
        result.ratings.push(rating);
        if (professionalId) {
          if (!result.ratingsByCaregiver.has(professionalId)) {
            result.ratingsByCaregiver.set(professionalId, []);
          }
          result.ratingsByCaregiver.get(professionalId)!.push(rating);
        }
      }
    }

    // Stats por região
    if (!result.regionStats.has(region.key)) {
      result.regionStats.set(region.key, {
        region: region.key,
        label: region.label,
        cidade: region.cidade,
        estado: region.estado,
        gmv: 0,
        jobs: 0,
        completed: 0,
        pending: 0,
        matchTimes: [],
        families: new Set(),
        caregivers: new Set(),
      });
    }
    const rStats = result.regionStats.get(region.key)!;
    rStats.jobs++;
    if (clientId) rStats.families.add(clientId);
    if (professionalId) rStats.caregivers.add(professionalId);
    if (status === 'completed') rStats.completed++;
    if (status === 'pending') rStats.pending++;
  }

  // Processar transações (GMV)
  for (const t of transacoes) {
    const createdAt = toDate(t.createdAt);
    if (!createdAt || createdAt < currentPeriod.start || createdAt > currentPeriod.end) continue;
    
    const value = Number(t.valor || t.amount || 0);
    if (value > 0) {
      result.gmvTotal += value;
      result.transactionValues.push(value);
    }
  }

  // Fallback para payments se não tem transações
  if (result.gmvTotal === 0) {
    for (const p of payments) {
      const confirmedAt = toDate(p.confirmedAt);
      if (!confirmedAt || confirmedAt < currentPeriod.start || confirmedAt > currentPeriod.end) continue;
      
      const value = Number(p.amount || p.valor || 0);
      if (value > 0) {
        result.gmvTotal += value;
        result.transactionValues.push(value);
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: HEALTH SCORE
// ═══════════════════════════════════════════════════════════════════════════

function calculateHealthScore(
  current: ProcessedMetrics,
  previous: ProcessedMetrics
): HealthScore {
  // Calcular scores por dimensão (0-100)
  
  // 1. Liquidez: ratio demanda/oferta próximo de 1
  const ratio = current.uniqueFamilies.size > 0 
    ? current.uniqueCaregivers.size / current.uniqueFamilies.size 
    : 0;
  const liquidityScore = Math.max(0, Math.min(100, 
    100 - Math.abs(ratio - 1) * 50
  ));

  // 2. Velocidade: tempo de match
  const avgMatchTime = current.matchTimes.length > 0
    ? current.matchTimes.reduce((a, b) => a + b, 0) / current.matchTimes.length
    : 999;
  const { excellent, good, warning } = HEALTH_THRESHOLDS.avgMatchTimeHours;
  let velocityScore = 0;
  if (avgMatchTime <= excellent) velocityScore = 100;
  else if (avgMatchTime <= good) velocityScore = 80;
  else if (avgMatchTime <= warning) velocityScore = 50;
  else velocityScore = 20;

  // 3. Qualidade: avaliações
  const avgRating = current.ratings.length > 0
    ? current.ratings.reduce((a, b) => a + b, 0) / current.ratings.length
    : 0;
  const qualityScore = avgRating > 0 ? (avgRating / 5) * 100 : 50;

  // 4. Financeiro: GMV trend
  const gmvGrowth = previous.gmvTotal > 0 
    ? (current.gmvTotal - previous.gmvTotal) / previous.gmvTotal 
    : 0;
  const financialScore = Math.max(0, Math.min(100, 50 + gmvGrowth * 50));

  // 5. Retenção: taxa de cancelamento
  const cancelRate = current.totalJobs > 0 
    ? (current.cancelledJobs.length / current.totalJobs) * 100 
    : 0;
  const retentionScore = Math.max(0, 100 - cancelRate * 5);

  // Score geral (média ponderada)
  const score = Math.round(
    liquidityScore * 0.25 +
    velocityScore * 0.25 +
    qualityScore * 0.2 +
    financialScore * 0.15 +
    retentionScore * 0.15
  );

  // Trend vs período anterior
  const previousScore = previous.totalJobs > 0 ? 50 : 0; // Simplificado
  const changePercent = calculateChangePercent(score, previousScore);

  // Top fatores
  const factors = [
    { name: 'Match Rate', score: velocityScore, isPositive: velocityScore > 70 },
    { name: 'Avaliações', score: qualityScore, isPositive: qualityScore > 70 },
    { name: 'Liquidez', score: liquidityScore, isPositive: liquidityScore > 70 },
    { name: 'GMV Growth', score: financialScore, isPositive: financialScore > 60 },
    { name: 'Retenção', score: retentionScore, isPositive: retentionScore > 80 },
  ];

  return {
    score,
    level: getHealthLevel(score),
    dimensions: {
      liquidity: Math.round(liquidityScore),
      velocity: Math.round(velocityScore),
      quality: Math.round(qualityScore),
      financial: Math.round(financialScore),
      retention: Math.round(retentionScore),
    },
    trend: {
      direction: getTrendDirection(score, previousScore),
      changePercent,
      previousScore,
    },
    topFactors: {
      positive: factors.filter(f => f.isPositive).map(f => f.name).slice(0, 3),
      negative: factors.filter(f => !f.isPositive).map(f => f.name).slice(0, 3),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: LIQUIDEZ
// ═══════════════════════════════════════════════════════════════════════════

function calculateLiquidityMetrics(
  current: ProcessedMetrics,
  previous: ProcessedMetrics
): LiquidityMetrics {
  // Famílias ativas
  const familiesBreakdown: RegionBreakdown[] = Array.from(current.familiesByRegion.entries())
    .map(([key, { count, data }]) => ({
      region: key,
      value: count,
      label: data.label,
      cidade: data.cidade,
      estado: data.estado,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Cuidadores ativos
  const caregiversBreakdown: RegionBreakdown[] = Array.from(current.caregiversByRegion.entries())
    .map(([key, { count, data }]) => ({
      region: key,
      value: count,
      label: data.label,
      cidade: data.cidade,
      estado: data.estado,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Ratio demanda/oferta por região
  const demandSupplyByRegion = Array.from(current.regionStats.entries()).map(([key, stats]) => {
    const demand = stats.families.size;
    const supply = stats.caregivers.size;
    const ratio = supply > 0 ? demand / supply : (demand > 0 ? 999 : 1);
    return {
      region: key,
      label: stats.label,
      ratio: Math.round(ratio * 100) / 100,
      status: ratio > 1.5 ? 'excess_demand' as const : ratio < 0.7 ? 'excess_supply' as const : 'balanced' as const,
    };
  });

  // Tempo médio de match
  const sortedMatchTimes = [...current.matchTimes].sort((a, b) => a - b);
  const p50 = sortedMatchTimes[Math.floor(sortedMatchTimes.length * 0.5)] || 0;
  const p75 = sortedMatchTimes[Math.floor(sortedMatchTimes.length * 0.75)] || 0;
  const p90 = sortedMatchTimes[Math.floor(sortedMatchTimes.length * 0.9)] || 0;
  const avgMatchTime = current.matchTimes.length > 0
    ? current.matchTimes.reduce((a, b) => a + b, 0) / current.matchTimes.length
    : 0;

  // Jobs pendentes por faixa de tempo
  const now = Date.now();
  const pendingByTime = {
    lessThan24h: 0,
    between24and48h: 0,
    moreThan48h: 0,
    moreThan72h: 0,
    oldestJobHours: 0,
    urgentJobs: [] as JobSummary[],
  };

  for (const job of current.pendingJobs) {
    const createdAt = toDate(job.createdAt);
    if (!createdAt) continue;
    
    const hoursWaiting = (now - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursWaiting > pendingByTime.oldestJobHours) {
      pendingByTime.oldestJobHours = hoursWaiting;
    }

    if (hoursWaiting < 24) {
      pendingByTime.lessThan24h++;
    } else if (hoursWaiting < 48) {
      pendingByTime.between24and48h++;
    } else if (hoursWaiting < 72) {
      pendingByTime.moreThan48h++;
    } else {
      pendingByTime.moreThan72h++;
    }

    // Jobs urgentes (sem match por mais de 48h)
    if (hoursWaiting >= 48 && !job.specialistId && !job.professionalId) {
      const region = getRegionKey(job);
      pendingByTime.urgentJobs.push({
        id: job.id,
        region: region.label,
        hoursWaiting: Math.round(hoursWaiting),
        specialty: job.specialty || job.especialidade,
        createdAt: createdAt.toISOString(),
      });
    }
  }

  // Ordenar urgentes por tempo
  pendingByTime.urgentJobs.sort((a, b) => b.hoursWaiting - a.hoursWaiting);
  pendingByTime.urgentJobs = pendingByTime.urgentJobs.slice(0, 20);

  // Trends (vs período anterior)
  const prevFamilies = previous.uniqueFamilies.size;
  const prevCaregivers = previous.uniqueCaregivers.size;
  const prevMatchTime = previous.matchTimes.length > 0
    ? previous.matchTimes.reduce((a, b) => a + b, 0) / previous.matchTimes.length
    : 0;
  const prevMatchRate = previous.totalJobs > 0 
    ? (previous.jobsWithMatch / previous.totalJobs) * 100 
    : 0;
  const currentMatchRate = current.totalJobs > 0 
    ? (current.jobsWithMatch / current.totalJobs) * 100 
    : 0;

  return {
    activeFamilies: {
      count: current.uniqueFamilies.size,
      trend: getTrendDirection(current.uniqueFamilies.size, prevFamilies),
      changePercent: calculateChangePercent(current.uniqueFamilies.size, prevFamilies),
      byRegion: familiesBreakdown,
    },
    activeCaregivers: {
      count: current.uniqueCaregivers.size,
      trend: getTrendDirection(current.uniqueCaregivers.size, prevCaregivers),
      changePercent: calculateChangePercent(current.uniqueCaregivers.size, prevCaregivers),
      byRegion: caregiversBreakdown,
      availabilityRate: 75, // TODO: calcular de verdade
    },
    demandSupplyRatio: {
      overall: current.uniqueCaregivers.size > 0 
        ? current.uniqueFamilies.size / current.uniqueCaregivers.size 
        : 0,
      byRegion: demandSupplyByRegion,
    },
    avgMatchTime: {
      hours: Math.round(avgMatchTime * 10) / 10,
      trend: getTrendDirection(avgMatchTime, prevMatchTime),
      changePercent: calculateChangePercent(avgMatchTime, prevMatchTime),
      percentiles: {
        p50: Math.round(p50 * 10) / 10,
        p75: Math.round(p75 * 10) / 10,
        p90: Math.round(p90 * 10) / 10,
      },
    },
    matchRate: {
      percent: Math.round(currentMatchRate * 10) / 10,
      trend: getTrendDirection(currentMatchRate, prevMatchRate),
      changePercent: calculateChangePercent(currentMatchRate, prevMatchRate),
    },
    pendingJobs: {
      total: current.pendingJobs.length,
      ...pendingByTime,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: FINANCEIRO
// ═══════════════════════════════════════════════════════════════════════════

function calculateFinancialMetrics(
  current: ProcessedMetrics,
  previous: ProcessedMetrics,
  currentPeriod: { start: Date; end: Date }
): FinancialMetrics {
  const avgTicket = current.transactionValues.length > 0
    ? current.transactionValues.reduce((a, b) => a + b, 0) / current.transactionValues.length
    : 0;

  const prevAvgTicket = previous.transactionValues.length > 0
    ? previous.transactionValues.reduce((a, b) => a + b, 0) / previous.transactionValues.length
    : 0;

  // Projeção para fim do mês
  const now = new Date();
  const daysElapsed = (now.getTime() - currentPeriod.start.getTime()) / (1000 * 60 * 60 * 24);
  const daysInPeriod = (currentPeriod.end.getTime() - currentPeriod.start.getTime()) / (1000 * 60 * 60 * 24);
  const projectedGMV = daysElapsed > 0 ? (current.gmvTotal / daysElapsed) * daysInPeriod : 0;

  return {
    gmv: {
      mtd: current.gmvTotal,
      ytd: current.gmvTotal * 12, // TODO: calcular YTD real
      lastMonth: previous.gmvTotal,
      trend: getTrendDirection(current.gmvTotal, previous.gmvTotal),
      changePercent: calculateChangePercent(current.gmvTotal, previous.gmvTotal),
      byRegion: Array.from(current.regionStats.entries())
        .map(([key, stats]) => ({
          region: key,
          label: stats.label,
          value: stats.gmv,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      projection: {
        estimated: Math.round(projectedGMV),
        confidence: daysElapsed > 14 ? 'high' : daysElapsed > 7 ? 'medium' : 'low',
      },
    },
    avgTicket: {
      value: Math.round(avgTicket * 100) / 100,
      trend: getTrendDirection(avgTicket, prevAvgTicket),
      changePercent: calculateChangePercent(avgTicket, prevAvgTicket),
      bySpecialty: [], // TODO: implementar
    },
    takeRate: {
      percent: 15, // TODO: calcular real
      trend: 'stable',
      changePercent: 0,
    },
    netRevenue: {
      mtd: Math.round(current.gmvTotal * 0.15), // 15% take rate
      lastMonth: Math.round(previous.gmvTotal * 0.15),
      trend: getTrendDirection(current.gmvTotal * 0.15, previous.gmvTotal * 0.15),
      changePercent: calculateChangePercent(current.gmvTotal * 0.15, previous.gmvTotal * 0.15),
    },
    chargebacks: {
      count: 0, // TODO: pegar do Stripe
      totalValue: 0,
      rate: 0,
      trend: 'stable',
      pending: 0,
    },
    paymentStatus: {
      succeeded: { count: current.transactionValues.length, value: current.gmvTotal },
      pending: { count: 0, value: 0 },
      failed: { count: 0, value: 0 },
      refunded: { count: 0, value: 0 },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: QUALIDADE
// ═══════════════════════════════════════════════════════════════════════════

function calculateQualityMetrics(
  current: ProcessedMetrics,
  previous: ProcessedMetrics,
  users: any[]
): QualityMetrics {
  const avgRating = current.ratings.length > 0
    ? current.ratings.reduce((a, b) => a + b, 0) / current.ratings.length
    : 0;

  const prevAvgRating = previous.ratings.length > 0
    ? previous.ratings.reduce((a, b) => a + b, 0) / previous.ratings.length
    : 0;

  // Distribuição de ratings
  const distribution = { stars5: 0, stars4: 0, stars3: 0, stars2: 0, stars1: 0 };
  for (const rating of current.ratings) {
    if (rating >= 4.5) distribution.stars5++;
    else if (rating >= 3.5) distribution.stars4++;
    else if (rating >= 2.5) distribution.stars3++;
    else if (rating >= 1.5) distribution.stars2++;
    else distribution.stars1++;
  }

  // Top e bottom caregivers
  const caregiverRatings = Array.from(current.ratingsByCaregiver.entries())
    .map(([id, ratings]) => ({
      id,
      avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      count: ratings.length,
    }))
    .filter(c => c.count >= 3); // Mínimo 3 avaliações

  const topCaregivers = caregiverRatings
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5)
    .map(c => {
      const user = users.find(u => u.uid === c.id);
      return {
        id: c.id,
        name: user?.nome || user?.name || 'N/A',
        rating: Math.round(c.avgRating * 10) / 10,
        services: c.count,
      };
    });

  const bottomCaregivers = caregiverRatings
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 5)
    .map(c => {
      const user = users.find(u => u.uid === c.id);
      return {
        id: c.id,
        name: user?.nome || user?.name || 'N/A',
        rating: Math.round(c.avgRating * 10) / 10,
        services: c.count,
        flags: c.avgRating < 3 ? ['Baixa avaliação'] : [],
      };
    });

  // Taxa de cancelamento
  const currentCancelRate = current.totalJobs > 0 
    ? (current.cancelledJobs.length / current.totalJobs) * 100 
    : 0;
  const prevCancelRate = previous.totalJobs > 0 
    ? (previous.cancelledJobs.length / previous.totalJobs) * 100 
    : 0;

  return {
    nps: {
      score: 0, // TODO: implementar NPS
      promoters: 0,
      passives: 0,
      detractors: 0,
      responses: 0,
      trend: 'stable',
      changePoints: 0,
    },
    avgRating: {
      overall: Math.round(avgRating * 10) / 10,
      trend: getTrendDirection(avgRating, prevAvgRating),
      changePercent: calculateChangePercent(avgRating, prevAvgRating),
      distribution,
      topCaregivers,
      bottomCaregivers,
    },
    rehireRate: {
      percent: 0, // TODO: calcular
      trend: 'stable',
      changePercent: 0,
      distribution: { once: 0, twice: 0, threeOrMore: 0 },
    },
    complaints: {
      count: 0,
      rate: 0,
      trend: 'stable',
      changePercent: 0,
      byType: [],
      unresolved: 0,
    },
    cancellations: {
      count: current.cancelledJobs.length,
      rate: Math.round(currentCancelRate * 10) / 10,
      trend: getTrendDirection(currentCancelRate, prevCancelRate),
      changePercent: calculateChangePercent(currentCancelRate, prevCancelRate),
      byReason: [],
      byInitiator: {
        family: current.cancelledByFamily,
        caregiver: current.cancelledByCaregiver,
        system: current.cancelledJobs.length - current.cancelledByFamily - current.cancelledByCaregiver,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: ATIVAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

function calculateActivationMetrics(
  current: ProcessedMetrics,
  users: any[],
  currentPeriod: { start: Date; end: Date }
): ActivationMetrics {
  const families = users.filter(u => u.perfil === 'cliente' || u.role === 'user');
  const caregivers = users.filter(u => u.perfil === 'profissional' || u.role === 'professional');

  // Famílias cadastradas no período
  const newFamilies = families.filter(u => {
    const cadastro = toDate(u.dataCadastro || u.createdAt);
    return cadastro && cadastro >= currentPeriod.start && cadastro <= currentPeriod.end;
  });

  // Cuidadores cadastrados no período
  const newCaregivers = caregivers.filter(u => {
    const cadastro = toDate(u.dataCadastro || u.createdAt);
    return cadastro && cadastro >= currentPeriod.start && cadastro <= currentPeriod.end;
  });

  // Cuidadores com perfil completo
  const caregiversComplete = caregivers.filter(u => 
    u.porcentagemPerfil >= 100 || u.profileComplete === true
  );

  return {
    familyFunnel: {
      signups: newFamilies.length,
      firstOrder: {
        count: current.uniqueFamilies.size,
        conversionRate: newFamilies.length > 0 
          ? (current.uniqueFamilies.size / newFamilies.length) * 100 
          : 0,
        avgDaysToConvert: 0, // TODO: calcular
      },
      secondOrder: {
        count: 0,
        conversionRate: 0,
        avgDaysBetweenOrders: 0,
      },
      recurring: {
        count: 0,
        conversionRate: 0,
      },
    },
    caregiverFunnel: {
      signups: newCaregivers.length,
      profileComplete: {
        count: caregiversComplete.length,
        conversionRate: caregivers.length > 0 
          ? (caregiversComplete.length / caregivers.length) * 100 
          : 0,
        avgDaysToComplete: 0,
      },
      documentsVerified: {
        count: 0,
        conversionRate: 0,
        avgDaysToVerify: 0,
      },
      firstService: {
        count: current.uniqueCaregivers.size,
        conversionRate: caregiversComplete.length > 0 
          ? (current.uniqueCaregivers.size / caregiversComplete.length) * 100 
          : 0,
        avgDaysToFirstService: 0,
      },
    },
    retentionCohorts: [], // TODO: implementar cohorts
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: OPERACIONAL
// ═══════════════════════════════════════════════════════════════════════════

function calculateOperationalMetrics(
  current: ProcessedMetrics,
  tickets: any[],
  users: any[]
): OperationalMetrics {
  const alerts: OperationalAlert[] = [];

  // Alerta: Jobs sem match há mais de 48h
  const urgentJobs = current.pendingJobs.filter(job => {
    const createdAt = toDate(job.createdAt);
    if (!createdAt) return false;
    const hoursWaiting = hoursSince(createdAt);
    return hoursWaiting >= 48 && !job.specialistId && !job.professionalId;
  });

  if (urgentJobs.length > 0) {
    alerts.push({
      id: 'jobs-sem-match',
      type: 'liquidity',
      severity: urgentJobs.length >= 10 ? 'critical' : urgentJobs.length >= 5 ? 'high' : 'medium',
      title: `${urgentJobs.length} Jobs sem profissional há +48h`,
      description: 'Pedidos aguardando profissional há mais de 48 horas',
      count: urgentJobs.length,
      createdAt: new Date().toISOString(),
      affectedItems: urgentJobs.slice(0, 10).map(job => ({
        id: job.id,
        label: `Job ${job.id.slice(0, 8)}`,
        metadata: {
          region: getRegionKey(job).label,
          hoursWaiting: Math.round(hoursSince(toDate(job.createdAt))),
        },
      })),
      actions: [
        { label: 'Ver jobs pendentes', href: '/admin/jobs?status=pending' },
      ],
    });
  }

  // Alerta: Jobs sem match há mais de 72h (crítico)
  const criticalJobs = urgentJobs.filter(job => {
    const createdAt = toDate(job.createdAt);
    return createdAt && hoursSince(createdAt) >= 72;
  });

  if (criticalJobs.length > 0) {
    alerts.push({
      id: 'jobs-sem-match-critico',
      type: 'liquidity',
      severity: 'critical',
      title: `🚨 ${criticalJobs.length} Jobs CRÍTICOS (+72h sem match)`,
      description: 'Pedidos aguardando profissional há mais de 72 horas - ação urgente necessária',
      count: criticalJobs.length,
      createdAt: new Date().toISOString(),
      affectedItems: criticalJobs.slice(0, 5).map(job => ({
        id: job.id,
        label: `Job ${job.id.slice(0, 8)}`,
        metadata: {
          region: getRegionKey(job).label,
          hoursWaiting: Math.round(hoursSince(toDate(job.createdAt))),
        },
      })),
    });
  }

  // Alerta: Taxa de cancelamento alta
  const cancelRate = current.totalJobs > 0 
    ? (current.cancelledJobs.length / current.totalJobs) * 100 
    : 0;

  if (cancelRate > 20) {
    alerts.push({
      id: 'cancel-rate-high',
      type: 'quality',
      severity: cancelRate > 30 ? 'critical' : 'high',
      title: `Taxa de cancelamento ${cancelRate.toFixed(1)}%`,
      description: 'Taxa de cancelamento acima do esperado (>20%)',
      count: current.cancelledJobs.length,
      createdAt: new Date().toISOString(),
    });
  }

  // Alerta: Cuidadores com baixa avaliação
  const lowRatingCaregivers = Array.from(current.ratingsByCaregiver.entries())
    .filter(([, ratings]) => {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      return avg < 3.5 && ratings.length >= 3;
    });

  if (lowRatingCaregivers.length > 0) {
    alerts.push({
      id: 'low-rating-caregivers',
      type: 'quality',
      severity: lowRatingCaregivers.length >= 5 ? 'high' : 'medium',
      title: `${lowRatingCaregivers.length} cuidadores com avaliação baixa`,
      description: 'Cuidadores com avaliação média abaixo de 3.5 estrelas',
      count: lowRatingCaregivers.length,
      createdAt: new Date().toISOString(),
    });
  }

  // Contar alertas por severidade
  const alertCounts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  return {
    alerts: {
      ...alertCounts,
      items: alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
    },
    matchSLA: {
      target: 24,
      achieved: current.matchTimes.length > 0 
        ? (current.matchTimes.filter(t => t <= 24).length / current.matchTimes.length) * 100 
        : 0,
      breached: current.matchTimes.filter(t => t > 24).length,
    },
    supportSLA: {
      avgResponseTime: 0, // TODO: calcular
      avgResolutionTime: 0,
      openTickets: tickets.length,
      ticketsByPriority: {
        urgent: tickets.filter((t: any) => t.priority === 'urgent').length,
        high: tickets.filter((t: any) => t.priority === 'high').length,
        medium: tickets.filter((t: any) => t.priority === 'medium').length,
        low: tickets.filter((t: any) => t.priority === 'low').length,
      },
    },
    caregiverIssues: {
      inactive: 0, // TODO: calcular
      lowRating: lowRatingCaregivers.length,
      highCancelRate: 0, // TODO: calcular
      documentsExpiring: 0, // TODO: calcular
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MÉTRICA: REGIONAL
// ═══════════════════════════════════════════════════════════════════════════

function calculateRegionalMetrics(current: ProcessedMetrics): RegionalMetrics {
  const regionArray = Array.from(current.regionStats.entries());

  // Top regiões por jobs (GMV quando disponível)
  const topRegionsByGMV = regionArray
    .map(([key, stats]) => {
      const matchRate = stats.jobs > 0 ? (stats.completed / stats.jobs) * 100 : 0;
      const avgMatchTime = stats.matchTimes.length > 0
        ? stats.matchTimes.reduce((a, b) => a + b, 0) / stats.matchTimes.length
        : 0;
      const dsRatio = stats.caregivers.size > 0 
        ? stats.families.size / stats.caregivers.size 
        : 0;

      return {
        region: key,
        label: stats.label,
        cidade: stats.cidade,
        estado: stats.estado,
        gmv: stats.gmv,
        jobs: stats.jobs,
        avgTicket: stats.jobs > 0 ? stats.gmv / stats.jobs : 0,
        matchRate: Math.round(matchRate * 10) / 10,
        avgMatchTimeHours: Math.round(avgMatchTime * 10) / 10,
        activeFamilies: stats.families.size,
        activeCaregivers: stats.caregivers.size,
        demandSupplyRatio: Math.round(dsRatio * 100) / 100,
        trend: 'stable' as TrendDirection, // TODO: calcular trend
      };
    })
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 15);

  // Regiões com problemas
  const problemRegions = regionArray
    .map(([key, stats]) => {
      const issues: string[] = [];
      const dsRatio = stats.caregivers.size > 0 
        ? stats.families.size / stats.caregivers.size 
        : 0;

      if (dsRatio > 2) issues.push('Alta demanda, poucos profissionais');
      if (stats.pending > 5) issues.push(`${stats.pending} jobs pendentes`);
      
      return {
        region: key,
        label: stats.label,
        issues,
        severity: (issues.length >= 2 ? 'high' : issues.length === 1 ? 'medium' : 'low') as AlertSeverity,
      };
    })
    .filter(r => r.issues.length > 0)
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 10);

  // Cobertura
  const totalRegions = regionArray.length;
  const activeRegions = regionArray.filter(([, s]) => s.jobs > 0).length;
  const regionsWithSupply = regionArray.filter(([, s]) => s.caregivers.size > 0).length;
  const regionsWithDemand = regionArray.filter(([, s]) => s.families.size > 0).length;
  const regionsBalanced = regionArray.filter(([, s]) => {
    const ratio = s.caregivers.size > 0 ? s.families.size / s.caregivers.size : 0;
    return ratio >= 0.5 && ratio <= 2;
  }).length;

  return {
    topRegionsByGMV,
    problemRegions,
    coverage: {
      totalRegions,
      activeRegions,
      regionsWithSupply,
      regionsWithDemand,
      regionsBalanced,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export async function calculateDashboardV3Metrics(
  windowDays: TimeWindow = 30,
  regionFilter?: string
): Promise<DashboardV3Response> {
  console.log('[DashboardV3] Iniciando cálculo, window:', windowDays, 'region:', regionFilter);
  const startTime = Date.now();

  try {
    // Load all data in parallel
    const data = await loadAllData(windowDays);
    console.log('[DashboardV3] Dados carregados em', Date.now() - startTime, 'ms');
    console.log('[DashboardV3] Jobs:', data.jobs.length, 'Users:', data.users.length);

    // Filter by region if specified
    const filteredJobs = regionFilter
      ? data.jobs.filter(job => getRegionKey(job).key === regionFilter)
      : data.jobs;

    // Process current period
    const currentData = processSinglePass(
      filteredJobs,
      data.payments,
      data.transacoes,
      data.currentPeriod
    );

    // Process previous period for trends
    const previousJobs = regionFilter
      ? data.jobs.filter(job => {
          const region = getRegionKey(job);
          const createdAt = toDate(job.createdAt);
          return region.key === regionFilter && 
                 createdAt && 
                 createdAt >= data.previousPeriod.start && 
                 createdAt < data.previousPeriod.end;
        })
      : data.jobs.filter(job => {
          const createdAt = toDate(job.createdAt);
          return createdAt && 
                 createdAt >= data.previousPeriod.start && 
                 createdAt < data.previousPeriod.end;
        });

    const previousData = processSinglePass(
      previousJobs,
      data.payments,
      data.transacoes,
      data.previousPeriod
    );

    console.log('[DashboardV3] Single-pass processado em', Date.now() - startTime, 'ms');

    // Calculate all metrics
    const healthScore = calculateHealthScore(currentData, previousData);
    const liquidity = calculateLiquidityMetrics(currentData, previousData);
    const financial = calculateFinancialMetrics(currentData, previousData, data.currentPeriod);
    const quality = calculateQualityMetrics(currentData, previousData, data.users);
    const activation = calculateActivationMetrics(currentData, data.users, data.currentPeriod);
    const operational = calculateOperationalMetrics(currentData, data.tickets, data.users);
    const regional = calculateRegionalMetrics(currentData);

    console.log('[DashboardV3] Métricas calculadas em', Date.now() - startTime, 'ms');

    return {
      timestamp: new Date().toISOString(),
      window: windowDays,
      regionFilter,
      cached: false,
      healthScore,
      liquidity,
      financial,
      quality,
      activation,
      operational,
      regional,
    };
  } catch (error) {
    console.error('[DashboardV3] ERRO:', error);
    throw error;
  }
}
