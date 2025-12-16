/**
 * Growth & Activation Module Types
 * Sprint 3: AARRR Framework (Acquisition, Activation, Retention, Revenue, Referral)
 */

// ═══════════════════════════════════════════════════════════════
// ACQUISITION (Aquisição)
// ═══════════════════════════════════════════════════════════════

export interface AcquisitionFunnel {
  stage1_visitors: number; // Visitantes únicos
  stage2_signups: number; // Cadastros iniciados
  stage3_completed: number; // Cadastros completos
  stage4_verified: number; // Email/telefone verificado
  stage5_profileComplete: number; // Perfil 100% completo
  stage6_firstAction: number; // Primeira ação no sistema
  
  // Conversion rates
  visitorToSignup: number; // %
  signupToComplete: number; // %
  completeToVerified: number; // %
  verifiedToProfile: number; // %
  profileToAction: number; // %
  overallConversion: number; // visitor → first action %
  
  // Drop-off analysis
  dropoffs: {
    stage: string;
    count: number;
    percentage: number;
    mainReasons?: string[];
  }[];
}

export interface AcquisitionChannel {
  channel: 'organic' | 'paid' | 'social' | 'referral' | 'direct' | 'email' | 'other';
  label: string;
  visitors: number;
  signups: number;
  conversions: number;
  conversionRate: number;
  cost?: number; // Custo de aquisição
  cpa?: number; // Cost per acquisition
  roi?: number; // Return on investment
  trend: 'up' | 'down' | 'stable';
}

export interface AcquisitionMetrics {
  totalVisitors: number;
  totalSignups: number;
  totalConversions: number;
  conversionRate: number;
  avgTimeToConvert: number; // minutes
  bounceRate: number; // %
  
  byChannel: AcquisitionChannel[];
  byPeriod: {
    period: string; // '2024-W01', '2024-01', etc
    visitors: number;
    signups: number;
    conversions: number;
  }[];
  
  funnel: AcquisitionFunnel;
  topLandingPages: {
    url: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATION (Ativação)
// ═══════════════════════════════════════════════════════════════

export interface ActivationMilestone {
  milestone: 'signup' | 'verify' | 'profile' | 'first_search' | 'first_match' | 'first_booking' | 'first_session';
  label: string;
  users: number;
  percentage: number; // % of signups
  avgTimeFromSignup: number; // minutes
  completionRate: number; // % who completed within ideal timeframe
  idealTimeframe: number; // minutes
}

export interface OnboardingMetrics {
  totalNewUsers: number;
  activatedUsers: number; // Completed all critical milestones
  activationRate: number; // %
  avgTimeToActivate: number; // minutes
  
  milestones: ActivationMilestone[];
  
  dropoffPoints: {
    step: string;
    dropoffCount: number;
    dropoffRate: number;
  }[];
  
  // Cohort-based activation
  bySignupCohort: {
    cohort: string; // 'Week 1 Dec', etc
    signups: number;
    activated: number;
    activationRate: number;
    avgTimeToActivate: number;
  }[];
  
  // Engagement in first X days
  firstWeekEngagement: {
    day: number;
    activeUsers: number;
    actionsPerUser: number;
    retentionRate: number; // % still active
  }[];
}

export interface ActivationHealth {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  
  metrics: {
    d1Retention: number; // % Day 1
    d7Retention: number; // % Day 7
    d30Retention: number; // % Day 30
    avgSessionsFirstWeek: number;
    avgActionsFirstWeek: number;
    timeToAha: number; // Time to "aha moment" (first booking)
  };
  
  issues: {
    issue: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// RETENTION (Retenção)
// ═══════════════════════════════════════════════════════════════

export interface RetentionCohort {
  cohort: string; // 'Jan 2024', 'Week 1', etc
  size: number; // Users in cohort
  
  // Retention by period
  d1: number; // % retained day 1
  d7: number; // % retained day 7
  d30: number; // % retained day 30
  d60: number;
  d90: number;
  d180: number;
  
  // Additional metrics
  avgLifetimeValue: number; // R$
  churnRate: number; // %
  revivalRate: number; // % of churned users who came back
}

export interface ChurnAnalysis {
  totalChurned: number;
  churnRate: number; // %
  
  bySegment: {
    segment: string; // 'Free users', 'Paid users', 'Professional', 'Family'
    churned: number;
    churnRate: number;
    mainReasons: string[];
  }[];
  
  churnPrediction: {
    atRiskUsers: number;
    predictedChurnNext30Days: number;
    confidence: number; // %
  };
  
  preventionOpportunities: {
    segment: string;
    atRiskCount: number;
    suggestedAction: string;
    potentialSavings: number; // R$/month
  }[];
}

export interface RetentionMetrics {
  activeUsers: number;
  returningUsers: number;
  newUsers: number;
  
  retentionRates: {
    d1: number;
    d7: number;
    d30: number;
    d90: number;
  };
  
  cohorts: RetentionCohort[];
  churn: ChurnAnalysis;
  
  // Engagement depth
  engagementDistribution: {
    category: 'Power Users' | 'Regular Users' | 'Casual Users' | 'At Risk';
    count: number;
    percentage: number;
    avgSessionsPerWeek: number;
    retentionRate: number;
  }[];
  
  // Resurrection metrics
  resurrection: {
    dormantUsers: number; // Not active in 30 days
    resurrectedUsers: number; // Came back after dormant
    resurrectionRate: number; // %
    avgDormancyPeriod: number; // days
  };
}

// ═══════════════════════════════════════════════════════════════
// REVENUE (Receita)
// ═══════════════════════════════════════════════════════════════

export interface LTVCalculation {
  segment: string;
  
  // Lifetime Value
  ltv: number; // R$
  ltvCalculationMethod: '3-month' | '6-month' | '12-month' | 'cohort-based';
  
  // Supporting metrics
  avgRevenuePerUser: number; // R$/month
  avgCustomerLifetime: number; // months
  avgPurchaseFrequency: number; // purchases/month
  avgOrderValue: number; // R$
  
  // CAC comparison
  cac: number; // Customer acquisition cost
  ltvCacRatio: number; // Should be > 3
  
  // Payback period
  paybackPeriod: number; // months to recover CAC
}

export interface RevenueGrowth {
  currentMRR: number;
  previousMRR: number;
  mrrGrowth: number; // %
  
  currentARR: number;
  projectedARR: number;
  
  // Growth decomposition
  newRevenue: number; // From new customers
  expansionRevenue: number; // From upsells/cross-sells
  contractionRevenue: number; // From downgrades
  churnedRevenue: number; // Lost from churn
  
  netRevenueRetention: number; // % (should be > 100%)
  
  // Forecasts
  forecast30Days: number;
  forecast60Days: number;
  forecast90Days: number;
  forecastConfidence: number; // %
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  
  bySegment: {
    segment: string;
    revenue: number;
    percentage: number;
    growth: number; // %
  }[];
  
  ltv: LTVCalculation[];
  growth: RevenueGrowth;
  
  // Revenue health
  health: {
    score: number; // 0-100
    quickRatio: number; // (New + Expansion) / (Contraction + Churn)
    ruleOf40: number; // Growth% + Profit Margin%
    burnMultiple: number; // Cash burned / Net new ARR
  };
}

// ═══════════════════════════════════════════════════════════════
// REFERRAL (Indicações)
// ═══════════════════════════════════════════════════════════════

export interface ReferralProgram {
  totalReferrals: number;
  successfulReferrals: number; // Led to signup
  convertedReferrals: number; // Led to paying customer
  
  conversionRate: number; // %
  referralRevenue: number; // R$
  
  topReferrers: {
    userId: string;
    name: string;
    referrals: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }[];
  
  viralCoefficient: number; // New users from referrals / Total new users
  kFactor: number; // Average invites * conversion rate
  
  // Program effectiveness
  effectiveness: {
    avgTimeToFirstReferral: number; // days after signup
    avgReferralsPerUser: number;
    referralActivationRate: number; // % of referred users who activate
    referredUserLTV: number; // vs organic LTV
  };
}

export interface ReferralMetrics {
  program: ReferralProgram;
  
  // Growth loops
  growthLoops: {
    loop: 'invite' | 'share' | 'social' | 'organic';
    label: string;
    newUsers: number;
    cost: number;
    efficiency: number; // New users / Cost
  }[];
  
  // Viral mechanics
  viralMetrics: {
    viralCycleTime: number; // days
    viralCoefficient: number;
    growthRate: number; // %
    doublingTime: number; // days to double user base
  };
}

// ═══════════════════════════════════════════════════════════════
// COMBINED DASHBOARD
// ═══════════════════════════════════════════════════════════════

export interface GrowthDashboard {
  // Summary scores
  overallHealth: number; // 0-100
  
  // AARRR breakdown
  acquisition: {
    score: number;
    metrics: AcquisitionMetrics;
  };
  
  activation: {
    score: number;
    metrics: OnboardingMetrics;
    health: ActivationHealth;
  };
  
  retention: {
    score: number;
    metrics: RetentionMetrics;
  };
  
  revenue: {
    score: number;
    metrics: RevenueMetrics;
  };
  
  referral: {
    score: number;
    metrics: ReferralMetrics;
  };
  
  // Key insights
  insights: {
    type: 'opportunity' | 'warning' | 'success';
    category: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
  
  // Time period
  periodStart: Date;
  periodEnd: Date;
  comparisonPeriod?: {
    start: Date;
    end: Date;
  };
}

export interface GrowthFilters {
  dateFrom?: Date;
  dateTo?: Date;
  segment?: 'professional' | 'family' | 'all';
  channel?: string;
  cohort?: string;
}

export interface GrowthExperiment {
  id: string;
  name: string;
  hypothesis: string;
  category: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral';
  status: 'planning' | 'running' | 'completed' | 'paused';
  
  startDate: Date;
  endDate?: Date;
  
  targetMetric: string;
  baselineValue: number;
  targetValue: number;
  currentValue?: number;
  
  variants: {
    name: string;
    allocation: number; // %
    users: number;
    conversions: number;
    conversionRate: number;
  }[];
  
  results?: {
    winner?: string;
    improvement: number; // %
    confidence: number; // %
    significant: boolean;
  };
}
