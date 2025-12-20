/**
 * ═══════════════════════════════════════════════════════
 * FRICÇÃO - TYPES
 * ═══════════════════════════════════════════════════════
 * Análise de pontos de fricção e abandono
 */

export interface FriccaoPoint {
  etapa: string;
  abandonos: number;
  taxaAbandono: number; // %
  tempoMedio: number; // horas
  principais_motivos: string[];
}

export interface RecuperacaoData {
  tentativasRecuperacao: number;
  recuperados: number;
  taxaRecuperacao: number; // %
}

export interface MapaCalor {
  area: string;
  nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  incidentes: number;
  impacto: number; // 1-10
}

export interface AcoesSugeridas {
  prioridade: 'alta' | 'media' | 'baixa';
  acao: string;
  impactoEstimado: string;
  esforco: 'baixo' | 'medio' | 'alto';
}

export interface FriccaoData {
  pontosFriccao: FriccaoPoint[];
  recuperacao: RecuperacaoData;
  mapaCalor: MapaCalor[];
  acoesSugeridas: AcoesSugeridas[];
  timestamp: string;
}
