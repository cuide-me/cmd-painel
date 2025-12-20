/**
 * ═══════════════════════════════════════════════════════
 * MARKETPLACE VALIDATION - TYPES
 * ═══════════════════════════════════════════════════════
 * Validação de Demanda vs Oferta
 */

export interface DemandaOfertaBalance {
  demandaAberta: number; // jobs pending/open
  ofertaDisponivel: number; // cuidadores disponíveis
  ratio: number; // oferta / demanda (ideal: > 1.2)
  status: 'saudavel' | 'atencao' | 'critico';
  trend: 'up' | 'down' | 'stable';
}

export interface EspecialidadeBalance {
  especialidade: string;
  demanda: number;
  oferta: number;
  gap: number; // demanda - oferta
  status: 'superavit' | 'equilibrado' | 'deficit';
}

export interface CoberturasGeograficas {
  cidade: string;
  estado: string;
  demanda: number;
  oferta: number;
  cobertura: number; // % (oferta/demanda * 100)
  status: 'coberto' | 'parcial' | 'descoberto';
}

export interface QualidadeMatch {
  taxaMatchSucesso: number; // % jobs que viraram match
  tempoMedioMatch: number; // horas
  taxaAbandonoPosMatch: number; // % matches que foram abandonados
  satisfacaoMedia: number; // rating médio dos matches
}

export interface MarketplaceValidationData {
  balance: DemandaOfertaBalance;
  especialidades: EspecialidadeBalance[];
  geografico: CoberturasGeograficas[];
  qualidade: QualidadeMatch;
  timestamp: string;
}
