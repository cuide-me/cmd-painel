/**
 * Pipeline V2 - Advanced Sales Pipeline Types
 * Multi-stage tracking, deal analysis, velocity metrics
 */

// ═══════════════════════════════════════════════════════════════
// PIPELINE STAGES
// ═══════════════════════════════════════════════════════════════

export type PipelineStage = 
  | 'lead'           // Leads capturados
  | 'qualified'      // Qualificados (SQL)
  | 'meeting'        // Reunião agendada
  | 'proposal'       // Proposta enviada
  | 'negotiation'    // Em negociação
  | 'closed_won'     // Fechado ganho
  | 'closed_lost';   // Fechado perdido

export interface PipelineStageConfig {
  stage: PipelineStage;
  name: string;
  order: number;
  probability: number; // % chance de fechar
  averageDuration: number; // dias médios neste estágio
  color: string;
  icon: string;
}

// ═══════════════════════════════════════════════════════════════
// DEAL
// ═══════════════════════════════════════════════════════════════

export interface Deal {
  id: string;
  title: string;
  
  // Customer info
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerType: 'professional' | 'family' | 'enterprise';
  
  // Deal details
  value: number; // R$ - valor esperado
  stage: PipelineStage;
  probability: number; // % (0-100)
  expectedCloseDate: Date;
  
  // Product/Plan
  product: string; // 'basic', 'pro', 'premium', 'enterprise'
  billingCycle: 'monthly' | 'annual';
  
  // Tracking
  createdAt: Date;
  lastActivity: Date;
  daysInStage: number;
  daysInPipeline: number;
  
  // Assignment
  ownerId: string;
  ownerName: string;
  
  // Source
  source: 'inbound' | 'outbound' | 'referral' | 'partnership';
  campaign?: string;
  
  // Status
  status: 'active' | 'won' | 'lost' | 'on_hold';
  lostReason?: string;
  
  // Weighted value
  weightedValue: number; // value * probability
  
  // Activities
  activitiesCount: number;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  
  // Tags
  tags: string[];
  
  // Health
  healthScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE METRICS
// ═══════════════════════════════════════════════════════════════

export interface PipelineMetrics {
  // Overview
  totalDeals: number;
  totalValue: number;
  weightedValue: number; // Weighted by probability
  averageDealSize: number;
  
  // By Stage
  byStage: {
    stage: PipelineStage;
    stageName: string;
    count: number;
    value: number;
    weightedValue: number;
    averageDealSize: number;
    averageDaysInStage: number;
    conversionRate: number; // % para próximo estágio
    stuckDeals: number; // Deals parados há muito tempo
  }[];
  
  // Conversion Funnel
  funnel: {
    stage: PipelineStage;
    stageName: string;
    count: number;
    value: number;
    conversionFromPrevious: number; // %
    dropoffFromPrevious: number; // %
    cumulativeConversion: number; // % from top of funnel
  }[];
  
  // Win/Loss
  winRate: number; // %
  closedWon: {
    count: number;
    value: number;
    averageDealSize: number;
    averageSalesCycle: number; // days
  };
  closedLost: {
    count: number;
    value: number;
    topReasons: {
      reason: string;
      count: number;
      percentage: number;
      lostValue: number;
    }[];
  };
  
  // Time metrics
  averageSalesCycle: number; // days
  salesCycleByStage: {
    stage: PipelineStage;
    averageDays: number;
    medianDays: number;
  }[];
  
  // Velocity (see separate interface)
  velocity: SalesVelocityMetrics;
  
  // Health
  pipelineHealth: {
    score: number; // 0-100
    atRiskDeals: number;
    staleDeals: number; // No activity >7 days
    overdueFollowUps: number;
  };
  
  // By segment
  byCustomerType: {
    type: 'professional' | 'family' | 'enterprise';
    count: number;
    value: number;
    winRate: number;
    averageDealSize: number;
  }[];
  
  // By owner
  byOwner: {
    ownerId: string;
    ownerName: string;
    dealsCount: number;
    pipelineValue: number;
    winRate: number;
    averageDealSize: number;
    averageSalesCycle: number;
  }[];
  
  // Forecast
  forecast: {
    committed: number; // High probability deals
    bestCase: number;
    worstCase: number;
    mostLikely: number; // Weighted value
  };
}

// ═══════════════════════════════════════════════════════════════
// SALES VELOCITY
// ═══════════════════════════════════════════════════════════════

export interface SalesVelocityMetrics {
  // Current velocity
  currentVelocity: number; // $ per day
  previousVelocity: number;
  velocityChange: number; // %
  
  // Components
  components: {
    numberOfDeals: number;
    averageDealValue: number;
    winRate: number; // %
    salesCycleLength: number; // days
  };
  
  // Formula: (Deals × Deal Value × Win Rate) / Sales Cycle Length
  
  // Velocity by stage
  byStage: {
    stage: PipelineStage;
    velocity: number;
    dealsMovedIn: number; // Last 30 days
    dealsMovedOut: number;
    averageDaysToProgress: number;
  }[];
  
  // Velocity trends (last 12 weeks)
  trends: {
    week: string;
    velocity: number;
    deals: number;
    avgDealSize: number;
    winRate: number;
    cycleLength: number;
  }[];
  
  // Bottlenecks
  bottlenecks: {
    stage: PipelineStage;
    stageName: string;
    averageStuckDays: number;
    affectedDeals: number;
    estimatedImpact: number; // $ lost per day
    recommendation: string;
  }[];
  
  // Velocity forecast
  forecast: {
    next30Days: number; // Expected revenue
    next60Days: number;
    next90Days: number;
    confidence: number; // %
  };
}

// ═══════════════════════════════════════════════════════════════
// CONVERSION ANALYTICS
// ═══════════════════════════════════════════════════════════════

export interface ConversionAnalytics {
  // Overall conversion
  overallConversion: {
    leadToCustomer: number; // %
    qualifiedToCustomer: number; // %
    proposalToCustomer: number; // %
  };
  
  // Stage-to-stage conversion
  stageConversions: {
    fromStage: PipelineStage;
    toStage: PipelineStage;
    rate: number; // %
    averageTime: number; // days
    dealCount: number;
    
    // Benchmarks
    benchmark: number; // Industry standard %
    performance: 'above' | 'at' | 'below';
  }[];
  
  // Drop-off analysis
  dropoffs: {
    stage: PipelineStage;
    stageName: string;
    dropoffRate: number; // %
    dropoffCount: number;
    lostValue: number;
    topReasons: string[];
    recoverable: number; // deals that could be saved
  }[];
  
  // Time to convert
  timeToConvert: {
    fromStage: PipelineStage;
    toStage: PipelineStage;
    average: number; // days
    median: number;
    p25: number; // 25th percentile
    p75: number; // 75th percentile
    fastest: number;
    slowest: number;
  }[];
  
  // Conversion by segment
  bySegment: {
    segment: string;
    leadToCustomer: number; // %
    averageSalesCycle: number;
    winRate: number;
    averageDealSize: number;
  }[];
  
  // Conversion by source
  bySource: {
    source: 'inbound' | 'outbound' | 'referral' | 'partnership';
    conversionRate: number; // %
    averageDealSize: number;
    averageSalesCycle: number;
    roi: number; // Return on investment
  }[];
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE HEALTH
// ═══════════════════════════════════════════════════════════════

export interface PipelineHealthAnalysis {
  // Overall score
  healthScore: number; // 0-100
  
  // Coverage
  coverage: {
    currentPipelineValue: number;
    monthlyTarget: number;
    coverageRatio: number; // Should be 3-5x
    months: number; // Months of runway
    status: 'healthy' | 'warning' | 'critical';
  };
  
  // Distribution
  distribution: {
    metric: 'stage' | 'owner' | 'age' | 'size';
    analysis: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  }[];
  
  // At-risk deals
  atRisk: {
    deal: Deal;
    riskFactors: string[];
    riskScore: number; // 0-100
    recommendation: string;
  }[];
  
  // Stale deals
  staleDeals: {
    deal: Deal;
    daysStale: number;
    lastActivity: Date;
    recommendedAction: string;
  }[];
  
  // Quality indicators
  quality: {
    indicator: string;
    value: number;
    target: number;
    status: 'good' | 'warning' | 'poor';
  }[];
}

// ═══════════════════════════════════════════════════════════════
// FORECASTING
// ═══════════════════════════════════════════════════════════════

export interface PipelineForecast {
  // Time-based forecast
  periods: {
    period: string; // 'Jan 2025'
    periodType: 'month' | 'quarter';
    
    committed: number; // >70% probability
    bestCase: number; // >50% probability
    mostLikely: number; // Weighted by probability
    worstCase: number; // >90% probability only
    
    expectedCloses: number; // Deal count
    confidence: number; // %
  }[];
  
  // Deal-based forecast
  deals: {
    deal: Deal;
    forecastCategory: 'commit' | 'best_case' | 'pipeline' | 'omitted';
    expectedCloseMonth: string;
    confidence: number;
  }[];
  
  // Accuracy tracking
  accuracy: {
    period: string;
    forecasted: number;
    actual: number;
    accuracy: number; // %
    variance: number; // $
  }[];
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY TRACKING
// ═══════════════════════════════════════════════════════════════

export interface DealActivity {
  id: string;
  dealId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'value_change';
  description: string;
  createdAt: Date;
  createdBy: string;
  
  // Stage change specifics
  oldStage?: PipelineStage;
  newStage?: PipelineStage;
  
  // Value change specifics
  oldValue?: number;
  newValue?: number;
  
  // Meeting specifics
  meetingType?: string;
  attendees?: string[];
  outcome?: string;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export interface PipelineDashboard {
  // Summary
  summary: {
    totalDeals: number;
    totalValue: number;
    weightedValue: number;
    winRate: number;
    averageDealSize: number;
    averageSalesCycle: number;
    velocity: number; // $ per day
  };
  
  // Detailed metrics
  metrics: PipelineMetrics;
  velocity: SalesVelocityMetrics;
  conversions: ConversionAnalytics;
  health: PipelineHealthAnalysis;
  forecast: PipelineForecast;
  
  // Deals
  deals: Deal[];
  topDeals: Deal[]; // Largest opportunities
  closingSoon: Deal[]; // Expected close <30 days
  
  // Insights
  insights: {
    type: 'opportunity' | 'warning' | 'critical' | 'success';
    category: 'velocity' | 'conversion' | 'health' | 'forecast';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    estimatedValue?: number;
  }[];
  
  // Time period
  periodStart: Date;
  periodEnd: Date;
}

export interface PipelineFilters {
  dateFrom?: Date;
  dateTo?: Date;
  stage?: PipelineStage | PipelineStage[];
  ownerId?: string;
  customerType?: 'professional' | 'family' | 'enterprise';
  source?: 'inbound' | 'outbound' | 'referral' | 'partnership';
  minValue?: number;
  maxValue?: number;
  status?: 'active' | 'won' | 'lost' | 'on_hold';
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    stage: 'lead',
    name: 'Lead',
    order: 1,
    probability: 10,
    averageDuration: 3,
    color: '#94a3b8',
    icon: '👤'
  },
  {
    stage: 'qualified',
    name: 'Qualificado',
    order: 2,
    probability: 20,
    averageDuration: 5,
    color: '#3b82f6',
    icon: '✅'
  },
  {
    stage: 'meeting',
    name: 'Reunião',
    order: 3,
    probability: 40,
    averageDuration: 7,
    color: '#8b5cf6',
    icon: '📅'
  },
  {
    stage: 'proposal',
    name: 'Proposta',
    order: 4,
    probability: 60,
    averageDuration: 10,
    color: '#f59e0b',
    icon: '📄'
  },
  {
    stage: 'negotiation',
    name: 'Negociação',
    order: 5,
    probability: 80,
    averageDuration: 7,
    color: '#10b981',
    icon: '💬'
  },
  {
    stage: 'closed_won',
    name: 'Fechado Ganho',
    order: 6,
    probability: 100,
    averageDuration: 0,
    color: '#22c55e',
    icon: '🎉'
  },
  {
    stage: 'closed_lost',
    name: 'Fechado Perdido',
    order: 7,
    probability: 0,
    averageDuration: 0,
    color: '#ef4444',
    icon: '❌'
  }
];
