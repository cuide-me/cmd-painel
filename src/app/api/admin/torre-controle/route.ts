/**
 * ═══════════════════════════════════════════════════════
 * API ROUTE: /api/admin/torre-controle
 * ═══════════════════════════════════════════════════════
 * Retorna dados completos do dashboard Torre de Controle
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getTorreControleDashboard } from '@/services/admin/torre-controle';

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Inicializar Firebase
    getFirebaseAdmin();

    // Buscar dados do dashboard
    const dashboard = await getTorreControleDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard
    });

  } catch (error: any) {
    console.error('[API Torre Controle] Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar dados do dashboard',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
