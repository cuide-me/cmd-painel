/**
 * Módulo Cuidadores - Types
 * Visão detalhada da oferta (lado profissional)
 */

export interface CuidadoresData {
  overview: CuidadoresOverview;
  distribuicao: DistribuicaoCuidadores;
  performance: PerformanceCuidadores;
  engajamento: EngajamentoCuidadores;
  problemas: ProblemasCuidadores;
  timestamp: string;
}

export interface CuidadoresOverview {
  totalCuidadoresAtivos: number;
  novosCuidadoresUltimos30d: number;
  cuidadoresDisponiveis: number;
  cuidadoresComAtendimentoAtivo: number;
  mediaCuidadoresPorSolicitacao: number;
  taxaRetencao30d: number; // %
}

export interface DistribuicaoCuidadores {
  porEspecialidade: EspecialidadeDistribuicao[];
  porCidade: CidadeDistribuicao[];
  porExperiencia: ExperienciaDistribuicao[];
}

export interface EspecialidadeDistribuicao {
  especialidade: string;
  quantidade: number;
  ativos: number;
  comAtendimentoAtivo: number;
  percentualDoTotal: number;
}

export interface CidadeDistribuicao {
  cidade: string;
  estado: string;
  quantidade: number;
  demandaLocal: number; // solicitações abertas na cidade
  ratio: number; // cuidadores / demanda
}

export interface ExperienciaDistribuicao {
  faixa: string; // "0-6 meses", "6-12 meses", "1-2 anos", "2+ anos"
  quantidade: number;
  percentual: number;
}

export interface PerformanceCuidadores {
  topPerformers: TopPerformer[];
  metricas: MetricasPerformance;
}

export interface TopPerformer {
  id: string;
  nome: string;
  especialidade: string;
  atendimentosConcluidos: number;
  npsMedia: number;
  taxaAceitacao: number; // %
  taxaConclusao: number; // %
}

export interface MetricasPerformance {
  npsMediaGeral: number;
  taxaAceitacaoMedia: number; // %
  taxaConclusaoMedia: number; // %
  tempoMedioResposta: number; // horas
  atendimentosMediaPorCuidador: number;
}

export interface EngajamentoCuidadores {
  ultimaSemana: EngajamentoPeriodo;
  ultimoMes: EngajamentoPeriodo;
  churnRisk: number; // cuidadores inativos > 30 dias
}

export interface EngajamentoPeriodo {
  loginsUnicos: number;
  solicitacoesVisualizadas: number;
  solicitacoesAceitas: number;
  taxaConversao: number; // visualizadas → aceitas
}

export interface ProblemasCuidadores {
  abandono: AbandonoMetrics;
  baixaPerformance: BaixaPerformanceMetrics;
  inativos: InativosMetrics;
  alertas: AlertaCuidador[];
}

export interface AbandonoMetrics {
  totalAbandonos: number;
  abandonoPosAceite: number;
  abandonoPosInicio: number;
  taxaAbandonoGeral: number; // %
}

export interface BaixaPerformanceMetrics {
  cuidadoresComNpsBaixo: number; // NPS < 50
  cuidadoresComBaixaAceitacao: number; // < 30%
  cuidadoresComBaixaConclusao: number; // < 70%
}

export interface InativosMetrics {
  inativos7d: number;
  inativos30d: number;
  inativos90d: number;
}

export interface AlertaCuidador {
  id: string;
  cuidadorId: string;
  nome: string;
  tipo: 'abandono' | 'baixa_performance' | 'inativo';
  severidade: 'critica' | 'alta' | 'media';
  descricao: string;
  acao: string;
}
