/**
 * Torre de Controle V2 - Types
 * Dashboard decisório focado em saúde financeira, gargalos e riscos
 */

// ═══════════════════════════════════════════════════════════════
// CORE METRICS
// ═══════════════════════════════════════════════════════════════

export interface BusinessHealthMetrics {
  // Realidade do Negócio
  monthRevenue: {
    current: number;
    previous: number;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
    isMock: boolean;
  };
  
  burnRate: {
    amount: number;
    netBurn: number; // Positive = profit, Negative = burn
    status: 'profit' | 'neutral' | 'burning';
    isMock: boolean; // Flag para dados simulados
  };
  
  runway: {
    months: number;
    status: 'healthy' | 'warning' | 'critical';
    cashBalance: number;
    isMock: boolean;
  };
  
  mrrAtRisk: {
    amount: number;
    percentage: number;
    reasons: {
      label: string;
      value: number;
      count: number;
    }[];
  };
  
  systemHealth: {
    score: number; // 0-100
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// OPERATIONAL BOTTLENECKS
// ═══════════════════════════════════════════════════════════════

export interface OperationalBottlenecks {
  requestsBySLA: {
    underTwentyFour: {
      count: number;
      value: number;
      status: 'ok';
    };
    twentyFourToFortyEight: {
      count: number;
      value: number;
      status: 'warning';
    };
    overFortyEight: {
      count: number;
      value: number;
      status: 'critical';
    };
  };
  
  averageTimeToMatch: {
    hours: number;
    target: number;
    status: 'good' | 'acceptable' | 'poor';
    trend: 'improving' | 'stable' | 'worsening';
    last7Days: number[];
  };
  
  conversionFunnel: {
    created: { count: number; percentage: number };
    matched: { count: number; percentage: number; conversionRate: number };
    paid: { count: number; percentage: number; conversionRate: number };
    dropoffs: {
      createdToMatched: number;
      matchedToPaid: number;
    };
  };
}

// ═══════════════════════════════════════════════════════════════
// MARKETPLACE HEALTH
// ═══════════════════════════════════════════════════════════════

export interface MarketplaceHealth {
  availableProfessionals: {
    count: number;
    openDemand: number;
    balance: 'surplus' | 'balanced' | 'deficit';
    ratio: number; // Professionals per open request
  };
  
  postAcceptAbandonment: {
    rate: number;
    count: number;
    acceptableLimit: number;
    status: 'ok' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'worsening';
  };
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS (GA4)
// ═══════════════════════════════════════════════════════════════

export interface AnalyticsMetrics {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  conversionRate: number; // (newUsers / activeUsers) * 100
  topPages: Array<{
    page: string;
    views: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD COMPLETE
// ═══════════════════════════════════════════════════════════════

export interface ControlTowerDashboard {
  timestamp: Date;
  businessHealth: BusinessHealthMetrics;
  operations: OperationalBottlenecks;
  marketplace: MarketplaceHealth;
  analytics: AnalyticsMetrics;
  
  // Quick Actions (próximas ações prioritárias)
  urgentActions: {
    id: string;
    priority: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    impact: string;
    action: string;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// RISK LEVELS
// ═══════════════════════════════════════════════════════════════

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskIndicator {
  level: RiskLevel;
  message: string;
  value: number;
  threshold: number;
}
