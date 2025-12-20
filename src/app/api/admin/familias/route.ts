/**
 * API ROUTE: /api/admin/familias
 * Módulo Famílias: Jornada + Urgências + Conversão
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFamiliasData } from '@/services/admin/familias';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const data = await getFamiliasData();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Famílias API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
