/**
 * Serviço de integração com Stripe para o painel administrativo
 * Métricas financeiras e de pagamentos
 */

import Stripe from 'stripe';

export interface StripeMetrics {
  totalRevenue: number;
  pendingPayouts: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averageTransactionValue: number;
  topEarners: Array<{
    accountId: string;
    email: string;
    totalEarned: number;
  }>;
  paymentsByMethod: {
    card: number;
    pix: number;
    other: number;
  };
}

/**
 * Busca métricas do Stripe
 */
export async function fetchStripeMetrics(startDate?: Date, endDate?: Date): Promise<StripeMetrics> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
  });

  try {
    const created =
      startDate && endDate
        ? {
            gte: Math.floor(startDate.getTime() / 1000),
            lte: Math.floor(endDate.getTime() / 1000),
          }
        : undefined;

    // Buscar pagamentos
    const charges = await stripe.charges.list({
      limit: 100,
      created,
    });

    // Buscar reembolsos
    const refunds = await stripe.refunds.list({
      limit: 100,
      created,
    });

    // Calcular métricas
    const metrics: StripeMetrics = {
      totalRevenue: 0,
      pendingPayouts: 0,
      successfulPayments: 0,
      failedPayments: 0,
      refundedAmount: 0,
      averageTransactionValue: 0,
      topEarners: [],
      paymentsByMethod: {
        card: 0,
        pix: 0,
        other: 0,
      },
    };

    // Processar charges
    for (const charge of charges.data) {
      if (charge.status === 'succeeded') {
        metrics.successfulPayments++;
        metrics.totalRevenue += charge.amount;

        // Contar por método de pagamento
        if (charge.payment_method_details?.type === 'card') {
          metrics.paymentsByMethod.card++;
        } else if (charge.payment_method_details?.type === 'pix') {
          metrics.paymentsByMethod.pix++;
        } else {
          metrics.paymentsByMethod.other++;
        }
      } else if (charge.status === 'failed') {
        metrics.failedPayments++;
      }
    }

    // Processar reembolsos
    for (const refund of refunds.data) {
      if (refund.status === 'succeeded') {
        metrics.refundedAmount += refund.amount;
      }
    }

    // Calcular média
    if (metrics.successfulPayments > 0) {
      metrics.averageTransactionValue = metrics.totalRevenue / metrics.successfulPayments;
    }

    // Converter de centavos para reais
    metrics.totalRevenue = metrics.totalRevenue / 100;
    metrics.refundedAmount = metrics.refundedAmount / 100;
    metrics.averageTransactionValue = metrics.averageTransactionValue / 100;

    return metrics;
  } catch (error) {
    console.error('Erro ao buscar métricas do Stripe:', error);
    return getDefaultMetrics();
  }
}

function getDefaultMetrics(): StripeMetrics {
  return {
    totalRevenue: 0,
    pendingPayouts: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedAmount: 0,
    averageTransactionValue: 0,
    topEarners: [],
    paymentsByMethod: {
      card: 0,
      pix: 0,
      other: 0,
    },
  };
}
