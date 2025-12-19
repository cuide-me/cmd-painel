/**
 * Módulo Pipeline - Types
 * Análise do fluxo de conversão completo
 */

export interface PipelineData {
  funil: FunilCompleto;
  taxasConversao: TaxasConversao;
  temposMedios: TemposMedios;
  gargalos: Gargalos;
  previsoes: Previsoes;
  timestamp: string;
}

export interface FunilCompleto {
  etapas: EtapaFunil[];
  taxaConversaoGeral: number; // % do início ao fim
  totalInicio: number;
  totalFim: number;
}

export interface EtapaFunil {
  nome: string;
  descricao: string;
  quantidade: number;
  percentualDoInicio: number;
  percentualDaEtapaAnterior: number;
  taxaConversaoAteProxima: number;
  tempoMedioNaEtapa: number; // horas
}

export interface TaxasConversao {
  cadastroParaSolicitacao: number; // %
  solicitacaoParaMatch: number; // %
  matchParaConclusao: number; // %
  cadastroParaConclusao: number; // % (end-to-end)
  benchmarks: {
    cadastroParaSolicitacao: { ideal: number; atual: number };
    solicitacaoParaMatch: { ideal: number; atual: number };
    matchParaConclusao: { ideal: number; atual: number };
  };
}

export interface TemposMedios {
  cadastroASolicitacao: TempoMetrica;
  solicitacaoAMatch: TempoMetrica;
  matchAConclusao: TempoMetrica;
  jornadeCompleta: TempoMetrica;
}

export interface TempoMetrica {
  media: number; // horas
  mediana: number; // horas
  p90: number; // horas (90% dos casos)
  min: number;
  max: number;
}

export interface Gargalos {
  identificados: GargaloDetalhado[];
  impactoTotal: number; // % de perda no funil
}

export interface GargaloDetalhado {
  etapa: string;
  problema: string;
  impacto: number; // % de perda
  volumeAfetado: number;
  acaoSugerida: string;
  prioridade: 'critica' | 'alta' | 'media';
}

export interface Previsoes {
  proximoMes: PrevisaoMensal;
  tendencias: Tendencia[];
}

export interface PrevisaoMensal {
  cadastrosEsperados: number;
  solicitacoesEsperadas: number;
  matchesEsperados: number;
  conclusoesEsperadas: number;
  baseadoEm: string;
}

export interface Tendencia {
  metrica: string;
  direcao: 'subindo' | 'descendo' | 'estavel';
  variacao: number; // %
  confianca: number; // % 0-100
}
