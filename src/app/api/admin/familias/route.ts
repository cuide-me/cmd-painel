import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFamiliasData } from '@/services/admin/familias';

/**
 * Famílias (Demanda) API
 * Retorna visão detalhada do lado da demanda
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    getFirebaseAdmin();

    const data = await getFamiliasData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Famílias API] Erro:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar dados das famílias',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
