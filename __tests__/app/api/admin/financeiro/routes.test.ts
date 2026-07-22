import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const getFinancialOverview = jest.fn();
const listReceivables = jest.fn();
const saveProfessionalPayoutForReceivable = jest.fn();
const listPayoutTransfers = jest.fn();
const createManualPayout = jest.fn();

jest.mock('@/lib/server/auth', () => ({ requireAdminPermission }));
jest.mock('@/modules/finance/services/receivables', () => ({ getFinancialOverview, listReceivables, saveProfessionalPayoutForReceivable }));
jest.mock('@/modules/finance/services/payout-transfers', () => ({ createManualPayout, listPayoutTransfers }));

import { GET as overviewGet } from '@/app/api/admin/financeiro/overview/route';
import { GET as receivablesGet, POST as receivablesPost } from '@/app/api/admin/financeiro/recebimentos/route';
import { GET as payoutsGet, POST as payoutsPost } from '@/app/api/admin/financeiro/repasses/route';
import { GET as resultsGet } from '@/app/api/admin/financeiro/resultados/route';

function request(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

const authorized = {
  uid: 'finance-user',
  role: 'finance',
  decodedToken: { uid: 'finance-user', role: 'finance' },
};

const overview = {
  window: 30,
  generatedAt: '2026-07-18T00:00:00.000Z',
  coverage: { loadedRecords: 1, hasMore: false, isComplete: true },
  gmvCentavos: 10_000,
  totalReceivedCentavos: 10_000,
  successfulPayments: 1,
  averageTicketCentavos: 10_000,
  activeClients: 1,
  activeProfessionals: 1,
  soldShifts: 1,
  refundedCentavos: 0,
  connectFinancials: {
    destinationCharges: 1,
    legacyCharges: 0,
    gmvCentavos: 10_000,
    commissionCentavos: 2_000,
    refundedCommissionCentavos: 0,
    netCommissionCentavos: 2_000,
    stripeFeesCentavos: 320,
    takeRatePercent: 20,
    isComplete: true,
  },
  unavailableMetrics: [],
};

describe('admin finance API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAdminPermission.mockResolvedValue(authorized);
    getFinancialOverview.mockResolvedValue(overview);
    listReceivables.mockResolvedValue({ items: [] });
    saveProfessionalPayoutForReceivable.mockResolvedValue(undefined);
    listPayoutTransfers.mockResolvedValue({ items: [] });
    createManualPayout.mockResolvedValue({ id: 'manual-1' });
  });

  it('returns the authorization response before calling financial services', async () => {
    requireAdminPermission.mockResolvedValue({
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    });

    const response = await overviewGet(request('/api/admin/financeiro/overview'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'forbidden' });
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'finance.read');
    expect(getFinancialOverview).not.toHaveBeenCalled();
  });

  it('normalizes receivables filters and forwards the complete cursor contract', async () => {
    const response = await receivablesGet(request('/api/admin/financeiro/recebimentos?window=90&status=succeeded&pageSize=75&cursor=ch_cursor&clientId=client-1&professionalId=pro-1'));

    expect(response.status).toBe(200);
    expect(listReceivables).toHaveBeenCalledWith({
      window: 90,
      status: 'succeeded',
      pageSize: 75,
      cursor: 'ch_cursor',
      clientId: 'client-1',
      professionalId: 'pro-1',
    });
  });

  it('saves a manual professional payout against its Stripe charge', async () => {
    const response = await receivablesPost(new NextRequest('http://localhost/api/admin/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({
        stripeChargeId: 'ch_123',
        amountCentavos: 11_461,
        protocol: 'CDM-2026-00015',
        professionalName: 'Brenda Martins',
        professionalId: 'professional-1',
        jobId: 'job-1',
        jobLabel: 'Atendimento domiciliar',
      }),
    }));

    expect(response.status).toBe(200);
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'finance.write');
    expect(saveProfessionalPayoutForReceivable).toHaveBeenCalledWith({
      stripeChargeId: 'ch_123',
      amountCentavos: 11_461,
      protocol: 'CDM-2026-00015',
      professionalName: 'Brenda Martins',
      professionalId: 'professional-1',
      jobId: 'job-1',
      jobLabel: 'Atendimento domiciliar',
    }, 'finance-user');
  });

  it('falls back to safe financial defaults for invalid payout query parameters', async () => {
    const response = await payoutsGet(request('/api/admin/financeiro/repasses?window=12&pageSize=-10'));

    expect(response.status).toBe(200);
    expect(listPayoutTransfers).toHaveBeenCalledWith({ window: 30, cursor: undefined, pageSize: 50 });
  });

  it('registers a validated manual payout using finance write permission', async () => {
    const response = await payoutsPost(new NextRequest('http://localhost/api/admin/financeiro/repasses', {
      method: 'POST',
      body: JSON.stringify({
        professionalName: 'Brenda Martins',
        protocol: 'CDM-2026-00015',
        amountCentavos: 13_581,
        stripeFeeCentavos: 435,
        paidAt: '2026-07-22',
      }),
    }));

    expect(response.status).toBe(201);
    expect(requireAdminPermission).toHaveBeenCalledWith(expect.any(NextRequest), 'finance.write');
    expect(createManualPayout).toHaveBeenCalledWith({
      professionalName: 'Brenda Martins',
      professionalId: undefined,
      protocol: 'CDM-2026-00015',
      amountCentavos: 13_581,
      paidAt: '2026-07-22',
      stripeFeeCentavos: 435,
      notes: undefined,
    }, 'finance-user');
  });

  it('keeps consolidated result lines unavailable instead of fabricating them', async () => {
    const response = await resultsGet(request('/api/admin/financeiro/resultados?window=365'));
    const payload = await response.json();
    const lines = payload.lines as Array<{ id: string; status: string; amountCentavos: number | null }>;

    expect(response.status).toBe(200);
    expect(getFinancialOverview).toHaveBeenCalledWith(365);
    expect(lines.find((line) => line.id === 'connect_commission_net_of_refunds')).toMatchObject({ status: 'available', amountCentavos: 2_000 });
    expect(lines.find((line) => line.id === 'net_revenue')).toMatchObject({ status: 'unavailable', amountCentavos: null });
    expect(lines.find((line) => line.id === 'operating_profit')).toMatchObject({ status: 'unavailable', amountCentavos: null });
  });
});