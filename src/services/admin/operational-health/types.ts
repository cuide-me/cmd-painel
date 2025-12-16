/**
 * ═══════════════════════════════════════════════════════════════
 * SAÚDE OPERACIONAL - TYPES
 * ═══════════════════════════════════════════════════════════════
 * Types para dashboard de saúde da oferta, demanda e match quality
 */

// ─────────────────────────────────────────────────────────────
// SAÚDE DA OFERTA (Profissionais)
// ─────────────────────────────────────────────────────────────

export interface ProfessionalHealth {
  totalActive: number;
  totalInactive: number; // sem agendamento em 7 dias
  avgResponseTimeHours: number; // <2h, <24h, >24h
  acceptanceRate: number; // % de agendamentos aceitos
  cancellationRate: number; // % de cancelamentos pelo profissional
  avgAvailabilitySlots: number; // slots disponíveis/semana
  avgRating: number; // rating médio
  noShowRate: number; // % de no-show de profissionais
  bySpecialty: SpecialtyMetrics[];
  topPerformers: ProfessionalSummary[];
  needsAttention: ProfessionalSummary[];
}

export interface SpecialtyMetrics {
  specialty: string;
  totalProfessionals: number;
  activeCount: number;
  avgRating: number;
  avgResponseTime: number;
  acceptanceRate: number;
}

export interface ProfessionalSummary {
  id: string;
  name: string;
  specialty: string;
  responseTime: number;
  acceptanceRate: number;
  cancellationRate: number;
  rating: number;
  lastActivity: string;
  alertLevel: 'none' | 'warning' | 'critical';
}

// ─────────────────────────────────────────────────────────────
// SAÚDE DA DEMANDA (Famílias)
// ─────────────────────────────────────────────────────────────

export interface FamilyHealth {
  totalRegistered: number;
  totalActive: number; // com atividade em 30 dias
  totalDormant: number; // sem atividade em 30 dias
  conversionRate: number; // cadastro → 1º agendamento
  avgTimeToFirstAppointment: number; // dias
  retentionD30: number; // % que fazem 2ª consulta em 30 dias
  noShowRate: number; // % de no-show de famílias
  npsByStage: NPSByStage;
  cohortAnalysis: CohortData[];
  dormantFamilies: FamilySummary[];
}

export interface NPSByStage {
  preAppointment: number;
  postAppointment: number;
  followUp: number;
  overall: number;
}

export interface CohortData {
  cohortMonth: string; // YYYY-MM
  totalUsers: number;
  retained: number;
  retentionRate: number;
}

export interface FamilySummary {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  lastActivity: string;
  totalAppointments: number;
  npsScore?: number;
  alertLevel: 'none' | 'warning' | 'critical';
}

// ─────────────────────────────────────────────────────────────
// QUALIDADE DO MATCH
// ─────────────────────────────────────────────────────────────

export interface MatchQuality {
  totalMatches: number;
  acceptedRate: number; // % de matches aceitos
  declinedRate: number; // % de matches recusados
  rematchRate: number; // % que solicitaram outro profissional
  avgMatchTimeMinutes: number; // tempo médio até match
  firstMeetingSatisfaction: number; // rating da 1ª consulta
  qualityScore: number; // score geral 0-100
  matchesBySpecialty: MatchSpecialtyMetrics[];
  recentMatches: MatchSummary[];
}

export interface MatchSpecialtyMetrics {
  specialty: string;
  totalMatches: number;
  acceptedRate: number;
  avgMatchTime: number;
  satisfactionScore: number;
}

export interface MatchSummary {
  id: string;
  familyId: string;
  familyName: string;
  professionalId: string;
  professionalName: string;
  specialty: string;
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  matchTimeMinutes?: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  satisfactionScore?: number;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD GERAL
// ─────────────────────────────────────────────────────────────

export interface OperationalHealthDashboard {
  professionals: ProfessionalHealth;
  families: FamilyHealth;
  matches: MatchQuality;
  overallHealthScore: number; // 0-100
  alerts: HealthAlert[];
  lastUpdate: string;
}

export interface HealthAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'professional' | 'family' | 'match' | 'system';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  action: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// STATUS & TRENDS
// ─────────────────────────────────────────────────────────────

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface MetricWithTrend {
  value: number;
  status: HealthStatus;
  trend: TrendDirection;
  previousValue?: number;
  percentChange?: number;
}
