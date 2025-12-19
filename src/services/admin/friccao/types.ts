/**
 * Módulo Pontos de Fricção - Types
 * Identificação de problemas na jornada do usuário
 */

export interface FriccaoData {
  friccoes: PontoFriccao[];
  impactoTotal: ImpactoTotal;
  priorizacao: Priorizacao[];
  recomendacoes: Recomendacao[];
  timestamp: string;
}

export interface PontoFriccao {
  id: string;
  etapa: string;
  descricao: string;
  tipo: 'abandono' | 'erro' | 'demora' | 'confusao' | 'bloqueio';
  gravidade: 'critica' | 'alta' | 'media' | 'baixa';
  frequencia: number;
  usuariosAfetados: number;
  impactoConversao: number; // % de perda na conversão
  tempoMedioPerdido: number; // horas
  dadosEvidencia: EvidenciaFriccao;
}

export interface EvidenciaFriccao {
  fonte: string;
  metrica: string;
  valor: number;
  comparacao: string;
}

export interface ImpactoTotal {
  usuariosPerdidos: number;
  receitaPerdida: number;
  conversaoPerdida: number; // %
  tempoTotalPerdido: number; // horas
}

export interface Priorizacao {
  friccaoId: string;
  score: number; // 0-100
  roi: number; // retorno estimado
  esforco: 'baixo' | 'medio' | 'alto';
  impacto: 'baixo' | 'medio' | 'alto';
}

export interface Recomendacao {
  friccaoId: string;
  solucao: string;
  passos: string[];
  resultadoEsperado: string;
  prazo: string;
  recursos: string[];
}
