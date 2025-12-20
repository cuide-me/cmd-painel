/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE: Monitoring
 * ═══════════════════════════════════════════════════════════
 * Endpoint para executar verificações de monitoramento
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { runSystemMonitoring } from '@/services/admin/monitoring';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    // Executar monitoramento
    const result = await runSystemMonitoring();

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[Monitoring API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao executar monitoramento' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      status: 'active',
      message: 'Monitoring service is running'
    });
  } catch (error: any) {
    console.error('[Monitoring API] Erro:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
