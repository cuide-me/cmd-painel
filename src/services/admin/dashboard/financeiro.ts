import Stripe from 'stripe';

/**
 * Serviço: Indicadores Financeiros (Stripe)
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function getPagamentosStripeMes() {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const timestampInicio = Math.floor(inicioMes.getTime() / 1000);

  try {
    // Buscar charges bem-sucedidos do mês
    const charges = await stripe.charges.list({
      created: { gte: timestampInicio },
      limit: 100,
    });

    const chargesRecebidos = charges.data.filter(c => c.status === 'succeeded');
    const totalCentavos = chargesRecebidos.reduce((sum, c) => sum + c.amount, 0);
    const totalReais = totalCentavos / 100;

    return {
      total: totalReais,
      quantidade: chargesRecebidos.length,
      moeda: 'BRL',
    };
  } catch (error) {
    console.error('[Stripe] Erro ao buscar pagamentos:', error);
    return {
      total: 0,
      quantidade: 0,
      moeda: 'BRL',
      erro: true,
    };
  }
}
