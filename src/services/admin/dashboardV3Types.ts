/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TORRE DE CONTROLE v3 - TYPES & SCHEMAS
 * ═══════════════════════════════════════════════════════════════════════════
 * Contrato mínimo para a nova home operacional.
 *
 * Escopo suportado:
 * - Cards operacionais reais
 * - Fila crítica
 * - Alertas ativos
 * - Ranking local
 * - Freshness por fonte
 * - Sinal de base insuficiente/sample size
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS E CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type TrendDirection = 'up' | 'down' | 'stable';
export type OperationalStatus = 'ok' | 'warning' | 'critical' | 'info';
export type TimeWindow = 7 | 14 | 30 | 60 | 90;

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS BASE - Freshness e Sample Size
// ═══════════════════════════════════════════════════════════════════════════

export interface SampleMeta {
  sampleSize: number;
  minimumRequired: number;
  isSufficient: boolean;
  note?: string;
}

export interface SourceFreshness {
  source: 'firebase' | 'stripe' | 'ga4';
  status: 'fresh' | 'stale' | 'unavailable';
  lastSuccessAt?: string;
  lastAttemptAt?: string;
  delayMinutes?: number;
  reason?: string;
}

export interface RegionRef {
  region: string;
  label: string;
  cidade?: string;
  estado?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME OPERACIONAL - CARDS
// ═══════════════════════════════════════════════════════════════════════════

export interface OperationalCard {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  status: OperationalStatus;
  trend?: {
    direction: TrendDirection;
    changePercent: number;
  };
  source: Array<'firebase' | 'stripe' | 'ga4'>;
  sample?: SampleMeta;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME OPERACIONAL - FILA CRÍTICA
// ═══════════════════════════════════════════════════════════════════════════

export interface CriticalQueueItem {
  id: string;
  title: string;
  region: RegionRef;
  specialty?: string;
  shift?: string;
  status: string;
  priority: 'critical' | 'high' | 'medium';
  hoursWaiting: number;
  owner?: string;
  nextAction?: string;
  createdAt: string;
}

export interface CriticalQueue {
  total: number;
  items: CriticalQueueItem[];
  sample?: SampleMeta;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME OPERACIONAL - ALERTAS ATIVOS
// ═══════════════════════════════════════════════════════════════════════════

export interface ActiveAlert {
  id: string;
  type: 'liquidity' | 'quality' | 'financial' | 'support' | 'data' | 'other';
  severity: AlertSeverity;
  title: string;
  description: string;
  count: number;
  createdAt: string;
  owner?: string;
  reactionSlaMinutes?: number;
  source: Array<'firebase' | 'stripe' | 'ga4'>;
  sample?: SampleMeta;
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

export interface ActiveAlerts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  items: ActiveAlert[];
  sample?: SampleMeta;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME OPERACIONAL - RANKING LOCAL
// ═══════════════════════════════════════════════════════════════════════════

export interface LocalRankingItem {
  region: string;
  label: string;
  cidade?: string;
  estado?: string;
  specialty?: string;

  /** Jobs elegíveis observados na janela local */
  eligibleJobs: number;

  /** Oferta observada por profissionais únicos associados aos jobs elegíveis */
  observedSupply: number;

  /** Razão simples demanda/oferta quando há oferta observada */
  demandSupplyRatio?: number;

  /** Quantidade local de jobs críticos (sem profissional +48h) */
  localCriticalJobs: number;

  /** Sinal operacional local */
  localCriticality: 'stable' | 'attention' | 'critical';

  /** Observações honestas sobre qualidade/modelagem dos campos */
  notes?: string[];

  sample?: SampleMeta;
}

export interface LocalRanking {
  items: LocalRankingItem[];
  freshness: SourceFreshness;
  observation: {
    supplyDefinition: string;
    ratioPolicy: string;
    limitations: string[];
  };
  sample?: SampleMeta;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE DA HOME OPERACIONAL
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardV3Response {
  /** Timestamp da geração */
  timestamp: string;
  /** Janela de tempo dos dados */
  window: TimeWindow;
  /** Filtro de região (se aplicado) */
  regionFilter?: string;
  /** Filtro de especialidade local (se aplicado) */
  specialtyFilter?: string;
  /** Dados vieram do cache? */
  cached: boolean;

  /** Freshness por fonte */
  freshness: {
    firebase: SourceFreshness;
    stripe: SourceFreshness;
    ga4: SourceFreshness;
  };

  /** Cards operacionais reais */
  cards: OperationalCard[];

  /** Fila crítica */
  criticalQueue: CriticalQueue;

  /** Alertas ativos */
  activeAlerts: ActiveAlerts;

  /** Ranking local */
  localRanking: LocalRanking;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS DE TIPAGEM
// ═══════════════════════════════════════════════════════════════════════════

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
