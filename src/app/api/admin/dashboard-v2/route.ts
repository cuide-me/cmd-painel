import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getDashboardData } from '@/services/admin/dashboard';
import { measurePerformance } from '@/lib/performanceMonitor';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    getFirebaseAdmin();

    // Pegar parâmetros da query
    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset');
    const grouping = searchParams.get('grouping');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};
    if (preset) filters.preset = preset;
    if (grouping) filters.grouping = grouping;
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(endDateParam);

    const data = await measurePerformance(
      '/api/admin/dashboard-v2',
      'GET',
      () => getDashboardData(filters)
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Dashboard V2 API] Erro completo:', error);
    console.error('[Dashboard V2 API] Stack:', error.stack);
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar dashboard',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
