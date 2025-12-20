/**
 * ═══════════════════════════════════════════════════════
 * API: DASHBOARD EXECUTIVO
 * ═══════════════════════════════════════════════════════
 * Endpoint para métricas C-Level
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutiveDashboard } from '@/services/admin/executivo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const dashboard = await getExecutiveDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('[ExecutiveDashboard API] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dashboard executivo' },
      { status: 500 }
    );
  }
}
