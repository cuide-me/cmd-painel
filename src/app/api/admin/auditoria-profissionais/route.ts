import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStripeClient } from '@/lib/server/stripe';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  // 🔒 Verificar se usuário é admin
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Segurança básica - apenas para admin
    if (secret !== 'cuide-me-audit-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    const stripe = getStripeClient();

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 });
    }

    // Buscar todos os profissionais
    const profissionaisSnapshot = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const resultados = {
      total: profissionaisSnapshot.size,
      comStripeConta: 0,
      stripeComplete: 0,
      stripeIncomplete: 0,
      semStripeConta: 0,
      comContaBancaria: 0,
      semContaBancaria: 0,
      podeCobrar: 0,
      naoPodeCobrar: 0,
      erros: [] as any[],
    };

    const detalhes = [];

    for (const doc of profissionaisSnapshot.docs) {
      const data = doc.data();
      const profissional = {
        id: doc.id,
        nome: data.nome || 'Sem nome',
        email: data.email || 'Sem email',
        stripeAccountId: data.stripeAccountId || null,
        stripeAccountStatus: data.stripeAccountStatus || 'N/A',
      };

      // Verificar se tem Stripe Account ID
      if (!profissional.stripeAccountId) {
        resultados.semStripeConta++;
        detalhes.push({
          ...profissional,
          status: 'SEM CONTA STRIPE',
          problema: 'Profissional não conectou conta Stripe',
        });
        continue;
      }

      resultados.comStripeConta++;

      try {
        // Buscar informações detalhadas da conta Stripe
        const account = await stripe.accounts.retrieve(profissional.stripeAccountId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const info: any = {
          ...profissional,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          currentlyDue: account.requirements?.currently_due || [],
          eventuallyDue: account.requirements?.eventually_due || [],
          pastDue: account.requirements?.past_due || [],
          externalAccounts: account.external_accounts?.data?.length || 0,
        };

        // Verificar status
        if (account.charges_enabled && account.payouts_enabled) {
          resultados.stripeComplete++;
          resultados.podeCobrar++;
          info.status = 'STRIPE COMPLETE - PODE COBRAR';
        } else {
          resultados.stripeIncomplete++;
          resultados.naoPodeCobrar++;
          info.status = 'STRIPE INCOMPLETE - NÃO PODE COBRAR';
        }

        // Verificar conta bancária
        if (info.externalAccounts > 0) {
          resultados.comContaBancaria++;
          info.contaBancaria = `${info.externalAccounts} conta(s) vinculada(s)`;
        } else {
          resultados.semContaBancaria++;
          info.contaBancaria = 'Sem conta bancária';
          info.problema = 'Falta vincular conta bancária';
        }

        // Documentos pendentes
        if (info.currentlyDue.length > 0) {
          info.pendencias = `Docs pendentes: ${info.currentlyDue.join(', ')}`;
        }

        detalhes.push(info);
      } catch (error: any) {
        resultados.erros.push({
          profissional: profissional.nome,
          email: profissional.email,
          stripeAccountId: profissional.stripeAccountId,
          erro: error.message,
        });

        detalhes.push({
          ...profissional,
          status: 'ERRO AO BUSCAR STRIPE',
          problema: error.message,
        });
      }
    }

    // Profissionais com problemas
    const comProblemas = detalhes.filter(
      p =>
        !p.chargesEnabled ||
        !p.payoutsEnabled ||
        !p.stripeAccountId ||
        (p.externalAccounts !== undefined && p.externalAccounts === 0)
    );

    return NextResponse.json({
      resumo: resultados,
      detalhes,
      problemas: comProblemas,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Auditoria Profissionais] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro na auditoria' }, { status: 500 });
  }
}
