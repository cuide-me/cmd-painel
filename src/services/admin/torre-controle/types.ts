/**
 * ═══════════════════════════════════════════════════════
 * TORRE DE CONTROLE - TYPES
 * ═══════════════════════════════════════════════════════
 * Tipagem completa para o dashboard Torre de Controle
 */

/**
 * CARD 1: DEMANDA (Famílias)
 */
export interface DemandaCard {
  totalFamilias: number;
  novasFamilias30d: number;
  taxaConversao: number; // % famílias que criaram jobs
  tempoMedioPrimeiroJob: number; // em horas
  trend: 'up' | 'down' | 'stable';
  // Quick Win: Adicionar contexto
  metas?: {
    totalFamilias: number;
    novasFamilias30d: number;
    taxaConversao: number;
    tempoMedioPrimeiroJob: number;
  };
  comparacao?: {
    mesAnterior: {
      totalFamilias: number;
      novasFamilias30d: number;
      variacao: number; // %
    };
  };
  historico?: Array<{
    data: string;
    valor: number;
  }>;
  status?: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * CARD 2: OFERTA (Cuidadores)
 */
export interface OfertaCard {
  totalCuidadores: number;
  novosCuidadores30d: number;
  taxaAtivacao: number; // % cuidadores que aceitaram pelo menos 1 job
  disponibilidadeMedia: number; // % cuidadores disponíveis
  trend: 'up' | 'down' | 'stable';
  // Quick Win: Adicionar contexto
  metas?: {
    totalCuidadores: number;
    novosCuidadores30d: number;
    taxaAtivacao: number;
    disponibilidadeMedia: number;
  };
  comparacao?: {
    mesAnterior: {
      totalCuidadores: number;
      novosCuidadores30d: number;
      variacao: number; // %
    };
  };
  historico?: Array<{
    data: string;
    valor: number;
  }>;
  status?: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * CARD 3: CORE MVP (Marketplace)
 */
export interface CoreMvpCard {
  jobsAtivos: number;
  taxaMatch: number; // % jobs que viraram match
  tempoMedioMatch: number; // em horas
  taxaConversao: number; // % matches que viraram completed
  trend: 'up' | 'down' | 'stable';
  // Quick Win: Adicionar contexto
  metas?: {
    jobsAtivos: number;
    taxaMatch: number;
    tempoMedioMatch: number;
    taxaConversao: number;
  };
  comparacao?: {
    mesAnterior: {
      jobsAtivos: number;
      taxaMatch: number;
      variacao: number; // %
    };
  };
  historico?: Array<{
    data: string;
    valor: number;
  }>;
  status?: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * CARD 4: FINANCEIRO
 */
export interface FinanceiroCard {
  gmv: number; // Gross Merchandise Value
  receita: number; // Stripe charges succeeded
  ticketMedio: number;
  taxaConversao: number; // % jobs que geraram pagamento
  trend: 'up' | 'down' | 'stable';
  // Quick Win: Adicionar contexto
  metas?: {
    gmv: number;
    receita: number;
    ticketMedio: number;
    taxaConversao: number;
  };
  comparacao?: {
    mesAnterior: {
      gmv: number;
      receita: number;
      variacao: number; // %
    };
  };
  historico?: Array<{
    data: string;
    valor: number;
  }>;
  status?: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * CARD 5: CONFIANÇA
 */
export interface ConfiancaCard {
  ticketsAbertos: number; // tickets críticos (tipo: RECLAMAÇÃO)
  ratingMedio: number; // 1-5
  nps: number | null; // Net Promoter Score (se implementado)
  alertasCriticos: number;
  trend: 'up' | 'down' | 'stable';
  // Quick Win: Adicionar contexto
  metas?: {
    ticketsAbertos: number;
    ratingMedio: number;
    nps: number;
    alertasCriticos: number;
  };
  comparacao?: {
    mesAnterior: {
      ticketsAbertos: number;
      ratingMedio: number;
      variacao: number; // %
    };
  };
  historico?: Array<{
    data: string;
    valor: number;
  }>;
  status?: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * TOP 5 PROBLEMAS (Quick Win #3)
 */
export interface ProblemaAtivo {
  id: string;
  tipo: 'gargalo' | 'cobertura' | 'especialidade' | 'qualidade' | 'operacional';
  titulo: string;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  impacto: {
    receita?: number;
    usuarios?: number;
    nps?: number;
  };
  acoesSugeridas: string[];
}

/**
 * DASHBOARD COMPLETO
 */
export interface TorreControleDashboard {
  demanda: DemandaCard;
  oferta: OfertaCard;
  coreMvp: CoreMvpCard;
  financeiro: FinanceiroCard;
  confianca: ConfiancaCard;
  timestamp: string;
  // Quick Win: Top 5 problemas
  top5Problemas?: ProblemaAtivo[];
}
