import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFriccaoData } from '@/services/admin/friccao';

/**
 * Pontos de Fricção API
 * Retorna análise de fricções na jornada do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    getFirebaseAdmin();

    const data = await getFriccaoData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Pontos de Fricção API] Erro:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar pontos de fricção',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
