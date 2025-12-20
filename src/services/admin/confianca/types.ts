/**
 * ═══════════════════════════════════════════════════════
 * CONFIANÇA & QUALIDADE - TYPES
 * ═══════════════════════════════════════════════════════
 */

export interface NPSData {
  score: number; // -100 a 100
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

export interface RatingTrends {
  overall: number;
  byMonth: Array<{ month: string; rating: number; count: number }>;
  byService: Array<{ service: string; rating: number; count: number }>;
}

export interface SupportMetrics {
  totalTickets: number;
  ticketsAbertos: number;
  ticketsEmAtendimento: number;
  ticketsConcluidos: number;
  tempoMedioResposta: number; // horas
  tempoMedioResolucao: number; // horas
  satisfacaoSuporte: number;
}

export interface QualidadeIndicators {
  taxaResolucaoPrimeiroContato: number; // %
  taxaReabertura: number; // %
  incidentesCriticos: number;
  alertasAtivos: number;
}

export interface ConfiancaQualidadeData {
  nps: NPSData;
  ratings: RatingTrends;
  support: SupportMetrics;
  qualidade: QualidadeIndicators;
  timestamp: string;
}
