import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { listAlerts } from '@/services/admin/alerts';
import type { ListAlertsParams } from '@/services/admin/alerts';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const { searchParams } = new URL(request.url);
    const windowDays = searchParams.get('window')
      ? parseInt(searchParams.get('window') as string, 10)
      : 30;

    const severityFilter = searchParams.get('severity');
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');
    const searchTerm = searchParams.get('q') || searchParams.get('search');

    const params: ListAlertsParams = {
      windowDays,
      severityFilter: (severityFilter || 'all') as ListAlertsParams['severityFilter'],
      typeFilter: (typeFilter || 'all') as ListAlertsParams['typeFilter'],
      statusFilter: (statusFilter || 'all') as ListAlertsParams['statusFilter'],
      searchTerm: searchTerm || undefined,
    };

    const result = await listAlerts(params);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Alertas API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar alertas' },
      { status: 500 }
    );
  }
}
