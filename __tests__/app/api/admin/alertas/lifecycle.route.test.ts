import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const updateAlertLifecycle = jest.fn();

jest.mock('@/lib/server/auth', () => ({
  requireAdminPermission,
}));

jest.mock('@/services/admin/alerts', () => ({
  updateAlertLifecycle,
}));

import { PATCH } from '@/app/api/admin/alertas/[alertId]/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/alertas/jobs-sem-match', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const context = { params: Promise.resolve({ alertId: 'jobs-sem-match' }) };

describe('PATCH /api/admin/alertas/:alertId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authorization response without updating the lifecycle', async () => {
    requireAdminPermission.mockResolvedValue({
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const response = await PATCH(request({ status: 'acknowledged' }), context);

    expect(response.status).toBe(403);
    expect(updateAlertLifecycle).not.toHaveBeenCalled();
  });

  it('rejects an invalid lifecycle status', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'operator-1', role: 'operations' });

    const response = await PATCH(request({ status: 'open' }), context);

    expect(response.status).toBe(400);
    expect(updateAlertLifecycle).not.toHaveBeenCalled();
  });

  it('persists an authorized lifecycle update', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'operator-1', role: 'operations' });
    updateAlertLifecycle.mockResolvedValue(undefined);
    const payload = {
      status: 'resolved',
      note: 'Matching manual concluido e familia contatada.',
    };

    const response = await PATCH(request(payload), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'alerts.manage');
    expect(updateAlertLifecycle).toHaveBeenCalledWith('jobs-sem-match', payload, 'operator-1', 'operator-1');
  });

  it('rejects a manual owner assignment attempt', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'operator-1', role: 'operations' });

    const response = await PATCH(request({ status: 'acknowledged', ownerName: 'Outra pessoa' }), context);

    expect(response.status).toBe(400);
    expect(updateAlertLifecycle).not.toHaveBeenCalled();
  });
});