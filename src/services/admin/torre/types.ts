/**
 * Torre de Controle - Type Definitions
 * Read-only dashboard, 3-source architecture
 */

export interface TorreHomeData {
  demanda: DemandaBlock;
  oferta: OfertaBlock;
  coreMVP: CoreMVPBlock;
  financeiro: FinanceiroBlock;
  confianca: ConfiancaBlock;
  urgentActions: UrgentAction[];
  timestamp: string;
}

// ==================== DEMANDA ====================
export interface DemandaBlock {
  solicitacoesAbertas: {
    total: number;
    change: number; // % vs período anterior
    trend: 'up' | 'down' | 'stable';
  };
  tempoMedioMatch: {
    hours: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  slaRisco: {
    count: number; // > 48h sem match
    percentage: number;
  };
}

// ==================== OFERTA ====================
export interface OfertaBlock {
  profissionaisDisponiveis: {
    total: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  taxaConversaoAceite: {
    percentage: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  abandonoPosAceite: {
    percentage: number;
    count: number;
  };
  profissionaisInativos30d: {
    count: number;
    percentage: number; // % do total
  };
}

// ==================== CORE MVP ====================
export interface CoreMVPBlock {
  matchesConcluidos: {
    total: number; // mês atual
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  nps: {
    score: number; // -100 a 100
    change: number;
    category: 'excelente' | 'bom' | 'razoavel' | 'ruim';
  };
}

// ==================== FINANCEIRO ====================
export interface FinanceiroBlock {
  gmvMes: {
    value: number; // valor total transacionado
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  receitaLiquidaMes: {
    value: number; // receita Cuide.me (comissão)
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  ticketMedio: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  churnRate: {
    percentage: number;
    count: number; // clientes que cancelaram
  };
}

// ==================== CONFIANÇA ====================
export interface ConfiancaBlock {
  ticketsAbertos: {
    total: number;
    criticos: number; // alta prioridade
    sla24h: number; // % dentro do SLA
  };
}

// ==================== URGENT ACTIONS ====================
export interface UrgentAction {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  impact: string;
  action: string;
  module: 'demanda' | 'oferta' | 'core' | 'financeiro' | 'confianca';
}

// ==================== DAILY METRICS ====================
export interface DailyMetric {
  date: string; // ISO date
  signups: number; // Firebase: new users
  views: number; // GA4: pageviews
}
