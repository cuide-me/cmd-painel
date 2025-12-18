/**
 * TORRE DE CONTROLE V3 - TYPES
 * Types para KPIs consolidados, funil e alertas
 */

// ═══════════════════════════════════════════════════════════════
// KPIs PRINCIPAIS
// ═══════════════════════════════════════════════════════════════

export interface TorreV3Dashboard {
  kpis: TorreV3KPIs;
  funnel: ConversionFunnel;
  alerts: Alert[];
  metadata: DashboardMetadata;
}

export interface TorreV3KPIs {
  financial: FinancialKPIs;
  operational: OperationalKPIs;
  marketplace: MarketplaceKPIs;
  growth: GrowthKPIs;
}

// ═══════════════════════════════════════════════════════════════
// FINANCIAL KPIs (STRIPE)
// ═══════════════════════════════════════════════════════════════

export interface FinancialKPIs {
  // Linha 1: Receita
  mrr: KPIValue;           // Monthly Recurring Revenue
  arr: KPIValue;           // Annual Recurring Revenue
  mrrGrowth: KPIValue;     // % de crescimento MRR
  
  // Linha 2: Eficiência
  arpu: KPIValue;          // Average Revenue Per User
  ltv: KPIValue;           // Lifetime Value
  churnRate: KPIValue;     // Taxa de cancelamento
  
  // Linha 3: Saúde Financeira
  burnRate: KPIValue;      // Quanto gastamos/mês (payouts)
  netBurn: KPIValue;       // MRR - Burn Rate
  runway: KPIValue;        // Meses até acabar o caixa
  
  // Detalhes
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledThisMonth: number;
  cashBalance: number;
}

export interface KPIValue {
  value: number;
  previousValue?: number;
  change?: number;           // Diferença absoluta
  changePercent?: number;    // % de mudança
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  unit?: string;             // 'BRL' | '%' | 'months'
}

// ═══════════════════════════════════════════════════════════════
// OPERATIONAL KPIs (FIREBASE)
// ═══════════════════════════════════════════════════════════════

export interface OperationalKPIs {
  // Linha 1: Volume
  totalJobs: KPIValue;              // Total de contratações
  activeJobs: KPIValue;             // Jobs em andamento
  completedJobs: KPIValue;          // Jobs finalizados
  
  // Linha 2: Performance
  acceptanceRate: KPIValue;         // % de jobs aceitos
  completionRate: KPIValue;         // % de jobs completados
  avgResponseTime: KPIValue;        // Tempo médio até aceitação (horas)
  
  // Linha 3: Satisfação
  avgRating: KPIValue;              // Rating médio (1-5)
  nps: KPIValue;                    // Net Promoter Score
  feedbackCount: number;
}

// ═══════════════════════════════════════════════════════════════
// MARKETPLACE KPIs (FIREBASE)
// ═══════════════════════════════════════════════════════════════

export interface MarketplaceKPIs {
  // Supply & Demand
  totalProfessionals: KPIValue;
  activeProfessionals: KPIValue;
  totalClients: KPIValue;
  activeClients: KPIValue;
  
  // Health
  supplyDemandRatio: KPIValue;      // Profissionais / Jobs pendentes
  matchRate: KPIValue;              // % de jobs que viraram match
  utilizationRate: KPIValue;        // % de profissionais com jobs
  
  // Details
  pendingJobs: number;
  jobsWithoutMatch: number;
  inactiveProfessionals: number;
}

// ═══════════════════════════════════════════════════════════════
// GROWTH KPIs (GA4 + FIREBASE)
// ═══════════════════════════════════════════════════════════════

export interface GrowthKPIs {
  // GA4 Metrics
  activeUsers: KPIValue;
  newUsers: KPIValue;
  sessions: KPIValue;
  
  // Firebase Growth
  newProfessionals: KPIValue;       // Cadastros no período
  newClients: KPIValue;
  signupConversionRate: KPIValue;   // % de visitantes que se cadastram
  
  // Engagement
  avgSessionDuration: KPIValue;     // Segundos
  bounceRate: KPIValue;             // %
}

// ═══════════════════════════════════════════════════════════════
// CONVERSION FUNNEL
// ═══════════════════════════════════════════════════════════════

export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversionRate: number;    // % do topo ao fundo
  bottleneck: string;               // Estágio com maior drop-off
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;               // % do total inicial
  dropOff: number;                  // % perdido para próximo estágio
  conversionRate: number;           // % que passou para próximo
}

// Estágios do funil (baseado em Firebase)
export type FunnelStageName = 
  | 'user_created'          // Usuário cadastrado
  | 'job_created'           // Job criado
  | 'job_accepted'          // Job aceito por profissional
  | 'job_paid'              // Pagamento realizado
  | 'job_completed';        // Serviço concluído

// ═══════════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════════

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metric: string;               // Nome do KPI afetado
  currentValue: number;
  threshold: number;
  recommendation: string;       // Ação recomendada
  createdAt: Date;
}

export type AlertType =
  | 'financial'                 // MRR caindo, churn alto
  | 'operational'               // Jobs pendentes, baixa aceitação
  | 'marketplace'               // Desequilíbrio supply/demand
  | 'growth'                    // Signups em queda
  | 'service_desk';             // Tickets sem resolver

// ═══════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════

export interface DashboardMetadata {
  generatedAt: Date;
  period: DateRange;
  dataSource: {
    stripe: boolean;
    firebase: boolean;
    ga4: boolean;
  };
  cacheStatus: {
    isCached: boolean;
    cacheAge?: number;            // Segundos desde última atualização
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;                  // '7 days' | '30 days' | 'This month'
}
