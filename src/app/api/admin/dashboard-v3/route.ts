import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { requireAdminPermission } from '@/lib/server/auth';
import { calculateKpiDashboardMetrics } from '@/services/admin/kpiDashboardMetrics';
import type { KpiDashboardResponse, TimeWindow } from '@/services/admin/kpiDashboardTypes';

const CACHE_TTL_SECONDS: Record<TimeWindow, number> = {
  7: 2 * 60,
  14: 3 * 60,
  30: 5 * 60,
  60: 10 * 60,
  90: 15 * 60,
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authResult = await requireAdminPermission(request, 'dashboard.read');
    if ('error' in authResult) return authResult.error;

    const { searchParams } = new URL(request.url);
    const windowParam = searchParams.get('window');
    const validWindows: TimeWindow[] = [7, 14, 30, 60, 90];
    const windowDays: TimeWindow = windowParam
      ? validWindows.includes(Number(windowParam) as TimeWindow)
        ? (Number(windowParam) as TimeWindow)
        : 30
      : 30;

    const cacheKey = `dashboard-v3:kpi:${windowDays}`;
    const cachedData = cache.get<KpiDashboardResponse>(cacheKey);

    if (cachedData) {
      return NextResponse.json(
        {
          ...cachedData,
          cached: true,
        },
        {
          headers: {
            'Cache-Control': `private, max-age=${CACHE_TTL_SECONDS[windowDays]}`,
            'X-Response-Time': `${Date.now() - startTime}ms`,
          },
        }
      );
    }

    const result = await calculateKpiDashboardMetrics(windowDays);
    const response: KpiDashboardResponse = {
      ...result,
      cached: false,
    };

    cache.set(cacheKey, response, CACHE_TTL_SECONDS[windowDays]);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `private, max-age=${CACHE_TTL_SECONDS[windowDays]}`,
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('[API dashboard-v3] Erro:', error);

    return NextResponse.json(
      {
        error: 'Erro interno ao calcular o painel de KPI',
        code: 'INTERNAL_ERROR',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';