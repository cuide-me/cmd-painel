import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getConfiancaQualidadeData } from '@/services/admin/confianca-qualidade';

/**
 * Confiança & Qualidade API
 * Retorna análise de suporte, satisfação e qualidade
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    getFirebaseAdmin();

    const data = await getConfiancaQualidadeData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Confiança & Qualidade API] Erro:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar dados de confiança e qualidade',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
