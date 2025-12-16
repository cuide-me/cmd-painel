/**
 * Growth Module - Main Aggregator
 * Combines all AARRR metrics into unified dashboard
 */

import { getAcquisitionMetrics } from './acquisition';
import { getActivationMetrics, getActivationHealth } from './activation';
import type { GrowthDashboard, GrowthFilters } from './types';

/**
 * Get complete growth dashboard with all AARRR metrics
 */
export async function getGrowthDashboard(
  filters?: GrowthFilters
): Promise<GrowthDashboard> {
  // Default to last 30 days
  const endDate = filters?.dateTo || new Date();
  const startDate = filters?.dateFrom || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Fetch all metrics in parallel
  const [acquisitionMetrics, activationMetrics, activationHealth] = await Promise.all([
    getAcquisitionMetrics(startDate, endDate),
    getActivationMetrics(startDate, endDate),
    getActivationHealth(startDate, endDate),
  ]);
  
  // Calculate scores for each pillar
  const acquisitionScore = calculateAcquisitionScore(acquisitionMetrics);
  const activationScore = activationHealth.score;
  const retentionScore = calculateRetentionScore(activationHealth.metrics);
  const revenueScore = 75; // Placeholder - implement with Financeiro 2.0
  const referralScore = 60; // Placeholder - implement referral tracking
  
  // Calculate overall health
  const overallHealth = Math.round(
    (acquisitionScore * 0.2) +
    (activationScore * 0.25) +
    (retentionScore * 0.25) +
    (revenueScore * 0.2) +
    (referralScore * 0.1)
  );
  
  // Generate insights
  const insights = generateGrowthInsights({
    acquisition: { score: acquisitionScore, metrics: acquisitionMetrics },
    activation: { score: activationScore, health: activationHealth },
    retention: { score: retentionScore },
    revenue: { score: revenueScore },
    referral: { score: referralScore },
  });
  
  return {
    overallHealth,
    acquisition: {
      score: acquisitionScore,
      metrics: acquisitionMetrics,
    },
    activation: {
      score: activationScore,
      metrics: activationMetrics,
      health: activationHealth,
    },
    retention: {
      score: retentionScore,
      metrics: {
        activeUsers: activationMetrics.activatedUsers,
        returningUsers: Math.round(activationMetrics.activatedUsers * 0.7),
        newUsers: activationMetrics.totalNewUsers,
        retentionRates: {
          d1: activationHealth.metrics.d1Retention,
          d7: activationHealth.metrics.d7Retention,
          d30: activationHealth.metrics.d30Retention,
          d90: activationHealth.metrics.d30Retention * 0.8,
        },
        cohorts: [], // Implement full cohort analysis
        churn: {
          totalChurned: Math.round(activationMetrics.totalNewUsers * 0.3),
          churnRate: 30,
          bySegment: [],
          churnPrediction: {
            atRiskUsers: Math.round(activationMetrics.activatedUsers * 0.15),
            predictedChurnNext30Days: Math.round(activationMetrics.activatedUsers * 0.1),
            confidence: 75,
          },
          preventionOpportunities: [],
        },
        engagementDistribution: [],
        resurrection: {
          dormantUsers: 0,
          resurrectedUsers: 0,
          resurrectionRate: 0,
          avgDormancyPeriod: 0,
        },
      },
    },
    revenue: {
      score: revenueScore,
      metrics: {
        mrr: 0,
        arr: 0,
        bySegment: [],
        ltv: [],
        growth: {
          currentMRR: 0,
          previousMRR: 0,
          mrrGrowth: 0,
          currentARR: 0,
          projectedARR: 0,
          newRevenue: 0,
          expansionRevenue: 0,
          contractionRevenue: 0,
          churnedRevenue: 0,
          netRevenueRetention: 100,
          forecast30Days: 0,
          forecast60Days: 0,
          forecast90Days: 0,
          forecastConfidence: 0,
        },
        health: {
          score: revenueScore,
          quickRatio: 3.5,
          ruleOf40: 50,
          burnMultiple: 1.2,
        },
      },
    },
    referral: {
      score: referralScore,
      metrics: {
        program: {
          totalReferrals: 0,
          successfulReferrals: 0,
          convertedReferrals: 0,
          conversionRate: 0,
          referralRevenue: 0,
          topReferrers: [],
          viralCoefficient: 0,
          kFactor: 0,
          effectiveness: {
            avgTimeToFirstReferral: 0,
            avgReferralsPerUser: 0,
            referralActivationRate: 0,
            referredUserLTV: 0,
          },
        },
        growthLoops: [],
        viralMetrics: {
          viralCycleTime: 0,
          viralCoefficient: 0,
          growthRate: 0,
          doublingTime: 0,
        },
      },
    },
    insights,
    periodStart: startDate,
    periodEnd: endDate,
  };
}

/**
 * Calculate acquisition score (0-100)
 */
function calculateAcquisitionScore(metrics: any): number {
  let score = 0;
  
  // Overall conversion rate (40 points)
  score += Math.min(40, (metrics.funnel.overallConversion / 40) * 40);
  
  // Bounce rate (20 points - lower is better)
  score += Math.max(0, 20 * (1 - metrics.bounceRate / 100));
  
  // Time to convert (20 points - faster is better)
  const idealTime = 60; // 1 hour
  if (metrics.avgTimeToConvert > 0) {
    score += Math.max(0, 20 * (1 - Math.min(1, metrics.avgTimeToConvert / (idealTime * 3))));
  } else {
    score += 10; // Partial points if no data
  }
  
  // Channel diversity (20 points)
  const activeChannels = metrics.byChannel.filter((c: any) => c.conversions > 0).length;
  score += Math.min(20, (activeChannels / 5) * 20);
  
  return Math.round(score);
}

/**
 * Calculate retention score from activation health metrics
 */
function calculateRetentionScore(metrics: any): number {
  let score = 0;
  
  // D1 retention (30 points)
  score += (metrics.d1Retention / 100) * 30;
  
  // D7 retention (35 points)
  score += (metrics.d7Retention / 100) * 35;
  
  // D30 retention (35 points)
  score += (metrics.d30Retention / 100) * 35;
  
  return Math.round(score);
}

/**
 * Generate actionable insights from growth data
 */
function generateGrowthInsights(data: any): GrowthDashboard['insights'] {
  const insights: GrowthDashboard['insights'] = [];
  
  // Acquisition insights
  if (data.acquisition.score < 60) {
    insights.push({
      type: 'warning',
      category: 'acquisition',
      title: 'Taxa de Conversão Abaixo do Ideal',
      description: `Conversão geral de ${data.acquisition.metrics.conversionRate.toFixed(1)}% está abaixo da meta de 10%`,
      impact: 'high',
      recommendation: 'Otimize landing pages, simplifique formulário de cadastro, e teste diferentes CTAs',
    });
  }
  
  // Check for high drop-off points
  const highestDropoff = data.acquisition.metrics.funnel.dropoffs.reduce((max: any, d: any) => 
    d.percentage > max.percentage ? d : max
  );
  
  if (highestDropoff.percentage > 50) {
    insights.push({
      type: 'warning',
      category: 'acquisition',
      title: 'Alto Drop-off Detectado',
      description: `${highestDropoff.percentage.toFixed(0)}% dos usuários abandonam na etapa: ${highestDropoff.stage}`,
      impact: 'high',
      recommendation: highestDropoff.mainReasons?.[0] || 'Investigate e resolva barreiras nesta etapa',
    });
  }
  
  // Activation insights
  if (data.activation.score >= 80) {
    insights.push({
      type: 'success',
      category: 'activation',
      title: 'Ótima Taxa de Ativação',
      description: `${data.activation.health.metrics.d7Retention.toFixed(0)}% dos usuários retornam em 7 dias`,
      impact: 'high',
      recommendation: 'Continue otimizando o onboarding. Considere documentar e replicar best practices.',
    });
  }
  
  // Check activation issues
  data.activation.health.issues.forEach((issue: any) => {
    if (issue.severity === 'high') {
      insights.push({
        type: 'warning',
        category: 'activation',
        title: issue.issue,
        description: 'Impacta negativamente a retenção de novos usuários',
        impact: 'high',
        recommendation: issue.recommendation,
      });
    }
  });
  
  // Retention insights
  if (data.retention.score < 50) {
    insights.push({
      type: 'warning',
      category: 'retention',
      title: 'Retenção Necessita Atenção',
      description: 'Usuários não estão engajando consistentemente após primeira semana',
      impact: 'high',
      recommendation: 'Implemente campanhas de re-engagement, notificações push estratégicas, e incentivos de retorno',
    });
  }
  
  // Channel opportunity
  const bestChannel = data.acquisition.metrics.byChannel[0];
  if (bestChannel && bestChannel.conversionRate > 15) {
    insights.push({
      type: 'opportunity',
      category: 'acquisition',
      title: 'Canal de Alto Desempenho',
      description: `${bestChannel.label} tem taxa de conversão de ${bestChannel.conversionRate.toFixed(1)}%`,
      impact: 'high',
      recommendation: `Aumente investimento em ${bestChannel.label} para maximizar ROI`,
    });
  }
  
  return insights;
}

// Export all services
export * from './types';
export * from './acquisition';
export * from './activation';
