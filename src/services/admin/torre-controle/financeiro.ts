/**
 * ═══════════════════════════════════════════════════════
 * CARD 4: FINANCEIRO
 * ═══════════════════════════════════════════════════════
 * Fonte: Stripe charges + Firebase jobs
 */

import { getStripeClient } from '@/lib/server/stripe';
import { getFirestore } from 'firebase-admin/firestore';
import type { FinanceiroCard } from './types';

export async function getFinanceiroCard(): Promise<FinanceiroCard> {
  try {
    const stripe = getStripeClient();
    const db = getFirestore();

    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);

    // Buscar charges do Stripe (últimos 30 dias)
    const charges = await stripe.charges.list({
      limit: 100,
      created: {
        gte: thirtyDaysAgoTimestamp
      }
    });

    let gmv = 0; // Gross Merchandise Value (total transacionado)
    let receita = 0; // Apenas charges succeeded

    charges.data.forEach(charge => {
      const amount = charge.amount / 100; // converter de centavos
      gmv += amount;

      if (charge.status === 'succeeded') {
        receita += amount;
      }
    });

    const ticketMedio = charges.data.length > 0
      ? receita / charges.data.length
      : 0;

    // Buscar jobs para calcular taxa de conversão
    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    let totalJobs = 0;
    let jobsComPagamento = 0;

    jobsSnap.forEach(doc => {
      const data = doc.data();
      totalJobs++;

      // Verificar se tem paymentId ou está completed (inferir pagamento)
      if (data.paymentId || data.status === 'completed') {
        jobsComPagamento++;
      }
    });

    const taxaConversao = totalJobs > 0
      ? (jobsComPagamento / totalJobs) * 100
      : 0;

    // Determinar trend (simplificado: se receita > 0, trend up)
    const trend = receita > 0 ? 'up' : 'stable';

    return {
      gmv: Math.round(gmv * 100) / 100,
      receita: Math.round(receita * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      taxaConversao: Math.round(taxaConversao * 10) / 10,
      trend
    };

  } catch (error) {
    console.error('[Financeiro] Erro ao buscar dados:', error);
    return {
      gmv: 0,
      receita: 0,
      ticketMedio: 0,
      taxaConversao: 0,
      trend: 'stable'
    };
  }
}
