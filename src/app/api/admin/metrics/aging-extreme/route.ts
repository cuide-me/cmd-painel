import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/server/auth';
import { collectAgingExtremeSnapshot } from '@/services/admin/agingExtremeMetrics';
import type { TimeWindow } from '@/services/admin/dashboardV3Types';

const VALID_WINDOWS: TimeWindow[] = [7, 14, 30, 60, 90];

function parseWindows(raw: string | null): TimeWindow[] {
  if (!raw) return [30];

  const values = raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value): value is number => Number.isFinite(value));

  const parsed = values.filter((value): value is TimeWindow =>
    VALID_WINDOWS.includes(value as TimeWindow)
  );

  return parsed.length > 0 ? parsed : [30];
}

function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_METRICS_CRON_SECRET;
  if (!expected) return false;

  const provided = request.headers.get('x-admin-metrics-cron-secret');
  return Boolean(provided && provided === expected);
}

export async function POST(request: NextRequest) {
  const cronAuthorized = isCronAuthorized(request);

  if (!cronAuthorized) {
    const authResult = await requireAdminPermission(request, 'metrics.write');
    if ('error' in authResult) return authResult.error;
  }

  const windows = parseWindows(new URL(request.url).searchParams.get('windows'));

  try {
    const snapshots = await Promise.all(windows.map((windowDays) => collectAgingExtremeSnapshot(windowDays)));

    return NextResponse.json({
      success: true,
      methodologyVersion: 'v1',
      thresholdHours: 72,
      snapshots,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro ao coletar snapshot de aging extremo',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
