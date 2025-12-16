/**
 * Sales Velocity & Conversion Analytics Service
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  Deal, 
  SalesVelocityMetrics, 
  ConversionAnalytics,
  PipelineStage,
  PIPELINE_STAGES 
} from './types';

// ═══════════════════════════════════════════════════════════════
// SALES VELOCITY
// Formula: (# of Deals × Average Deal Value × Win Rate%) / Sales Cycle Length
// ═══════════════════════════════════════════════════════════════

export async function calculateSalesVelocity(
  deals: Deal[],
  closedWonDeals: Deal[],
  closedLostDeals: Deal[]
): Promise<SalesVelocityMetrics> {
  
  const activeDeals = deals.filter(d => d.status === 'active');
  const allClosedDeals = [...closedWonDeals, ...closedLostDeals];
  
  // ═══════════════════════════════════════════════════════════════
  // CURRENT VELOCITY COMPONENTS
  // ═══════════════════════════════════════════════════════════════
  
  const numberOfDeals = activeDeals.length;
  const totalValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const averageDealValue = numberOfDeals > 0 ? totalValue / numberOfDeals : 0;
  
  // Win rate
  const totalClosed = allClosedDeals.length;
  const winRate = totalClosed > 0 ? (closedWonDeals.length / totalClosed) * 100 : 30; // Default 30%
  
  // Sales cycle length (average days to close)
  const salesCycleLength = closedWonDeals.length > 0
    ? closedWonDeals.reduce((sum, d) => sum + d.daysInPipeline, 0) / closedWonDeals.length
    : 45; // Default 45 days
  
  // Current velocity ($ per day)
  const currentVelocity = salesCycleLength > 0
    ? (numberOfDeals * averageDealValue * (winRate / 100)) / salesCycleLength
    : 0;
  
  // ═══════════════════════════════════════════════════════════════
  // PREVIOUS PERIOD VELOCITY (30 days ago)
  // ═══════════════════════════════════════════════════════════════
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Simplified: use 90% of current velocity as mock
  const previousVelocity = currentVelocity * 0.9;
  const velocityChange = previousVelocity > 0 
    ? ((currentVelocity - previousVelocity) / previousVelocity) * 100
    : 0;
  
  // ═══════════════════════════════════════════════════════════════
  // VELOCITY BY STAGE
  // ═══════════════════════════════════════════════════════════════
  
  const byStage = PIPELINE_STAGES
    .filter(s => s.stage !== 'closed_won' && s.stage !== 'closed_lost')
    .map(stageConfig => {
      const stageDeals = activeDeals.filter(d => d.stage === stageConfig.stage);
      
      // Deals moved in/out last 30 days (mock - would need stage_history)
      const dealsMovedIn = Math.floor(stageDeals.length * 0.3);
      const dealsMovedOut = Math.floor(stageDeals.length * 0.25);
      
      // Average days to progress
      const avgDaysToProgress = stageConfig.averageDuration;
      
      // Stage velocity (deals per day moving through)
      const stageVelocity = stageDeals.length > 0 && avgDaysToProgress > 0
        ? (stageDeals.length * (stageConfig.probability / 100)) / avgDaysToProgress
        : 0;
      
      return {
        stage: stageConfig.stage,
        velocity: stageVelocity,
        dealsMovedIn,
        dealsMovedOut,
        averageDaysToProgress: avgDaysToProgress
      };
    });
  
  // ═══════════════════════════════════════════════════════════════
  // VELOCITY TRENDS (Last 12 weeks)
  // ═══════════════════════════════════════════════════════════════
  
  const trends = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    
    const weekLabel = `Sem ${12 - i}`;
    
    // Mock data - in real implementation, query historical data
    const weekDeals = Math.floor(numberOfDeals * (0.8 + Math.random() * 0.4));
    const weekAvgDeal = averageDealValue * (0.9 + Math.random() * 0.2);
    const weekWinRate = winRate * (0.9 + Math.random() * 0.2);
    const weekCycle = salesCycleLength * (0.9 + Math.random() * 0.2);
    
    const weekVelocity = weekCycle > 0
      ? (weekDeals * weekAvgDeal * (weekWinRate / 100)) / weekCycle
      : 0;
    
    trends.push({
      week: weekLabel,
      velocity: weekVelocity,
      deals: weekDeals,
      avgDealSize: weekAvgDeal,
      winRate: weekWinRate,
      cycleLength: weekCycle
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // BOTTLENECKS (Stages with longest duration)
  // ═══════════════════════════════════════════════════════════════
  
  const bottlenecks = byStage
    .map(stage => {
      const stageConfig = PIPELINE_STAGES.find(s => s.stage === stage.stage);
      if (!stageConfig) return null;
      
      const stageDeals = activeDeals.filter(d => d.stage === stage.stage);
      const avgStuckDays = stageDeals.length > 0
        ? stageDeals.reduce((sum, d) => sum + d.daysInStage, 0) / stageDeals.length
        : 0;
      
      // Identify bottleneck if avg > 2x expected
      const isBottleneck = avgStuckDays > (stageConfig.averageDuration * 2);
      
      if (!isBottleneck) return null;
      
      const affectedDeals = stageDeals.filter(d => d.daysInStage > stageConfig.averageDuration * 2).length;
      const estimatedImpact = affectedDeals * averageDealValue * 0.1; // 10% daily opportunity cost
      
      return {
        stage: stage.stage,
        stageName: stageConfig.name,
        averageStuckDays: avgStuckDays,
        affectedDeals,
        estimatedImpact,
        recommendation: getBottleneckRecommendation(stage.stage, avgStuckDays)
      };
    })
    .filter(b => b !== null)
    .sort((a, b) => b!.estimatedImpact - a!.estimatedImpact) as any[];
  
  // ═══════════════════════════════════════════════════════════════
  // VELOCITY FORECAST
  // ═══════════════════════════════════════════════════════════════
  
  const avgMonthlyRevenue = currentVelocity * 30;
  
  const forecast = {
    next30Days: avgMonthlyRevenue,
    next60Days: avgMonthlyRevenue * 2,
    next90Days: avgMonthlyRevenue * 3,
    confidence: calculateForecastConfidence(activeDeals.length, winRate, salesCycleLength)
  };
  
  return {
    currentVelocity,
    previousVelocity,
    velocityChange,
    components: {
      numberOfDeals,
      averageDealValue,
      winRate,
      salesCycleLength
    },
    byStage,
    trends,
    bottlenecks,
    forecast
  };
}

// ═══════════════════════════════════════════════════════════════
// CONVERSION ANALYTICS
// ═══════════════════════════════════════════════════════════════

export async function calculateConversionAnalytics(
  deals: Deal[],
  closedWonDeals: Deal[]
): Promise<ConversionAnalytics> {
  
  const activeDeals = deals.filter(d => d.status === 'active');
  const allDeals = [...activeDeals, ...closedWonDeals];
  
  // ═══════════════════════════════════════════════════════════════
  // OVERALL CONVERSION
  // ═══════════════════════════════════════════════════════════════
  
  const totalLeads = allDeals.filter(d => d.stage === 'lead' || d.daysInPipeline > 0).length;
  const totalQualified = allDeals.filter(d => 
    ['qualified', 'meeting', 'proposal', 'negotiation', 'closed_won'].includes(d.stage)
  ).length;
  const totalProposal = allDeals.filter(d => 
    ['proposal', 'negotiation', 'closed_won'].includes(d.stage)
  ).length;
  
  const overallConversion = {
    leadToCustomer: totalLeads > 0 ? (closedWonDeals.length / totalLeads) * 100 : 0,
    qualifiedToCustomer: totalQualified > 0 ? (closedWonDeals.length / totalQualified) * 100 : 0,
    proposalToCustomer: totalProposal > 0 ? (closedWonDeals.length / totalProposal) * 100 : 0
  };
  
  // ═══════════════════════════════════════════════════════════════
  // STAGE-TO-STAGE CONVERSION
  // ═══════════════════════════════════════════════════════════════
  
  const stageConversions = [];
  
  for (let i = 0; i < PIPELINE_STAGES.length - 3; i++) {
    const fromStage = PIPELINE_STAGES[i];
    const toStage = PIPELINE_STAGES[i + 1];
    
    // Count deals that progressed
    const dealsInFrom = allDeals.filter(d => 
      d.stage === fromStage.stage || 
      (d.status === 'won' && i < 5) // Won deals passed all stages
    ).length;
    
    const dealsInTo = allDeals.filter(d => {
      // Find stage order
      const currentOrder = PIPELINE_STAGES.findIndex(s => s.stage === d.stage);
      const toOrder = PIPELINE_STAGES.findIndex(s => s.stage === toStage.stage);
      return currentOrder >= toOrder || d.status === 'won';
    }).length;
    
    const rate = dealsInFrom > 0 ? (dealsInTo / dealsInFrom) * 100 : 0;
    
    // Benchmark (industry standards)
    const benchmark = 100 - (i * 15); // Simplified benchmark
    const performance = rate > benchmark * 1.1 ? 'above' : 
                       rate < benchmark * 0.9 ? 'below' : 'at';
    
    // Average time
    const progressedDeals = allDeals.filter(d => {
      const currentOrder = PIPELINE_STAGES.findIndex(s => s.stage === d.stage);
      const toOrder = PIPELINE_STAGES.findIndex(s => s.stage === toStage.stage);
      return currentOrder >= toOrder;
    });
    
    const averageTime = progressedDeals.length > 0
      ? progressedDeals.reduce((sum, d) => sum + fromStage.averageDuration, 0) / progressedDeals.length
      : fromStage.averageDuration;
    
    stageConversions.push({
      fromStage: fromStage.stage,
      toStage: toStage.stage,
      rate,
      averageTime,
      dealCount: dealsInTo,
      benchmark,
      performance: performance as 'above' | 'at' | 'below'
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // DROP-OFF ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  const dropoffs = PIPELINE_STAGES
    .filter(s => s.stage !== 'closed_won' && s.stage !== 'closed_lost')
    .map(stageConfig => {
      const stageDeals = allDeals.filter(d => d.stage === stageConfig.stage);
      const lostFromStage = deals.filter(d => 
        d.status === 'lost' && d.stage === stageConfig.stage
      );
      
      const dropoffRate = stageDeals.length > 0 
        ? (lostFromStage.length / stageDeals.length) * 100 
        : 0;
      
      const lostValue = lostFromStage.reduce((sum, d) => sum + d.value, 0);
      
      // Top reasons
      const reasonMap = new Map<string, number>();
      lostFromStage.forEach(d => {
        const reason = d.lostReason || 'unknown';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });
      
      const topReasons = Array.from(reasonMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason]) => reason);
      
      // Recoverable (deals with high health score before loss)
      const recoverable = Math.floor(lostFromStage.length * 0.3); // 30% typically recoverable
      
      return {
        stage: stageConfig.stage,
        stageName: stageConfig.name,
        dropoffRate,
        dropoffCount: lostFromStage.length,
        lostValue,
        topReasons,
        recoverable
      };
    })
    .filter(d => d.dropoffCount > 0)
    .sort((a, b) => b.dropoffRate - a.dropoffRate);
  
  // ═══════════════════════════════════════════════════════════════
  // TIME TO CONVERT
  // ═══════════════════════════════════════════════════════════════
  
  const timeToConvert = [];
  
  for (let i = 0; i < PIPELINE_STAGES.length - 3; i++) {
    const fromStage = PIPELINE_STAGES[i];
    const toStage = PIPELINE_STAGES[i + 1];
    
    // Get deals that progressed between these stages
    const progressedDeals = closedWonDeals.filter(d => {
      // Simplified: use daysInPipeline as proxy
      return true; // In real impl, would track stage history
    });
    
    const times = progressedDeals.map(d => fromStage.averageDuration);
    times.sort((a, b) => a - b);
    
    const average = times.length > 0 
      ? times.reduce((sum, t) => sum + t, 0) / times.length 
      : fromStage.averageDuration;
    
    const median = times.length > 0 
      ? times[Math.floor(times.length / 2)] 
      : fromStage.averageDuration;
    
    const p25 = times.length > 0 
      ? times[Math.floor(times.length * 0.25)] 
      : fromStage.averageDuration * 0.7;
    
    const p75 = times.length > 0 
      ? times[Math.floor(times.length * 0.75)] 
      : fromStage.averageDuration * 1.3;
    
    timeToConvert.push({
      fromStage: fromStage.stage,
      toStage: toStage.stage,
      average,
      median,
      p25,
      p75,
      fastest: times[0] || fromStage.averageDuration * 0.5,
      slowest: times[times.length - 1] || fromStage.averageDuration * 2
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CONVERSION BY SEGMENT
  // ═══════════════════════════════════════════════════════════════
  
  const segments = ['basic', 'pro', 'premium', 'enterprise'];
  const bySegment = segments.map(segment => {
    const segmentDeals = allDeals.filter(d => d.product === segment);
    const segmentWon = closedWonDeals.filter(d => d.product === segment);
    
    const leadToCustomer = segmentDeals.length > 0 
      ? (segmentWon.length / segmentDeals.length) * 100 
      : 0;
    
    const avgSalesCycle = segmentWon.length > 0
      ? segmentWon.reduce((sum, d) => sum + d.daysInPipeline, 0) / segmentWon.length
      : 45;
    
    const avgDealSize = segmentWon.length > 0
      ? segmentWon.reduce((sum, d) => sum + d.value, 0) / segmentWon.length
      : 0;
    
    return {
      segment,
      leadToCustomer,
      averageSalesCycle: avgSalesCycle,
      winRate: leadToCustomer,
      averageDealSize: avgDealSize
    };
  });
  
  // ═══════════════════════════════════════════════════════════════
  // CONVERSION BY SOURCE
  // ═══════════════════════════════════════════════════════════════
  
  const sources: ('inbound' | 'outbound' | 'referral' | 'partnership')[] = 
    ['inbound', 'outbound', 'referral', 'partnership'];
  
  const bySource = sources.map(source => {
    const sourceDeals = allDeals.filter(d => d.source === source);
    const sourceWon = closedWonDeals.filter(d => d.source === source);
    
    const conversionRate = sourceDeals.length > 0 
      ? (sourceWon.length / sourceDeals.length) * 100 
      : 0;
    
    const avgDealSize = sourceWon.length > 0
      ? sourceWon.reduce((sum, d) => sum + d.value, 0) / sourceWon.length
      : 0;
    
    const avgSalesCycle = sourceWon.length > 0
      ? sourceWon.reduce((sum, d) => sum + d.daysInPipeline, 0) / sourceWon.length
      : 45;
    
    // ROI (simplified - would need cost data)
    const roi = conversionRate * avgDealSize / 1000; // Mock ROI
    
    return {
      source,
      conversionRate,
      averageDealSize: avgDealSize,
      averageSalesCycle: avgSalesCycle,
      roi
    };
  });
  
  return {
    overallConversion,
    stageConversions,
    dropoffs,
    timeToConvert,
    bySegment,
    bySource
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getBottleneckRecommendation(stage: PipelineStage, avgDays: number): string {
  const recommendations: Record<PipelineStage, string> = {
    lead: 'Implementar qualificação automática com scoring',
    qualified: 'Agendar reuniões mais rápido - usar automação de calendário',
    meeting: 'Reduzir tempo entre reunião e proposta - templates prontos',
    proposal: 'Simplificar processo de aprovação - proposal builder',
    negotiation: 'Autorizar descontos mais rápido - playbook de objeções',
    closed_won: 'N/A',
    closed_lost: 'N/A'
  };
  
  return recommendations[stage] || 'Revisar processo e identificar gargalos';
}

function calculateForecastConfidence(
  pipelineSize: number,
  winRate: number,
  cycleLength: number
): number {
  let confidence = 70; // Base confidence
  
  // More deals = more confidence
  if (pipelineSize > 50) confidence += 15;
  else if (pipelineSize > 20) confidence += 10;
  else if (pipelineSize < 10) confidence -= 15;
  
  // Better win rate = more confidence
  if (winRate > 40) confidence += 10;
  else if (winRate < 20) confidence -= 10;
  
  // Shorter cycle = more predictable
  if (cycleLength < 30) confidence += 5;
  else if (cycleLength > 60) confidence -= 5;
  
  return Math.max(50, Math.min(95, confidence));
}
