import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const updateJobOperationalContext = jest.fn();

jest.mock('@/lib/server/auth', () => ({
  requireAdminPermission,
}));

jest.mock('@/services/admin/jobs', () => ({
  updateJobOperationalContext,
}));

import { PATCH } from '@/app/api/admin/jobs/[jobId]/operational/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/jobs/job-123/operational', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const context = { params: Promise.resolve({ jobId: 'job-123' }) };

describe('PATCH /api/admin/jobs/:jobId/operational', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authorization response without updating the job', async () => {
    requireAdminPermission.mockResolvedValue({
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const response = await PATCH(request({ status: 'in_progress' }), context);

    expect(response.status).toBe(403);
    expect(updateJobOperationalContext).not.toHaveBeenCalled();
  });

  it('rejects an invalid operational payload', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'operator-1', role: 'operations' });

    const response = await PATCH(request({ status: 'unassigned' }), context);

    expect(response.status).toBe(400);
    expect(updateJobOperationalContext).not.toHaveBeenCalled();
  });

  it('updates the isolated operational context for an authorized operator', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'operator-1', role: 'operations' });
    updateJobOperationalContext.mockResolvedValue(undefined);
    const payload = {
      nextAction: 'Confirmar disponibilidade com a familia',
      dueAt: '2026-07-24T12:00:00.000Z',
      status: 'in_progress',
    };

    const response = await PATCH(request(payload), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'jobs.manage');
    expect(updateJobOperationalContext).toHaveBeenCalledWith('job-123', payload, 'operator-1', 'operator-1');
  });

  it('rejects a manual owner assignment attempt', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'operator-1', role: 'operations' });

    const response = await PATCH(request({ status: 'in_progress', ownerName: 'Outra pessoa' }), context);

    expect(response.status).toBe(400);
    expect(updateJobOperationalContext).not.toHaveBeenCalled();
  });
});