/**
 * API ROUTE: /api/admin/friccao
 * Análise de Fricção e Pontos de Abandono
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFriccaoData } from '@/services/admin/friccao';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const data = await getFriccaoData();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Fricção API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
