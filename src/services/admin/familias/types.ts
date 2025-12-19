/**
 * Módulo Famílias - Types
 * Visão detalhada da demanda (lado cliente)
 */

export interface FamiliasData {
  overview: FamiliasOverview;
  solicitacoesPorEstado: SolicitacoesPorEstado[];
  solicitacoesPorEspecialidade: SolicitacoesPorEspecialidade[];
  jornada: JornadaFamilias;
  urgencias: Urgencias;
  timestamp: string;
}

export interface FamiliasOverview {
  totalFamiliasAtivas: number;
  novasFamiliasUltimos30d: number;
  solicitacoesAbertas: number;
  solicitacoesEmAndamento: number;
  tempoMedioResposta: number; // horas
  taxaSatisfacao: number; // %
}

export interface SolicitacoesPorEstado {
  estado: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  count: number;
  percentage: number;
  tempoMedioNesseEstado: number; // horas
}

export interface SolicitacoesPorEspecialidade {
  especialidade: string;
  solicitacoesAbertas: number;
  solicitacoesConcluidas: number;
  tempoMedioMatch: number; // horas
  taxaSucesso: number; // %
}

export interface JornadaFamilias {
  cadastroAoCadastro: CadastroMetrics;
  solicitacaoAMatch: MatchMetrics;
  matchAConclusao: ConclusaoMetrics;
  funil: FunilConversao;
}

export interface CadastroMetrics {
  totalCadastros: number;
  cadastrosCompletos: number; // % com todos os dados preenchidos
  cadastrosComSolicitacao: number; // % que fizeram ao menos 1 solicitação
  tempoMedioCadastroASolicitacao: number; // horas
}

export interface MatchMetrics {
  solicitacoesComMatch: number;
  solicitacoesSemMatch: number;
  tempoMedioMatch: number; // horas
  taxaAceitacao: number; // % de matches aceitos pela família
}

export interface ConclusaoMetrics {
  matchsConcluidos: number;
  matchsCancelados: number;
  taxaConclusao: number; // %
  tempoMedioConclusao: number; // horas
}

export interface FunilConversao {
  cadastros: number;
  solicitacoes: number;
  matches: number;
  conclusoes: number;
  taxaConversaoTotal: number; // % cadastros → conclusões
}

export interface Urgencias {
  solicitacoesUrgentes: number; // > 48h sem match
  familiasInsatisfeitas: number; // NPS < 6
  solicitacoesCriticas: UrgenciaDetalhada[];
}

export interface UrgenciaDetalhada {
  id: string;
  familiaId: string;
  especialidade: string;
  tempoAberta: number; // horas
  cidade: string;
  estado: string;
  motivo: string;
}
