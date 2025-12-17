import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getExecutiveKpis } from '@/services/admin/overview/kpis';
import { getExecutiveTrends } from '@/services/admin/overview/trends';
import { getExecutiveAlerts } from '@/services/admin/overview/alerts';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [kpis, trends, alerts] = await Promise.all([
      getExecutiveKpis(),
      getExecutiveTrends(),
      getExecutiveAlerts(),
    ]);

    return NextResponse.json({ kpis, trends, alerts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Erro ao montar overview' },
      { status: 500 }
    );
  }
}
