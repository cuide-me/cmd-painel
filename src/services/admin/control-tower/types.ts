/**
 * Types para Torre de Controle
 * Dashboard decisório - responde as 3 perguntas críticas:
 * 1. Estamos ganhando ou perdendo dinheiro?
 * 2. Onde está o gargalo agora?
 * 3. O que vai virar problema se eu não agir hoje?
 */

export interface FinanceKPIs {
  mrr: number;                    // Monthly Recurring Revenue (R$)
  mrrGrowth: number;              // Crescimento MRR (%)
  revenue: number;                // Revenue total últimos 30 dias (R$)
  churnRate: number;              // Taxa de churn (%)
  burnRate: number;               // Burn rate mensal (R$) - negativo = queimando caixa
  runway: number;                 // Meses até acabar o caixa
  activeSubscriptions: number;    // Assinaturas ativas
  timestamp: string;
}

export interface OperationsKPIs {
  profissionaisDisponiveis: number;    // Profissionais sem atendimento ativo
  profissionaisEmAtendimento: number;  // Profissionais com jobs ativos
  profissionaisTotal: number;          // Total de profissionais cadastrados
  slaCompliance: number;               // % jobs aceitos em < 24h
  taxaAbandono: number;                // % jobs criados mas não aceitos
  capacidadeUtilizacao: number;        // % profissionais ocupados
  jobsAtivos: number;                  // Jobs com status 'active'
  timestamp: string;
}

export interface GrowthKPIs {
  visitantesUnicos: number;  // Visitantes únicos (GA4 - últimos 7 dias)
  sessoes: number;           // Sessões (GA4 - últimos 7 dias)
  cadastros: number;         // Novos cadastros (Firebase - últimos 7 dias)
  taxaConversao: number;     // % visitantes que se cadastram
  cac: number;               // Customer Acquisition Cost (R$)
  timestamp: string;
}

export interface QualityKPIs {
  npsScore: number;          // Net Promoter Score (-100 a 100)
  feedbackCount: number;     // Total de feedbacks coletados
  ticketsAbertos: number;    // Tickets open/pending/in_progress
  ticketsEmAtraso: number;   // Tickets sem resolução há > 48h
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'financial' | 'operational' | 'growth' | 'quality';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  value: number;
  threshold: number;
  action: string;
  timestamp: string;
}

export interface ControlTowerDashboard {
  finance: FinanceKPIs;
  operations: OperationsKPIs;
  growth: GrowthKPIs;
  quality: QualityKPIs;
  alerts: Alert[];
  timestamp: string;
}
