/**
 * Pipeline Data Service
 * Fetches and processes deal data, calculates pipeline metrics
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { Deal, PipelineMetrics, PipelineStage, PIPELINE_STAGES } from './types';

// ═══════════════════════════════════════════════════════════════
// GET DEALS
// ═══════════════════════════════════════════════════════════════

export async function getDeals(
  startDate?: Date,
  endDate?: Date,
  filters?: any
): Promise<Deal[]> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  let query = db.collection('deals') as any;
  
  // Active deals only by default
  if (!filters?.includeAll) {
    query = query.where('status', 'in', ['active', 'won', 'lost']);
  }
  
  // Date range
  if (startDate) {
    query = query.where('createdAt', '>=', startDate);
  }
  if (endDate) {
    query = query.where('createdAt', '<=', endDate);
  }
  
  // Stage filter
  if (filters?.stage) {
    const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
    query = query.where('stage', 'in', stages);
  }
  
  // Owner filter
  if (filters?.ownerId) {
    query = query.where('ownerId', '==', filters.ownerId);
  }
  
  // Customer type filter
  if (filters?.customerType) {
    query = query.where('customerType', '==', filters.customerType);
  }
  
  const snapshot = await query.get();
  
  const deals: Deal[] = [];
  
  snapshot.forEach((doc: any) => {
    const data = doc.data();
    
    // Calculate derived fields
    const createdAt = data.createdAt?.toDate() || new Date();
    const lastActivity = data.lastActivity?.toDate() || createdAt;
    const now = new Date();
    
    const daysInPipeline = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysInStage = data.stageChangedAt 
      ? Math.floor((now.getTime() - data.stageChangedAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
      : daysInPipeline;
    
    // Weighted value
    const probability = data.probability || getProbabilityForStage(data.stage);
    const weightedValue = data.value * (probability / 100);
    
    // Health score
    const healthScore = calculateDealHealthScore(data, daysInStage, lastActivity);
    
    // Risk level
    const riskLevel = healthScore < 40 ? 'high' : healthScore < 70 ? 'medium' : 'low';
    
    deals.push({
      id: doc.id,
      title: data.title || `Deal - ${data.customerName}`,
      
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerType: data.customerType || 'professional',
      
      value: data.value,
      stage: data.stage,
      probability,
      expectedCloseDate: data.expectedCloseDate?.toDate() || new Date(),
      
      product: data.product || 'pro',
      billingCycle: data.billingCycle || 'monthly',
      
      createdAt,
      lastActivity,
      daysInStage,
      daysInPipeline,
      
      ownerId: data.ownerId,
      ownerName: data.ownerName || 'Não atribuído',
      
      source: data.source || 'inbound',
      campaign: data.campaign,
      
      status: data.status || 'active',
      lostReason: data.lostReason,
      
      weightedValue,
      
      activitiesCount: data.activitiesCount || 0,
      lastContactDate: data.lastContactDate?.toDate(),
      nextFollowUp: data.nextFollowUp?.toDate(),
      
      tags: data.tags || [],
      
      healthScore,
      riskLevel
    });
  });
  
  return deals;
}

// ═══════════════════════════════════════════════════════════════
// CALCULATE PIPELINE METRICS
// ═══════════════════════════════════════════════════════════════

export async function getPipelineMetrics(
  deals: Deal[]
): Promise<PipelineMetrics> {
  
  // Filter active deals
  const activeDeals = deals.filter(d => d.status === 'active');
  const closedWonDeals = deals.filter(d => d.status === 'won');
  const closedLostDeals = deals.filter(d => d.status === 'lost');
  
  // ═══════════════════════════════════════════════════════════════
  // OVERVIEW
  // ═══════════════════════════════════════════════════════════════
  
  const totalDeals = activeDeals.length;
  const totalValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = activeDeals.reduce((sum, d) => sum + d.weightedValue, 0);
  const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
  
  // ═══════════════════════════════════════════════════════════════
  // BY STAGE
  // ═══════════════════════════════════════════════════════════════
  
  const byStage = PIPELINE_STAGES
    .filter(s => s.stage !== 'closed_won' && s.stage !== 'closed_lost')
    .map(stageConfig => {
      const stageDeals = activeDeals.filter(d => d.stage === stageConfig.stage);
      const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      const stageWeightedValue = stageDeals.reduce((sum, d) => sum + d.weightedValue, 0);
      const avgDaysInStage = stageDeals.length > 0
        ? stageDeals.reduce((sum, d) => sum + d.daysInStage, 0) / stageDeals.length
        : 0;
      
      // Stuck deals (>2x average duration)
      const stuckThreshold = stageConfig.averageDuration * 2;
      const stuckDeals = stageDeals.filter(d => d.daysInStage > stuckThreshold).length;
      
      // Conversion rate to next stage (mock - would need historical data)
      const conversionRate = 100 - (stageConfig.order * 10); // Simplified
      
      return {
        stage: stageConfig.stage,
        stageName: stageConfig.name,
        count: stageDeals.length,
        value: stageValue,
        weightedValue: stageWeightedValue,
        averageDealSize: stageDeals.length > 0 ? stageValue / stageDeals.length : 0,
        averageDaysInStage: avgDaysInStage,
        conversionRate,
        stuckDeals
      };
    });
  
  // ═══════════════════════════════════════════════════════════════
  // CONVERSION FUNNEL
  // ═══════════════════════════════════════════════════════════════
  
  const funnel = PIPELINE_STAGES
    .filter(s => s.stage !== 'closed_won' && s.stage !== 'closed_lost')
    .map((stageConfig, index, array) => {
      const stageDeals = activeDeals.filter(d => d.stage === stageConfig.stage);
      const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      
      // Conversion from previous stage
      let conversionFromPrevious = 100;
      let dropoffFromPrevious = 0;
      
      if (index > 0) {
        const prevStage = array[index - 1];
        const prevCount = activeDeals.filter(d => d.stage === prevStage.stage).length;
        if (prevCount > 0) {
          conversionFromPrevious = (stageDeals.length / prevCount) * 100;
          dropoffFromPrevious = 100 - conversionFromPrevious;
        }
      }
      
      // Cumulative conversion from top
      const topCount = activeDeals.filter(d => d.stage === array[0].stage).length;
      const cumulativeConversion = topCount > 0 ? (stageDeals.length / topCount) * 100 : 0;
      
      return {
        stage: stageConfig.stage,
        stageName: stageConfig.name,
        count: stageDeals.length,
        value: stageValue,
        conversionFromPrevious,
        dropoffFromPrevious,
        cumulativeConversion
      };
    });
  
  // ═══════════════════════════════════════════════════════════════
  // WIN/LOSS
  // ═══════════════════════════════════════════════════════════════
  
  const totalClosed = closedWonDeals.length + closedLostDeals.length;
  const winRate = totalClosed > 0 ? (closedWonDeals.length / totalClosed) * 100 : 0;
  
  const closedWon = {
    count: closedWonDeals.length,
    value: closedWonDeals.reduce((sum, d) => sum + d.value, 0),
    averageDealSize: closedWonDeals.length > 0 
      ? closedWonDeals.reduce((sum, d) => sum + d.value, 0) / closedWonDeals.length 
      : 0,
    averageSalesCycle: closedWonDeals.length > 0
      ? closedWonDeals.reduce((sum, d) => sum + d.daysInPipeline, 0) / closedWonDeals.length
      : 0
  };
  
  // Lost reasons
  const lostReasons = new Map<string, { count: number; value: number }>();
  closedLostDeals.forEach(d => {
    const reason = d.lostReason || 'unknown';
    const existing = lostReasons.get(reason) || { count: 0, value: 0 };
    existing.count++;
    existing.value += d.value;
    lostReasons.set(reason, existing);
  });
  
  const topReasons = Array.from(lostReasons.entries())
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      percentage: (data.count / closedLostDeals.length) * 100,
      lostValue: data.value
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const closedLost = {
    count: closedLostDeals.length,
    value: closedLostDeals.reduce((sum, d) => sum + d.value, 0),
    topReasons
  };
  
  // ═══════════════════════════════════════════════════════════════
  // TIME METRICS
  // ═══════════════════════════════════════════════════════════════
  
  const allClosedDeals = [...closedWonDeals, ...closedLostDeals];
  const averageSalesCycle = allClosedDeals.length > 0
    ? allClosedDeals.reduce((sum, d) => sum + d.daysInPipeline, 0) / allClosedDeals.length
    : 30; // Default
  
  const salesCycleByStage = PIPELINE_STAGES.map(stageConfig => {
    const stageDeals = activeDeals.filter(d => d.stage === stageConfig.stage);
    const avgDays = stageDeals.length > 0
      ? stageDeals.reduce((sum, d) => sum + d.daysInStage, 0) / stageDeals.length
      : stageConfig.averageDuration;
    
    // Calculate median
    const sortedDays = stageDeals.map(d => d.daysInStage).sort((a, b) => a - b);
    const medianDays = sortedDays.length > 0 
      ? sortedDays[Math.floor(sortedDays.length / 2)]
      : avgDays;
    
    return {
      stage: stageConfig.stage,
      averageDays: avgDays,
      medianDays
    };
  });
  
  // ═══════════════════════════════════════════════════════════════
  // PIPELINE HEALTH
  // ═══════════════════════════════════════════════════════════════
  
  const atRiskDeals = activeDeals.filter(d => d.riskLevel === 'high').length;
  const staleDeals = activeDeals.filter(d => {
    const daysSinceActivity = Math.floor(
      (Date.now() - d.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceActivity > 7;
  }).length;
  
  const overdueFollowUps = activeDeals.filter(d => 
    d.nextFollowUp && d.nextFollowUp < new Date()
  ).length;
  
  const pipelineHealth = {
    score: calculatePipelineHealthScore(activeDeals, atRiskDeals, staleDeals, winRate),
    atRiskDeals,
    staleDeals,
    overdueFollowUps
  };
  
  // ═══════════════════════════════════════════════════════════════
  // BY CUSTOMER TYPE
  // ═══════════════════════════════════════════════════════════════
  
  const byCustomerType = ['professional', 'family', 'enterprise'].map(type => {
    const typeDeals = activeDeals.filter(d => d.customerType === type);
    const typeWon = closedWonDeals.filter(d => d.customerType === type);
    const typeLost = closedLostDeals.filter(d => d.customerType === type);
    const typeClosed = typeWon.length + typeLost.length;
    
    return {
      type: type as any,
      count: typeDeals.length,
      value: typeDeals.reduce((sum, d) => sum + d.value, 0),
      winRate: typeClosed > 0 ? (typeWon.length / typeClosed) * 100 : 0,
      averageDealSize: typeDeals.length > 0 
        ? typeDeals.reduce((sum, d) => sum + d.value, 0) / typeDeals.length 
        : 0
    };
  });
  
  // ═══════════════════════════════════════════════════════════════
  // BY OWNER
  // ═══════════════════════════════════════════════════════════════
  
  const ownerMap = new Map<string, Deal[]>();
  activeDeals.forEach(d => {
    const existing = ownerMap.get(d.ownerId) || [];
    existing.push(d);
    ownerMap.set(d.ownerId, existing);
  });
  
  const byOwner = Array.from(ownerMap.entries()).map(([ownerId, ownerDeals]) => {
    const ownerWon = closedWonDeals.filter(d => d.ownerId === ownerId);
    const ownerLost = closedLostDeals.filter(d => d.ownerId === ownerId);
    const ownerClosed = ownerWon.length + ownerLost.length;
    
    return {
      ownerId,
      ownerName: ownerDeals[0].ownerName,
      dealsCount: ownerDeals.length,
      pipelineValue: ownerDeals.reduce((sum, d) => sum + d.value, 0),
      winRate: ownerClosed > 0 ? (ownerWon.length / ownerClosed) * 100 : 0,
      averageDealSize: ownerDeals.reduce((sum, d) => sum + d.value, 0) / ownerDeals.length,
      averageSalesCycle: ownerWon.length > 0
        ? ownerWon.reduce((sum, d) => sum + d.daysInPipeline, 0) / ownerWon.length
        : averageSalesCycle
    };
  });
  
  // ═══════════════════════════════════════════════════════════════
  // FORECAST
  // ═══════════════════════════════════════════════════════════════
  
  const committed = activeDeals
    .filter(d => d.probability >= 70)
    .reduce((sum, d) => sum + d.value, 0);
  
  const bestCase = activeDeals
    .filter(d => d.probability >= 50)
    .reduce((sum, d) => sum + d.value, 0);
  
  const worstCase = activeDeals
    .filter(d => d.probability >= 90)
    .reduce((sum, d) => sum + d.value, 0);
  
  const mostLikely = weightedValue;
  
  const forecast = {
    committed,
    bestCase,
    worstCase,
    mostLikely
  };
  
  // ═══════════════════════════════════════════════════════════════
  // VELOCITY (placeholder - calculated in separate service)
  // ═══════════════════════════════════════════════════════════════
  
  const velocity = {
    currentVelocity: 0,
    previousVelocity: 0,
    velocityChange: 0,
    components: {
      numberOfDeals: totalDeals,
      averageDealValue: averageDealSize,
      winRate,
      salesCycleLength: averageSalesCycle
    },
    byStage: [],
    trends: [],
    bottlenecks: [],
    forecast: {
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      confidence: 70
    }
  };
  
  return {
    totalDeals,
    totalValue,
    weightedValue,
    averageDealSize,
    byStage,
    funnel,
    winRate,
    closedWon,
    closedLost,
    averageSalesCycle,
    salesCycleByStage,
    velocity,
    pipelineHealth,
    byCustomerType,
    byOwner,
    forecast
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getProbabilityForStage(stage: PipelineStage): number {
  const config = PIPELINE_STAGES.find(s => s.stage === stage);
  return config?.probability || 50;
}

function calculateDealHealthScore(
  deal: any,
  daysInStage: number,
  lastActivity: Date
): number {
  let score = 100;
  
  // Days in stage penalty
  const stageConfig = PIPELINE_STAGES.find(s => s.stage === deal.stage);
  const expectedDays = stageConfig?.averageDuration || 7;
  if (daysInStage > expectedDays * 2) {
    score -= 30;
  } else if (daysInStage > expectedDays) {
    score -= 15;
  }
  
  // Last activity penalty
  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActivity > 14) {
    score -= 30;
  } else if (daysSinceActivity > 7) {
    score -= 15;
  }
  
  // Activities count bonus
  if (deal.activitiesCount > 5) {
    score += 10;
  }
  
  // Next follow-up bonus
  if (deal.nextFollowUp) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculatePipelineHealthScore(
  activeDeals: Deal[],
  atRiskDeals: number,
  staleDeals: number,
  winRate: number
): number {
  let score = 100;
  
  // At-risk deals penalty
  if (activeDeals.length > 0) {
    const atRiskPercent = (atRiskDeals / activeDeals.length) * 100;
    if (atRiskPercent > 30) score -= 30;
    else if (atRiskPercent > 15) score -= 15;
  }
  
  // Stale deals penalty
  if (activeDeals.length > 0) {
    const stalePercent = (staleDeals / activeDeals.length) * 100;
    if (stalePercent > 40) score -= 25;
    else if (stalePercent > 20) score -= 12;
  }
  
  // Win rate bonus/penalty
  if (winRate > 40) score += 15;
  else if (winRate < 20) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}
