import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFinanceiroData } from '@/services/admin/financeiro-detalhado';

/**
 * Financeiro Detalhado API
 * Retorna análise financeira profunda com Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    getFirebaseAdmin();

    const data = await getFinanceiroData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Financeiro Detalhado API] Erro:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar dados financeiros',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
