import { NextResponse } from 'next/server';
import { getExecutiveKpis } from '@/services/admin/overview/kpis';
import { getExecutiveTrends } from '@/services/admin/overview/trends';
import { getExecutiveAlerts } from '@/services/admin/overview/alerts';

export async function GET() {
  try {
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
