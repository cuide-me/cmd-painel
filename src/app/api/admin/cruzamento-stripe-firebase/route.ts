import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStripeClient } from '@/lib/server/stripe';
import { requireAdmin } from '@/lib/server/auth';
import type Stripe from 'stripe';

interface StripeAccount {
  id: string;
  email?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  external_accounts?: {
    data?: unknown[];
  };
  requirements?: {
    currently_due?: string[];
  };
}

interface FirebaseProfessional {
  id: string;
  nome: string;
  email: string;
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
}

export async function GET(request: NextRequest) {
  // 🔒 Verificar se usuário é admin
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'cuide-me-audit-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    const stripe = getStripeClient();

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 });
    }

    // 1. BUSCAR TODAS AS CONTAS DO STRIPE
    const allStripeAccounts: StripeAccount[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const accounts: Stripe.ApiList<Stripe.Account> = await stripe.accounts.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      allStripeAccounts.push(...(accounts.data as unknown as StripeAccount[]));
      hasMore = accounts.has_more;
      if (hasMore && accounts.data.length > 0) {
        startingAfter = accounts.data[accounts.data.length - 1].id;
      }
    }

    // Classificar contas Stripe
    const stripeAtivadas = allStripeAccounts.filter(
      acc => acc.charges_enabled && acc.payouts_enabled
    );
    const stripeRestritas = allStripeAccounts.filter(
      acc => !acc.charges_enabled || !acc.payouts_enabled
    );

    // 2. BUSCAR TODOS OS PROFISSIONAIS DO FIREBASE
    const profissionaisSnapshot = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const profissionaisFirebase: FirebaseProfessional[] = profissionaisSnapshot.docs.map(doc => ({
      id: doc.id,
      nome: doc.data().nome || 'Sem nome',
      email: doc.data().email || 'Sem email',
      stripeAccountId: doc.data().stripeAccountId || null,
      stripeAccountStatus: doc.data().stripeAccountStatus || null,
    }));

    // 3. CRUZAR DADOS
    const profissionaisComStripe = profissionaisFirebase.filter(p => p.stripeAccountId);
    const profissionaisSemStripe = profissionaisFirebase.filter(p => !p.stripeAccountId);

    // Criar mapa de contas Stripe para busca rápida
    const stripeAccountsMap = new Map(allStripeAccounts.map(acc => [acc.id, acc]));

    // Criar mapa de Firebase para busca rápida
    const firebaseMap = new Map(profissionaisComStripe.map(p => [p.stripeAccountId!, p]));

    // 4. IDENTIFICAR DIVERGÊNCIAS

    // Contas no Stripe mas não no Firebase
    const stripeOrfas = allStripeAccounts
      .filter(acc => !firebaseMap.has(acc.id))
      .map(acc => ({
        stripeAccountId: acc.id,
        email: acc.email,
        chargesEnabled: acc.charges_enabled,
        payoutsEnabled: acc.payouts_enabled,
        problema: 'Conta existe no Stripe mas não está vinculada no Firebase',
      }));

    // Profissionais com Stripe ID no Firebase mas conta não existe no Stripe
    const firebaseOrfaos = [];
    for (const prof of profissionaisComStripe) {
      if (!stripeAccountsMap.has(prof.stripeAccountId!)) {
        firebaseOrfaos.push({
          ...prof,
          problema: 'Firebase tem stripeAccountId mas conta não existe no Stripe',
        });
      }
    }

    // Status inconsistentes
    const statusInconsistentes = [];
    for (const prof of profissionaisComStripe) {
      const stripeAccount = stripeAccountsMap.get(prof.stripeAccountId!);
      if (stripeAccount) {
        const stripeStatus =
          stripeAccount.charges_enabled && stripeAccount.payouts_enabled
            ? 'complete'
            : 'restricted';
        const firebaseStatus = prof.stripeAccountStatus;

        if (firebaseStatus && firebaseStatus !== stripeStatus && firebaseStatus !== 'incomplete') {
          statusInconsistentes.push({
            nome: prof.nome,
            email: prof.email,
            stripeAccountId: prof.stripeAccountId,
            statusFirebase: firebaseStatus,
            statusStripeReal: stripeStatus,
            chargesEnabled: stripeAccount.charges_enabled,
            payoutsEnabled: stripeAccount.payouts_enabled,
          });
        }
      }
    }

    // 5. ANÁLISE DETALHADA POR CATEGORIA
    const categorizacao = {
      // Firebase com Stripe vinculado
      firebaseComStripe: {
        total: profissionaisComStripe.length,
        ativadas: 0,
        restritas: 0,
        detalhes: [] as any[],
      },
      // Firebase sem Stripe
      firebaseSemStripe: {
        total: profissionaisSemStripe.length,
        profissionais: profissionaisSemStripe.map(p => ({
          nome: p.nome,
          email: p.email,
          firebaseId: p.id,
        })),
      },
      // Contas Stripe órfãs (sem vínculo Firebase)
      stripeOrfas: {
        total: stripeOrfas.length,
        contas: stripeOrfas,
      },
      // Firebase com ID inexistente no Stripe
      firebaseOrfaos: {
        total: firebaseOrfaos.length,
        profissionais: firebaseOrfaos,
      },
      // Status inconsistentes
      statusInconsistentes: {
        total: statusInconsistentes.length,
        casos: statusInconsistentes,
      },
    };

    // Detalhar profissionais com Stripe
    for (const prof of profissionaisComStripe) {
      const stripeAccount = stripeAccountsMap.get(prof.stripeAccountId!);
      if (stripeAccount) {
        const isAtivada = stripeAccount.charges_enabled && stripeAccount.payouts_enabled;

        if (isAtivada) {
          categorizacao.firebaseComStripe.ativadas++;
        } else {
          categorizacao.firebaseComStripe.restritas++;
        }

        categorizacao.firebaseComStripe.detalhes.push({
          nome: prof.nome,
          email: prof.email,
          firebaseId: prof.id,
          stripeAccountId: prof.stripeAccountId,
          statusFirebase: prof.stripeAccountStatus,
          chargesEnabled: stripeAccount.charges_enabled,
          payoutsEnabled: stripeAccount.payouts_enabled,
          statusReal: isAtivada ? 'ATIVADA' : 'RESTRITA',
          externalAccounts: stripeAccount.external_accounts?.data?.length || 0,
          pendencias: stripeAccount.requirements?.currently_due || [],
        });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),

      resumo: {
        stripe: {
          total: allStripeAccounts.length,
          ativadas: stripeAtivadas.length,
          restritas: stripeRestritas.length,
        },
        firebase: {
          totalProfissionais: profissionaisFirebase.length,
          comStripeVinculado: profissionaisComStripe.length,
          semStripeVinculado: profissionaisSemStripe.length,
        },
        divergencias: {
          stripeOrfas: stripeOrfas.length,
          firebaseOrfaos: firebaseOrfaos.length,
          statusInconsistentes: statusInconsistentes.length,
        },
      },

      categorizacao,

      // Comparação Stripe informado vs encontrado
      validacao: {
        stripeInformado: {
          total: 168,
          restritas: 144,
          ativadas: 24,
        },
        stripeEncontrado: {
          total: allStripeAccounts.length,
          restritas: stripeRestritas.length,
          ativadas: stripeAtivadas.length,
        },
        diferencas: {
          total: allStripeAccounts.length - 168,
          restritas: stripeRestritas.length - 144,
          ativadas: stripeAtivadas.length - 24,
        },
      },
    });
  } catch (error: any) {
    console.error('[Cruzamento] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro no cruzamento' }, { status: 500 });
  }
}
