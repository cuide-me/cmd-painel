/**
 * Módulo Confiança & Qualidade - Types
 * Análise de suporte e satisfação
 */

export interface ConfiancaQualidadeData {
  suporte: SuporteAnalise;
  satisfacao: SatisfacaoAnalise;
  qualidade: QualidadeAnalise;
  problemas: ProblemasRecorrentes;
  acoes: AcoesRecomendadas[];
  timestamp: string;
}

export interface SuporteAnalise {
  ticketsAbertos: number;
  ticketsResolvidos: number;
  ticketsPendentes: number;
  tempoMedioResposta: number; // horas
  tempoMedioResolucao: number; // horas
  slaAtendimento: number; // % dentro do SLA
  categorias: CategoriaTicket[];
  urgentes: number;
}

export interface CategoriaTicket {
  categoria: string;
  quantidade: number;
  percentual: number;
  tempoMedioResolucao: number;
}

export interface SatisfacaoAnalise {
  npsGeral: number;
  promotores: number;
  neutros: number;
  detratores: number;
  totalRespostas: number;
  porSegmento: NpsSegmento[];
  evolucao: NpsEvolucao[];
}

export interface NpsSegmento {
  segmento: string;
  nps: number;
  respostas: number;
}

export interface NpsEvolucao {
  periodo: string;
  nps: number;
  respostas: number;
}

export interface QualidadeAnalise {
  matchQuality: number; // 0-100
  taxaConclusao: number; // %
  taxaCancelamento: number; // %
  motivosCancelamento: MotivoCancelamento[];
  avaliacoesPositivas: number;
  avaliacoesNegativas: number;
  mediaAvaliacoes: number;
}

export interface MotivoCancelamento {
  motivo: string;
  quantidade: number;
  percentual: number;
}

export interface ProblemasRecorrentes {
  lista: ProblemaRecorrente[];
  impactoTotal: number;
}

export interface ProblemaRecorrente {
  descricao: string;
  frequencia: number;
  impacto: 'critico' | 'alto' | 'medio' | 'baixo';
  usuarios_afetados: number;
  primeiraOcorrencia: string;
  ultimaOcorrencia: string;
}

export interface AcoesRecomendadas {
  area: string;
  acao: string;
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  impactoEsperado: string;
}
