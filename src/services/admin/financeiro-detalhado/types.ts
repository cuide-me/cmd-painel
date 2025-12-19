/**
 * Módulo Financeiro - Types
 * Análise financeira profunda com Stripe
 */

export interface FinanceiroData {
  receita: ReceitaDetalhada;
  transacoes: TransacoesAnalise;
  assinaturas: AssinaturasAnalise;
  metricas: MetricasFinanceiras;
  projecoes: ProjecoesFinanceiras;
  timestamp: string;
}

export interface ReceitaDetalhada {
  total: number;
  porCanal: CanalReceita[];
  porPeriodo: ReceitaPeriodo[];
  crescimento: CrescimentoReceita;
}

export interface CanalReceita {
  canal: string;
  valor: number;
  percentual: number;
  transacoes: number;
}

export interface ReceitaPeriodo {
  periodo: string; // YYYY-MM
  valor: number;
  transacoes: number;
  ticketMedio: number;
}

export interface CrescimentoReceita {
  mesAtual: number;
  mesAnterior: number;
  variacao: number; // %
  variacaoAbsoluta: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
}

export interface TransacoesAnalise {
  total: number;
  sucesso: number;
  falhas: number;
  taxaSucesso: number;
  valorMedio: number;
  valorMediano: number;
  porMetodo: MetodoPagamento[];
  falhasPorMotivo: FalhaMotivo[];
}

export interface MetodoPagamento {
  metodo: string;
  quantidade: number;
  valor: number;
  taxaSucesso: number;
}

export interface FalhaMotivo {
  motivo: string;
  quantidade: number;
  impactoFinanceiro: number;
}

export interface AssinaturasAnalise {
  ativas: number;
  canceladas: number;
  novas: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number; // %
  ltv: number; // Lifetime Value médio
  cac: number; // Customer Acquisition Cost estimado
}

export interface MetricasFinanceiras {
  gmv: number; // Gross Merchandise Value
  comissaoPlataforma: number;
  custoOperacional: number; // estimado
  margemBruta: number;
  margemLiquida: number;
  ticketMedio: number;
  frequenciaCompra: number; // transações por cliente
}

export interface ProjecoesFinanceiras {
  proximoMes: {
    receitaEsperada: number;
    transacoesEsperadas: number;
    mrr: number;
  };
  proximo12Meses: {
    receitaTotal: number;
    arr: number;
    crescimentoEsperado: number; // %
  };
  baseadoEm: string;
}
