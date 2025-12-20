/**
 * API ROUTE: /api/admin/friccao
 * TODO: Implementar conforme roadmap
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'API será implementada nas próximas fases',
      data: { friccao: [] }
    });
  } catch (error: any) {
    console.error('[Fricção API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
