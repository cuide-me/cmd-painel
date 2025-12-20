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
}
