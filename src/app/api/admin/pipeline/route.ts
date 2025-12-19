import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getPipelineData } from '@/services/admin/pipeline';

/**
 * Pipeline API
 * Retorna análise completa do funil de conversão
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    getFirebaseAdmin();

    const data = await getPipelineData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Pipeline API] Erro:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar dados do pipeline',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
