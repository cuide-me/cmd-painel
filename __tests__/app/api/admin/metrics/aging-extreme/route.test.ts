import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const collectAgingExtremeSnapshot = jest.fn();

jest.mock('@/lib/server/auth', () => ({
  requireAdminPermission,
}));

jest.mock('@/services/admin/agingExtremeMetrics', () => ({
  collectAgingExtremeSnapshot,
}));

import { POST } from '@/app/api/admin/metrics/aging-extreme/route';

function metricsRequest(query = '', headers?: HeadersInit) {
  return new NextRequest(`http://localhost/api/admin/metrics/aging-extreme${query}`, {
    method: 'POST',
    headers,
  });
}

describe('POST /api/admin/metrics/aging-extreme', () => {
  const originalCronSecret = process.env.ADMIN_METRICS_CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_METRICS_CRON_SECRET = 'cron-secret';
    collectAgingExtremeSnapshot.mockImplementation(async (windowDays: number) => ({ windowDays }));
  });

  afterAll(() => {
    if (originalCronSecret === undefined) {
      delete process.env.ADMIN_METRICS_CRON_SECRET;
    } else {
      process.env.ADMIN_METRICS_CRON_SECRET = originalCronSecret;
    }
  });

  it('allows a matching cron secret without invoking the operator permission guard', async () => {
    const response = await POST(metricsRequest('?windows=7,invalid,90,31', {
      'x-admin-metrics-cron-secret': 'cron-secret',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      methodologyVersion: 'v1',
      thresholdHours: 72,
      snapshots: [{ windowDays: 7 }, { windowDays: 90 }],
    });
    expect(requireAdminPermission).not.toHaveBeenCalled();
    expect(collectAgingExtremeSnapshot).toHaveBeenNthCalledWith(1, 7);
    expect(collectAgingExtremeSnapshot).toHaveBeenNthCalledWith(2, 90);
  });

  it('uses metrics.write when no valid cron secret is provided', async () => {
    requireAdminPermission.mockResolvedValue({
      uid: 'admin-panel-user',
      role: 'admin',
      decodedToken: { uid: 'admin-panel-user', admin: true },
    });

    const response = await POST(metricsRequest());

    expect(response.status).toBe(200);
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'metrics.write');
    expect(collectAgingExtremeSnapshot).toHaveBeenCalledWith(30);
  });

  it('returns the permission response and does not collect snapshots when authorization fails', async () => {
    requireAdminPermission.mockResolvedValue({
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const response = await POST(metricsRequest());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' });
    expect(collectAgingExtremeSnapshot).not.toHaveBeenCalled();
  });
});