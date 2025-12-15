/**
 * ────────────────────────────────────
 * FINANCE SERVICE
 * ────────────────────────────────────
 * Placeholder para serviços financeiros (Stripe, MRR, etc)
 */

export interface FinanceOverview {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
}

/**
 * Retorna overview financeiro
 * TODO: Implementar com dados reais do Stripe
 */
export async function getFinanceOverview(): Promise<FinanceOverview> {
  // Placeholder - implementar com Stripe real
  return {
    mrr: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0,
  };
}
