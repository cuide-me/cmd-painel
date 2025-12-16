/**
 * Financeiro 2.0 - Advanced Revenue Analytics Types
 * Sprint 4: MRR/ARR tracking, LTV, forecasting, cohort revenue analysis
 */

// ═══════════════════════════════════════════════════════════════
// MRR/ARR TRACKING
// ═══════════════════════════════════════════════════════════════

export interface MRRMetrics {
  currentMRR: number; // Monthly Recurring Revenue atual
  previousMRR: number; // MRR do mês anterior
  mrrGrowthRate: number; // % crescimento MoM
  mrrGrowthAbsolute: number; // R$ crescimento
  
  // MRR Breakdown (Movement Analysis)
  newMRR: number; // De novos clientes
  expansionMRR: number; // Upsells/upgrades
  contractionMRR: number; // Downgrades
  churnedMRR: number; // Clientes perdidos
  reactivationMRR: number; // Clientes que voltaram
  
  // Net metrics
  netNewMRR: number; // New + Expansion - Contraction - Churn
  netRevenueRetention: number; // % (>100% é bom)
  grossRevenueRetention: number; // %
  
  // Quick Ratio
  quickRatio: number; // (New + Expansion) / (Contraction + Churn) - target >4
  
  // By segment
  byPlan: {
    planName: string;
    mrr: number;
    customers: number;
    arpu: number; // Average Revenue Per User
    growth: number; // %
  }[];
  
  byCustomerType: {
    type: 'professional' | 'family' | 'enterprise';
    mrr: number;
    percentage: number;
    growth: number;
  }[];
}

export interface ARRMetrics {
  currentARR: number; // Annual Recurring Revenue
  projectedARR: number; // Based on current MRR
  arrGrowthRate: number; // % YoY
  
  // Rule of 40
  ruleOf40Score: number; // Growth% + Profit Margin% (target >40)
  growthRate: number; // %
  profitMargin: number; // %
  
  // Forecast
  arr30Days: number;
  arr60Days: number;
  arr90Days: number;
  arr12Months: number;
  
  forecastConfidence: number; // %
  forecastMethod: 'linear' | 'exponential' | 'moving_average';
}

// ═══════════════════════════════════════════════════════════════
// LTV (LIFETIME VALUE)
// ═══════════════════════════════════════════════════════════════

export interface LTVMetrics {
  // Overall LTV
  averageLTV: number; // R$
  medianLTV: number; // R$
  
  // By segment
  bySegment: {
    segment: string;
    ltv: number;
    calculationMethod: 'historical' | 'predictive' | 'cohort';
    
    // Supporting metrics
    avgMonthlyRevenue: number; // R$
    avgCustomerLifespan: number; // months
    avgGrossMargin: number; // %
    churnRate: number; // %
    
    // CAC comparison
    cac: number; // Customer Acquisition Cost
    ltvCacRatio: number; // Should be >3
    paybackPeriod: number; // months
    
    confidence: number; // % de confiança no cálculo
  }[];
  
  // LTV Cohorts (by signup month)
  cohorts: {
    cohort: string; // 'Jan 2024', 'Feb 2024'
    size: number; // customers
    
    // LTV over time
    ltv1Month: number;
    ltv3Months: number;
    ltv6Months: number;
    ltv12Months: number;
    projectedLifetimeLTV: number;
    
    // Revenue metrics
    totalRevenue: number;
    avgRevenuePerCustomer: number;
    retentionRate: number; // %
  }[];
  
  // LTV predictions
  predictions: {
    segment: string;
    currentLTV: number;
    predicted6MonthLTV: number;
    predicted12MonthLTV: number;
    growthTrajectory: 'accelerating' | 'steady' | 'declining';
  }[];
}

// ═══════════════════════════════════════════════════════════════
// REVENUE CHURN
// ═══════════════════════════════════════════════════════════════

export interface RevenueChurnMetrics {
  // Churn rates
  grossRevenueChurnRate: number; // % - revenue lost from cancellations
  netRevenueChurnRate: number; // % - gross churn - expansion
  customerChurnRate: number; // % - customers lost
  
  // Churn breakdown
  voluntaryChurn: {
    rate: number; // %
    mrr: number; // R$ lost
    customers: number;
    topReasons: {
      reason: string;
      count: number;
      percentage: number;
    }[];
  };
  
  involuntaryChurn: {
    rate: number; // % - payment failures
    mrr: number;
    customers: number;
    recoverable: number; // customers we can save
  };
  
  // Cohort churn analysis
  cohortChurn: {
    cohort: string;
    initialSize: number;
    currentSize: number;
    churnedCount: number;
    churnRate: number;
    revenueRetention: number; // %
  }[];
  
  // Churn prediction
  atRisk: {
    count: number;
    mrr: number; // R$ em risco
    segments: {
      segment: string;
      count: number;
      mrr: number;
      riskScore: number; // 0-100
    }[];
  };
}

// ═══════════════════════════════════════════════════════════════
// REVENUE FORECASTING
// ═══════════════════════════════════════════════════════════════

export interface RevenueForecast {
  // Time-based forecasts
  forecasts: {
    period: string; // 'Jan 2025', 'Feb 2025'
    periodType: 'month' | 'quarter' | 'year';
    
    // Predicted values
    predictedMRR: number;
    predictedARR: number;
    predictedRevenue: number;
    
    // Confidence intervals
    lowEstimate: number; // Pessimistic (10th percentile)
    highEstimate: number; // Optimistic (90th percentile)
    confidence: number; // %
    
    // Breakdown
    expectedNewCustomers: number;
    expectedChurn: number;
    expectedExpansion: number;
  }[];
  
  // Forecast models
  models: {
    name: 'Linear Regression' | 'Moving Average' | 'Exponential Smoothing' | 'ARIMA';
    accuracy: number; // % - based on historical validation
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  }[];
  
  // Scenario planning
  scenarios: {
    name: 'Best Case' | 'Base Case' | 'Worst Case';
    assumptions: string[];
    
    mrr30Days: number;
    mrr60Days: number;
    mrr90Days: number;
    mrr12Months: number;
    
    probability: number; // %
  }[];
  
  // Key assumptions
  assumptions: {
    avgChurnRate: number;
    avgExpansionRate: number;
    avgNewCustomerGrowth: number;
    seasonalityFactor: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// COHORT REVENUE ANALYSIS
// ═══════════════════════════════════════════════════════════════

export interface CohortRevenueAnalysis {
  cohorts: {
    cohort: string; // 'Jan 2024'
    cohortDate: Date;
    initialCustomers: number;
    currentCustomers: number;
    
    // Revenue over time (cumulative)
    revenue: {
      month0: number; // First month
      month1: number;
      month2: number;
      month3: number;
      month6: number;
      month12: number;
      month24: number;
      total: number;
    };
    
    // Metrics
    avgRevenuePerCustomer: number;
    projectedLTV: number;
    retentionRate: number; // %
    paybackMonths: number; // Meses para recuperar CAC
    
    // Cohort maturity
    ageInMonths: number;
    maturityStatus: 'immature' | 'maturing' | 'mature';
    dataQuality: 'low' | 'medium' | 'high';
  }[];
  
  // Cohort comparison
  comparison: {
    metric: 'LTV' | 'Retention' | 'Revenue' | 'Churn';
    bestCohort: string;
    worstCohort: string;
    trend: 'improving' | 'stable' | 'declining';
  }[];
}

// ═══════════════════════════════════════════════════════════════
// UNIT ECONOMICS
// ═══════════════════════════════════════════════════════════════

export interface UnitEconomics {
  // Customer metrics
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
  ltvCacRatio: number; // Should be >3
  
  // Payback
  paybackPeriod: number; // months
  paybackPeriodTarget: number; // months (benchmark)
  
  // Margins
  grossMargin: number; // %
  contributionMargin: number; // %
  
  // Efficiency metrics
  magicNumber: number; // Net New ARR / Sales & Marketing Spend (target >0.75)
  cacPaybackMonths: number;
  
  // By channel
  byChannel: {
    channel: string;
    cac: number;
    ltv: number;
    ltvCacRatio: number;
    roi: number; // %
    efficiency: 'excellent' | 'good' | 'acceptable' | 'poor';
  }[];
  
  // Burn metrics
  burnRate: number; // R$/month
  runway: number; // months
  burnMultiple: number; // Cash burned / Net new ARR (target <1.5)
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE DASHBOARD
// ═══════════════════════════════════════════════════════════════

export interface FinanceiroDashboard {
  // Summary
  summary: {
    mrr: number;
    arr: number;
    mrrGrowthRate: number;
    customerCount: number;
    arpu: number;
    healthScore: number; // 0-100
  };
  
  // Detailed metrics
  mrr: MRRMetrics;
  arr: ARRMetrics;
  ltv: LTVMetrics;
  churn: RevenueChurnMetrics;
  forecast: RevenueForecast;
  cohorts: CohortRevenueAnalysis;
  unitEconomics: UnitEconomics;
  
  // Time period
  periodStart: Date;
  periodEnd: Date;
  comparisonPeriod?: {
    start: Date;
    end: Date;
  };
  
  // Insights
  insights: {
    type: 'opportunity' | 'warning' | 'critical' | 'success';
    category: 'mrr' | 'arr' | 'ltv' | 'churn' | 'forecast' | 'unit_economics';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    estimatedValue?: number; // R$ de impacto potencial
  }[];
  
  // Key metrics trends (last 12 months)
  trends: {
    month: string;
    mrr: number;
    arr: number;
    customers: number;
    churnRate: number;
    nrr: number; // Net Revenue Retention
  }[];
}

export interface FinanceiroFilters {
  dateFrom?: Date;
  dateTo?: Date;
  segment?: 'professional' | 'family' | 'enterprise' | 'all';
  plan?: string;
  includeChurned?: boolean;
  cohort?: string;
}

// ═══════════════════════════════════════════════════════════════
// STRIPE INTEGRATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface StripeRevenueData {
  subscriptions: {
    id: string;
    customerId: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    plan: string;
    amount: number; // cents
    currency: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    canceledAt?: Date;
    created: Date;
  }[];
  
  invoices: {
    id: string;
    customerId: string;
    amount: number;
    amountPaid: number;
    status: 'paid' | 'open' | 'void' | 'uncollectible';
    created: Date;
    periodStart: Date;
    periodEnd: Date;
  }[];
  
  refunds: {
    id: string;
    amount: number;
    created: Date;
    reason?: string;
  }[];
}
