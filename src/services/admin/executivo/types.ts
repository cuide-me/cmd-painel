/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD EXECUTIVO - TYPES
 * ═══════════════════════════════════════════════════════
 * Tipagem para métricas C-Level (CEO/CFO/COO)
 * Fase 7 - Sprint 1-2
 */

/**
 * GMV - Gross Merchandise Value
 */
export interface GMVMetrics {
  atual: number;              // GMV do mês atual
  meta: number;               // Meta de GMV
  momGrowth: number;          // Crescimento Month-over-Month (%)
  forecast3M: number[];       // Forecast próximos 3 meses
  historico12M: Array<{       // Últimos 12 meses
    data: string;
    valor: number;
  }>;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * Unit Economics - Saúde econômica por unidade
 */
export interface UnitEconomics {
  ltv: number;                    // Lifetime Value médio
  cac: number;                    // Customer Acquisition Cost
  ltvCacRatio: number;            // Razão LTV:CAC (ideal > 3.0)
  paybackMonths: number;          // Meses para recuperar CAC
  contributionMargin: number;     // Margem de contribuição (%)
  
  // Detalhamento
  breakdown: {
    ltvPorSegmento: Array<{
      segmento: string;
      ltv: number;
      count: number;
    }>;
    cacPorCanal: Array<{
      canal: string;
      cac: number;
      volume: number;
    }>;
  };
  
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * Crescimento MoM (Month-over-Month)
 */
export interface GrowthMetrics {
  familiasAtivas: {
    atual: number;
    anterior: number;
    momGrowth: number;          // %
    meta: number;               // Meta de crescimento
  };
  
  cuidadoresAtivos: {
    atual: number;
    anterior: number;
    momGrowth: number;
    meta: number;
  };
  
  jobsCompletados: {
    atual: number;
    anterior: number;
    momGrowth: number;
    meta: number;
  };
  
  revenueGrowth: {
    atual: number;
    anterior: number;
    momGrowth: number;
    meta: number;
  };
  
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * Saúde Financeira
 */
export interface FinancialHealth {
  arr: number;                    // Annual Recurring Revenue
  mrr: number;                    // Monthly Recurring Revenue
  burnRate: number;               // Queima de caixa mensal
  runway: number;                 // Meses de runway
  breakEvenDate: string | null;   // Data estimada de break-even
  cashBalance: number;            // Saldo em caixa
  
  // Tendências
  mrrGrowth: number;              // Crescimento MRR (%)
  churnRate: number;              // Taxa de churn (%)
  expansionRevenue: number;       // Receita de expansão
  
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

/**
 * Dashboard Executivo Completo
 */
export interface ExecutiveDashboard {
  gmv: GMVMetrics;
  unitEconomics: UnitEconomics;
  growth: GrowthMetrics;
  financialHealth: FinancialHealth;
  timestamp: string;
  
  // Insights automáticos
  insights: Array<{
    tipo: 'positivo' | 'neutro' | 'atencao' | 'critico';
    titulo: string;
    descricao: string;
    valor?: number;
  }>;
  
  // Score geral (0-100)
  healthScore: number;
}

/**
 * Parâmetros para cálculo de métricas
 */
export interface MetricsParams {
  periodo: 'mes' | 'trimestre' | 'ano';
  dataInicio?: string;
  dataFim?: string;
}
