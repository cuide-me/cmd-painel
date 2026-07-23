import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const updateTicketOperationalContext = jest.fn();

jest.mock('@/lib/server/auth', () => ({
  requireAdminPermission,
}));

jest.mock('@/services/admin/tickets', () => ({
  updateTicketOperationalContext,
}));

import { PATCH } from '@/app/api/admin/tickets/[ticketId]/operational/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/tickets/ticket-123/operational', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const context = { params: Promise.resolve({ ticketId: 'ticket-123' }) };

describe('PATCH /api/admin/tickets/:ticketId/operational', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authorization response without updating the ticket', async () => {
    requireAdminPermission.mockResolvedValue({
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const response = await PATCH(request({ status: 'in_progress' }), context);

    expect(response.status).toBe(403);
    expect(updateTicketOperationalContext).not.toHaveBeenCalled();
  });

  it('rejects an invalid operational status', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'support-1', role: 'support' });

    const response = await PATCH(request({ status: 'unassigned' }), context);

    expect(response.status).toBe(400);
    expect(updateTicketOperationalContext).not.toHaveBeenCalled();
  });

  it('persists an authorized support treatment update', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'support-1', role: 'support' });
    updateTicketOperationalContext.mockResolvedValue(undefined);
    const payload = {
      nextAction: 'Retornar para a familia com a solucao',
      dueAt: '2026-07-24T12:00:00.000Z',
      status: 'in_progress',
    };

    const response = await PATCH(request(payload), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'tickets.manage');
    expect(updateTicketOperationalContext).toHaveBeenCalledWith('ticket-123', payload, 'support-1', 'support-1');
  });

  it('rejects a manual owner assignment attempt', async () => {
    requireAdminPermission.mockResolvedValue({ uid: 'support-1', role: 'support' });

    const response = await PATCH(request({ status: 'in_progress', ownerName: 'Outra pessoa' }), context);

    expect(response.status).toBe(400);
    expect(updateTicketOperationalContext).not.toHaveBeenCalled();
  });
});