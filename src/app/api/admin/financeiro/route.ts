import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/server/stripe';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  // 🔒 Verificar se usuário é admin
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 });
    }

    // Buscar transações do Stripe dos últimos 90 dias
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;

    const charges = await stripe.charges.list({
      limit: 100,
      created: { gte: ninetyDaysAgo },
    });

    const payouts = await stripe.payouts.list({
      limit: 100,
      created: { gte: ninetyDaysAgo },
    });

    const balanceTransactions = await stripe.balanceTransactions.list({
      limit: 100,
      created: { gte: ninetyDaysAgo },
    });

    // Calcular métricas
    const successfulCharges = charges.data.filter(c => c.status === 'succeeded');
    const totalReceived = successfulCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalFees = balanceTransactions.data.reduce((sum, t) => sum + t.fee, 0);
    const netRevenue = totalReceived - totalFees;

    // Agrupar por mês
    const revenueByMonth: Record<string, number> = {};
    successfulCharges.forEach(charge => {
      const date = new Date(charge.created * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + charge.amount;
    });

    // Transações recentes com detalhes
    const transactions = successfulCharges.slice(0, 50).map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      status: charge.status,
      created: charge.created,
      description: charge.description || 'Pagamento',
      customerEmail: charge.billing_details?.email || charge.receipt_email || 'N/A',
      paymentMethod: charge.payment_method_details?.type || 'card',
    }));

    // Payouts recentes
    const recentPayouts = payouts.data.slice(0, 20).map(payout => ({
      id: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency.toUpperCase(),
      status: payout.status,
      created: payout.created,
      arrivalDate: payout.arrival_date,
      method: payout.method,
    }));

    return NextResponse.json({
      summary: {
        totalReceived: totalReceived / 100,
        totalFees: totalFees / 100,
        netRevenue: netRevenue / 100,
        transactionCount: successfulCharges.length,
        averageTicket:
          successfulCharges.length > 0 ? totalReceived / successfulCharges.length / 100 : 0,
      },
      revenueByMonth,
      transactions,
      payouts: recentPayouts,
    });
  } catch (error: any) {
    console.error('[Financeiro API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados financeiros' },
      { status: 500 }
    );
  }
}
