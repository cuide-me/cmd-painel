/**
 * ═══════════════════════════════════════════════════════
 * CUIDADORES - TYPES
 * ═══════════════════════════════════════════════════════
 * Performance + Disponibilidade + Especialidades + Retenção
 */

export interface PerformanceCuidador {
  cuidadorId: string;
  nome: string;
  totalJobs: number;
  jobsCompletados: number;
  taxaSucesso: number; // %
  ratingMedio: number;
  tempoMedioResposta: number; // horas
}

export interface DisponibilidadeCuidador {
  total: number;
  disponiveis: number;
  emJob: number;
  inativos: number;
  taxaDisponibilidade: number; // %
}

export interface EspecialidadesCuidadores {
  especialidade: string;
  total: number;
  ativos: number;
  disponiveis: number;
}

export interface RetencaoCuidadores {
  novosCuidadores30d: number;
  cuidadoresAtivos: number;
  cuidadoresInativos: number;
  taxaRetencao: number; // %
  churn30d: number; // %
}

export interface TopPerformers {
  top10: PerformanceCuidador[];
}

export interface CuidadoresData {
  disponibilidade: DisponibilidadeCuidador;
  especialidades: EspecialidadesCuidadores[];
  retencao: RetencaoCuidadores;
  topPerformers: TopPerformers;
  timestamp: string;
}
