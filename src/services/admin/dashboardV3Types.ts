/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TORRE DE CONTROLE v3 - TYPES & SCHEMAS
 * ═══════════════════════════════════════════════════════════════════════════
 * Definições de tipos para o painel administrativo enterprise
 * 
 * Dimensões:
 * 1. Health Score (saúde geral do marketplace)
 * 2. Liquidez (demanda vs oferta, tempo de match)
 * 3. Financeiro (GMV, receita, take rate)
 * 4. Qualidade (NPS, avaliações, reclamações)
 * 5. Ativação (funis de conversão)
 * 6. Operacional (alertas, SLAs)
 * 7. Regional (performance por região)
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS E CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type TrendDirection = 'up' | 'down' | 'stable';
export type HealthLevel = 'excellent' | 'good' | 'warning' | 'critical';
export type TimeWindow = 7 | 14 | 30 | 60 | 90;

// Thresholds para Health Score
export const HEALTH_THRESHOLDS = {
  matchRate: { excellent: 80, good: 60, warning: 40 },
  avgMatchTimeHours: { excellent: 24, good: 48, warning: 72 },
  cancelRate: { excellent: 5, good: 10, warning: 20 },
  avgRating: { excellent: 4.5, good: 4.0, warning: 3.5 },
  demandSupplyRatio: { min: 0.5, ideal: 1.0, max: 2.0 },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 1. HEALTH SCORE - Indicador único de saúde do marketplace
// ═══════════════════════════════════════════════════════════════════════════

export interface HealthScore {
  /** Score geral de 0-100 */
  score: number;
  /** Nível qualitativo */
  level: HealthLevel;
  /** Scores por dimensão (0-100) */
  dimensions: {
    liquidity: number;    // Demanda vs Oferta balanceada
    velocity: number;     // Velocidade de match
    quality: number;      // Avaliações e satisfação
    financial: number;    // Saúde financeira
    retention: number;    // Retenção e recorrência
  };
  /** Comparação com período anterior */
  trend: {
    direction: TrendDirection;
    changePercent: number;
    previousScore: number;
  };
  /** Fatores mais impactantes (positivos e negativos) */
  topFactors: {
    positive: string[];
    negative: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. LIQUIDEZ - Demanda vs Oferta
// ═══════════════════════════════════════════════════════════════════════════

export interface LiquidityMetrics {
  /** Famílias ativas com pedidos no período */
  activeFamilies: {
    count: number;
    trend: TrendDirection;
    changePercent: number;
    byRegion: RegionBreakdown[];
  };
  
  /** Cuidadores ativos que realizaram serviços */
  activeCaregivers: {
    count: number;
    trend: TrendDirection;
    changePercent: number;
    byRegion: RegionBreakdown[];
    /** Cuidadores disponíveis vs ocupados */
    availabilityRate: number;
  };
  
  /** Ratio demanda/oferta (>1 = mais demanda que oferta) */
  demandSupplyRatio: {
    overall: number;
    byRegion: Array<{
      region: string;
      label: string;
      ratio: number;
      status: 'balanced' | 'excess_demand' | 'excess_supply';
    }>;
  };
  
  /** Tempo médio para match */
  avgMatchTime: {
    hours: number;
    trend: TrendDirection;
    changePercent: number;
    percentiles: {
      p50: number;
      p75: number;
      p90: number;
    };
  };
  
  /** Taxa de match (jobs com profissional / total) */
  matchRate: {
    percent: number;
    trend: TrendDirection;
    changePercent: number;
  };
  
  /** Jobs aguardando match por faixa de tempo */
  pendingJobs: {
    total: number;
    lessThan24h: number;
    between24and48h: number;
    moreThan48h: number;
    moreThan72h: number;
    oldestJobHours: number;
    urgentJobs: JobSummary[];
  };
}

export interface RegionBreakdown {
  region: string;
  label: string;
  cidade?: string;
  estado?: string;
  value: number;
  percent?: number;
}

export interface JobSummary {
  id: string;
  region: string;
  hoursWaiting: number;
  specialty?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. FINANCEIRO - GMV, Receita, Take Rate
// ═══════════════════════════════════════════════════════════════════════════

export interface FinancialMetrics {
  /** GMV - Gross Merchandise Value */
  gmv: {
    mtd: number;           // Month to date
    ytd: number;           // Year to date
    lastMonth: number;     // Mês anterior completo
    trend: TrendDirection;
    changePercent: number;
    byRegion: RegionBreakdown[];
    /** Projeção para fim do mês */
    projection: {
      estimated: number;
      confidence: 'high' | 'medium' | 'low';
    };
  };
  
  /** Ticket Médio */
  avgTicket: {
    value: number;
    trend: TrendDirection;
    changePercent: number;
    bySpecialty: Array<{
      specialty: string;
      avgValue: number;
      count: number;
    }>;
  };
  
  /** Take Rate efetivo (receita / GMV) */
  takeRate: {
    percent: number;
    trend: TrendDirection;
    changePercent: number;
  };
  
  /** Receita Líquida */
  netRevenue: {
    mtd: number;
    lastMonth: number;
    trend: TrendDirection;
    changePercent: number;
  };
  
  /** Chargebacks e Disputas */
  chargebacks: {
    count: number;
    totalValue: number;
    rate: number;
    trend: TrendDirection;
    pending: number;
  };
  
  /** Pagamentos por status */
  paymentStatus: {
    succeeded: { count: number; value: number };
    pending: { count: number; value: number };
    failed: { count: number; value: number };
    refunded: { count: number; value: number };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. QUALIDADE - NPS, Avaliações, Reclamações
// ═══════════════════════════════════════════════════════════════════════════

export interface QualityMetrics {
  /** NPS Score (-100 a 100) */
  nps: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    responses: number;
    trend: TrendDirection;
    changePoints: number;
  };
  
  /** Avaliação média dos serviços */
  avgRating: {
    overall: number;
    trend: TrendDirection;
    changePercent: number;
    distribution: {
      stars5: number;
      stars4: number;
      stars3: number;
      stars2: number;
      stars1: number;
    };
    /** Top e bottom cuidadores */
    topCaregivers: Array<{
      id: string;
      name: string;
      rating: number;
      services: number;
    }>;
    bottomCaregivers: Array<{
      id: string;
      name: string;
      rating: number;
      services: number;
      flags: string[];
    }>;
  };
  
  /** Taxa de recontratação (famílias que contratam 2+ vezes) */
  rehireRate: {
    percent: number;
    trend: TrendDirection;
    changePercent: number;
    /** Famílias por número de contratações */
    distribution: {
      once: number;
      twice: number;
      threeOrMore: number;
    };
  };
  
  /** Reclamações e incidentes */
  complaints: {
    count: number;
    rate: number;  // por 100 serviços
    trend: TrendDirection;
    changePercent: number;
    byType: Array<{
      type: string;
      count: number;
      percent: number;
    }>;
    unresolved: number;
  };
  
  /** Cancelamentos */
  cancellations: {
    count: number;
    rate: number;
    trend: TrendDirection;
    changePercent: number;
    byReason: Array<{
      reason: string;
      count: number;
      percent: number;
    }>;
    byInitiator: {
      family: number;
      caregiver: number;
      system: number;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ATIVAÇÃO - Funis de Conversão
// ═══════════════════════════════════════════════════════════════════════════

export interface ActivationMetrics {
  /** Funil de Famílias */
  familyFunnel: {
    /** Cadastros no período */
    signups: number;
    /** Famílias que criaram 1º pedido */
    firstOrder: {
      count: number;
      conversionRate: number;
      avgDaysToConvert: number;
    };
    /** Famílias que criaram 2º pedido */
    secondOrder: {
      count: number;
      conversionRate: number;
      avgDaysBetweenOrders: number;
    };
    /** Famílias recorrentes (3+) */
    recurring: {
      count: number;
      conversionRate: number;
    };
  };
  
  /** Funil de Cuidadores */
  caregiverFunnel: {
    /** Cadastros no período */
    signups: number;
    /** Perfil completo (100%) */
    profileComplete: {
      count: number;
      conversionRate: number;
      avgDaysToComplete: number;
    };
    /** Documentos verificados */
    documentsVerified: {
      count: number;
      conversionRate: number;
      avgDaysToVerify: number;
    };
    /** Primeiro serviço realizado */
    firstService: {
      count: number;
      conversionRate: number;
      avgDaysToFirstService: number;
    };
  };
  
  /** Cohort de retenção mensal (últimos 6 meses) */
  retentionCohorts: Array<{
    cohortMonth: string;
    signups: number;
    retention: {
      month1: number;
      month2: number;
      month3: number;
      month4: number;
      month5: number;
      month6: number;
    };
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. OPERACIONAL - Alertas e SLAs
// ═══════════════════════════════════════════════════════════════════════════

export interface OperationalMetrics {
  /** Alertas ativos */
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    items: OperationalAlert[];
  };
  
  /** SLA de match (tempo até profissional aceitar) */
  matchSLA: {
    target: number;  // horas
    achieved: number;  // %
    breached: number;  // quantidade
  };
  
  /** SLA de atendimento de tickets */
  supportSLA: {
    avgResponseTime: number;  // horas
    avgResolutionTime: number;  // horas
    openTickets: number;
    ticketsByPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  
  /** Profissionais com issues */
  caregiverIssues: {
    inactive: number;         // inativos com jobs pendentes
    lowRating: number;        // rating < 3.5
    highCancelRate: number;   // >25% de cancelamento
    documentsExpiring: number; // docs vencendo em 30 dias
  };
}

export interface OperationalAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  count: number;
  createdAt: string;
  affectedItems?: Array<{
    id: string;
    label: string;
    metadata?: Record<string, any>;
  }>;
  actions?: Array<{
    label: string;
    href: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. REGIONAL - Performance por Região
// ═══════════════════════════════════════════════════════════════════════════

export interface RegionalMetrics {
  /** Ranking de regiões por GMV */
  topRegionsByGMV: Array<{
    region: string;
    label: string;
    cidade?: string;
    estado?: string;
    gmv: number;
    jobs: number;
    avgTicket: number;
    matchRate: number;
    avgMatchTimeHours: number;
    activeFamilies: number;
    activeCaregivers: number;
    demandSupplyRatio: number;
    trend: TrendDirection;
  }>;
  
  /** Regiões com problemas */
  problemRegions: Array<{
    region: string;
    label: string;
    issues: string[];
    severity: AlertSeverity;
  }>;
  
  /** Cobertura geográfica */
  coverage: {
    totalRegions: number;
    activeRegions: number;
    regionsWithSupply: number;
    regionsWithDemand: number;
    regionsBalanced: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE COMPLETA DO DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardV3Response {
  /** Timestamp da geração */
  timestamp: string;
  /** Janela de tempo dos dados */
  window: TimeWindow;
  /** Filtro de região (se aplicado) */
  regionFilter?: string;
  /** Dados vieram do cache? */
  cached: boolean;
  
  /** Saúde geral do marketplace */
  healthScore: HealthScore;
  
  /** Métricas de liquidez */
  liquidity: LiquidityMetrics;
  
  /** Métricas financeiras */
  financial: FinancialMetrics;
  
  /** Métricas de qualidade */
  quality: QualityMetrics;
  
  /** Métricas de ativação */
  activation: ActivationMetrics;
  
  /** Métricas operacionais */
  operational: OperationalMetrics;
  
  /** Métricas regionais */
  regional: RegionalMetrics;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS DE TIPAGEM
// ═══════════════════════════════════════════════════════════════════════════

export function getHealthLevel(score: number): HealthLevel {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'critical';
}

export function getTrendDirection(current: number, previous: number): TrendDirection {
  const diff = current - previous;
  const threshold = Math.abs(previous) * 0.02; // 2% threshold
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
