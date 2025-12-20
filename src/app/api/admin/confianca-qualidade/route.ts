/**
 * API ROUTE: /api/admin/confianca-qualidade
 * Confiança & Qualidade: NPS + Ratings + Support
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getConfiancaQualidadeData } from '@/services/admin/confianca';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const data = await getConfiancaQualidadeData();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Confiança Qualidade API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
  }
}
