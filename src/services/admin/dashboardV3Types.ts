/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PAINEL DE KPI v3 - TYPES & SCHEMAS
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

import type { TimeWindow } from '@/modules/shared/domain/time-window';

export type { TimeWindow } from '@/modules/shared/domain/time-window';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type TrendDirection = 'up' | 'down' | 'stable';
export type OperationalStatus = 'ok' | 'warning' | 'critical' | 'info';

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
  lastSuccessAt: string | null;
  delayMinutes: number | null;
  reason: string | null;
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

export interface AgingExtremeSeriesPoint {
  day: string;
  referenceWindowDays: TimeWindow;
  extremeItems: number;
  collectedAt: string;
}

export interface AgingExtremeVariation {
  current: number;
  previous: number | null;
  absolute: number | null;
  percent: number | null;
  hasBaseline: boolean;
  baselineDay: string | null;
}

export interface AgingExtremeRolling14dVariation {
  currentAverage: number;
  previousAverage: number | null;
  absolute: number | null;
  percent: number | null;
  hasBaseline: boolean;
  sampleDays: number;
}

export interface AgingExtremeMetrics {
  thresholdHours: number;
  methodologyVersion: 'v1';
  windowDays: TimeWindow;
  current: {
    extremeItems: number | null;
    collectedAt: string | null;
    status: 'available' | 'unavailable';
    reason: string | null;
  };
  seriesDaily: AgingExtremeSeriesPoint[];
  variation: {
    weekly: AgingExtremeVariation;
    rolling14d: AgingExtremeRolling14dVariation;
  };
}

export interface ExecutiveIndicator {
  id:
    | 'weekly_orders_created'
    | 'weekly_active_eligible_professionals'
    | 'orders_with_proposal_24h_rate'
    | 'avg_time_to_first_proposal_hours'
    | 'hiring_rate'
    | 'repurchase_rate'
    | 'cancellation_rate'
    | 'weekly_gmv'
    | 'platform_revenue'
    | 'verified_and_payout_enabled_professionals_rate'
    | 'critical_jobs_open_24h';
  title: string;
  value: number | string;
  unit?: '%' | 'h' | 'BRL';
  status: OperationalStatus;
  source: Array<'firebase' | 'stripe' | 'ga4'>;
  note?: string;
}

export interface BairroSupplyDemandItem {
  bairro: string;
  demandOrders: number;
  observedSupplyProfessionals: number;
  demandSupplyRatio: number | null;
}

export interface ExecutivePanel {
  reference: {
    weeklyStartAt: string;
    weeklyEndAt: string;
  };
  indicators: ExecutiveIndicator[];
  supplyDemandByBairro: BairroSupplyDemandItem[];
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

  /** Serie temporal e variacao de aging extremo (>72h) */
  agingExtreme: AgingExtremeMetrics;

  /** Painel executivo priorizado com indicadores operacionais essenciais */
  executivePanel: ExecutivePanel;
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
