import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getDashboardData } from '@/services/admin/dashboard';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  // 🔒 Verificar se usuário é admin
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
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

    const data = await getDashboardData(filters);

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
