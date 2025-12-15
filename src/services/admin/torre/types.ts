/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — TYPES
 * ────────────────────────────────────
 * Tipos centrais para o painel executivo
 * da plataforma Cuide-me.
 */

// ═══════════════════════════════════════
// OVERVIEW — VISÃO EXECUTIVA
// ═══════════════════════════════════════

export type KpiStatus = 'healthy' | 'warning' | 'critical';
export type KpiTrend = 'up' | 'down' | 'stable';

export interface Kpi {
  label: string;
  value: number;
  unit?: string;
  status: KpiStatus;
  trend: KpiTrend;
  trendValue?: number;
  tooltip: string;
  actionable: string; // Que decisão isso permite tomar?
}

export interface OverviewData {
  kpis: {
    activeFamilies: Kpi;
    activeProfessionals: Kpi;
    openRequests: Kpi;
    completedHires: Kpi;
    avgTimeToMatch: Kpi;
    abandonmentRate: Kpi;
  };
  timestamp: Date;
}

// ═══════════════════════════════════════
// ALERTAS & RISCOS
// ═══════════════════════════════════════

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertCategory = 
  | 'pipeline_stuck'
  | 'payment_failed'
  | 'quality_drop'
  | 'abandonment'
  | 'trust_risk'
  | 'operational';

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric: number;
  threshold: number;
  module: string; // qual módulo deve receber ação
  actionUrl?: string;
  createdAt: Date;
}

export interface AlertsData {
  critical: Alert[];
  high: Alert[];
  medium: Alert[];
  low: Alert[];
  totalActive: number;
}

// ═══════════════════════════════════════
// SERVICE DESK
// ═══════════════════════════════════════

export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketSource = 'detractor' | 'complaint' | 'bug' | 'question' | 'feature_request';

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userType: 'family' | 'professional';
  source: TicketSource;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  npsScore?: number; // se veio de NPS
  createdAt: Date;
  updatedAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
}

export interface ServiceDeskSummary {
  totalOpen: number;
  totalCritical: number;
  detractors: number;
  avgResponseTimeMinutes: number;
  ticketsOver24h: number;
  bySource: Record<TicketSource, number>;
  byPriority: Record<TicketPriority, number>;
  recentTickets: Ticket[];
}

// ═══════════════════════════════════════
// QUALIDADE & CONFIANÇA
// ═══════════════════════════════════════

export interface QualitySummary {
  avgRatingProfessionals: number;
  avgRatingFamilies: number;
  totalRatings: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  cancellations30d: number;
  complaints30d: number;
  trustScore: number; // 0-100 baseado em múltiplos fatores
}

// ═══════════════════════════════════════
// CRESCIMENTO & ATIVAÇÃO
// ═══════════════════════════════════════

export interface GrowthSummary {
  familySignupConversion: number; // cadastro → primeira solicitação
  professionalActivation: number; // cadastro → perfil 100%
  familyActivation30d: number; // famílias ativas dos últimos 30 dias
  professionalActivation30d: number;
  retention30d: number;
  churnRate: number;
  cac?: number; // custo de aquisição (se disponível)
  ltv?: number; // lifetime value (se disponível)
}

// ═══════════════════════════════════════
// MÓDULOS DA TORRE
// ═══════════════════════════════════════

export interface ModuleSummary {
  id: string;
  title: string;
  icon: string;
  metrics: Array<{
    label: string;
    value: string | number;
    status?: KpiStatus;
  }>;
  href: string;
  color: string;
}

export interface TorreModules {
  users: ModuleSummary;
  finance: ModuleSummary;
  pipeline: ModuleSummary;
  serviceDesk: ModuleSummary;
  quality: ModuleSummary;
  growth: ModuleSummary;
}

// ═══════════════════════════════════════
// PAYLOAD COMPLETO DA TORRE
// ═══════════════════════════════════════

export interface TorreData {
  overview: OverviewData;
  alerts: AlertsData;
  modules: TorreModules;
  serviceDesk: ServiceDeskSummary;
  quality: QualitySummary;
  growth: GrowthSummary;
  generatedAt: Date;
}
