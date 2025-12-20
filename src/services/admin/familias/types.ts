/**
 * ═══════════════════════════════════════════════════════
 * FAMÍLIAS - TYPES
 * ═══════════════════════════════════════════════════════
 * Jornada completa das famílias
 */

export interface JornadaFamilia {
  etapa: string;
  total: number;
  percentual: number;
  tempoMedio: number; // dias
}

export interface UrgenciasDemanda {
  urgente: number;
  alta: number;
  media: number;
  baixa: number;
  total: number;
}

export interface ConversaoFamilia {
  cadastros: number;
  primeiroJob: number;
  jobAtivo: number;
  jobCompletado: number;
  taxaCadastroParaJob: number; // %
  taxaJobParaAtivo: number; // %
  taxaAtivacao: number; // %
}

export interface AbandonoFamilia {
  abandonoPreJob: number; // cadastrou mas não criou job
  abandonoPosJob: number; // criou job mas não teve match
  abandonoPosMatch: number; // teve match mas cancelou
  taxaAbandonoTotal: number; // %
}

export interface SegmentacaoFamilia {
  tipoServico: { tipo: string; count: number }[];
  localizacao: { cidade: string; estado: string; count: number }[];
  faixaIdade: { faixa: string; count: number }[];
}

export interface FamiliasData {
  jornada: JornadaFamilia[];
  urgencias: UrgenciasDemanda;
  conversao: ConversaoFamilia;
  abandono: AbandonoFamilia;
  segmentacao: SegmentacaoFamilia;
  timestamp: string;
}
