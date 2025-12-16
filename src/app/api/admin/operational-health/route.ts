import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getOperationalHealthDashboard } from '@/services/admin/operational-health';

/**
 * GET /api/admin/operational-health
 * Retorna dashboard completo de saúde operacional
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados
    const dashboard = await getOperationalHealthDashboard();

    return NextResponse.json(dashboard);
  } catch (error: any) {
    console.error('[OperationalHealth API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch operational health' },
      { status: 500 }
    );
  }
}
