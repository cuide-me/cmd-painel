import { NextRequest, NextResponse } from 'next/server';

const requireAdminPermission = jest.fn();
const getFinancialOverview = jest.fn();
const listReceivables = jest.fn();
const saveProfessionalPayoutForReceivable = jest.fn();
const setReceivableExcludedFromFinance = jest.fn();
const setManualPixExcludedFromFinance = jest.fn();
const setReceivableManualRefund = jest.fn();
const setManualPixFinancialValue = jest.fn();
const createManualReceivable = jest.fn();
const listPayoutTransfers = jest.fn();
const createManualPayout = jest.fn();

jest.mock('@/lib/server/auth', () => ({ requireAdminPermission }));
jest.mock('@/modules/finance/services/receivables', () => ({ createManualReceivable, getFinancialOverview, listReceivables, saveProfessionalPayoutForReceivable, setManualPixExcludedFromFinance, setManualPixFinancialValue, setReceivableExcludedFromFinance, setReceivableManualRefund }));
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
  operatingFinancials: {
    stripeFeesCentavos: 320,
    taxReserveCentavos: 600,
    taxReserveRatePercent: 6,
    balanceAfterFeesAndTaxReserveCentavos: 9_080,
    netCuidemeMarginCentavos: 2_000,
    isComplete: true,
  },
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
    setReceivableExcludedFromFinance.mockResolvedValue(undefined);
    setManualPixExcludedFromFinance.mockResolvedValue(undefined);
    setReceivableManualRefund.mockResolvedValue(undefined);
    createManualReceivable.mockResolvedValue({ id: 'manual_pix_1' });
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
    const response = await receivablesGet(request('/api/admin/financeiro/recebimentos?window=90&month=2026-07&status=succeeded&pageSize=75&cursor=ch_cursor&clientId=client-1&professionalId=pro-1'));

    expect(response.status).toBe(200);
    expect(listReceivables).toHaveBeenCalledWith({
      window: 90,
      month: '2026-07',
      status: 'succeeded',
      pageSize: 75,
      cursor: 'ch_cursor',
      clientId: 'client-1',
      professionalId: 'pro-1',
    });
  });

  it('forwards a calendar month to overview, payouts, and results', async () => {
    await overviewGet(request('/api/admin/financeiro/overview?window=90&month=2026-07'));
    await payoutsGet(request('/api/admin/financeiro/repasses?window=90&month=2026-07'));
    await resultsGet(request('/api/admin/financeiro/resultados?window=90&month=2026-07'));

    expect(getFinancialOverview).toHaveBeenNthCalledWith(1, 90, '2026-07');
    expect(listPayoutTransfers).toHaveBeenCalledWith({ window: 90, month: '2026-07', cursor: undefined, pageSize: 50 });
    expect(getFinancialOverview).toHaveBeenNthCalledWith(2, 90, '2026-07');
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

  it('soft-excludes a Stripe receivable from the financial module', async () => {
    const response = await receivablesPost(new NextRequest('http://localhost/api/admin/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({ stripeChargeId: 'ch_123', excludeFromFinance: true }),
    }));

    expect(response.status).toBe(200);
    expect(setReceivableExcludedFromFinance).toHaveBeenCalledWith('ch_123', 'finance-user');
  });

  it('persists a manual refund against its Stripe charge', async () => {
    const response = await receivablesPost(new NextRequest('http://localhost/api/admin/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({ stripeChargeId: 'ch_123', manualRefundedAmountCentavos: 2_500 }),
    }));

    expect(response.status).toBe(200);
    expect(setReceivableManualRefund).toHaveBeenCalledWith('ch_123', 2_500, 'finance-user');
  });

  it('persists payout and refund values on a manual PIX payment', async () => {
    await receivablesPost(new NextRequest('http://localhost/api/admin/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({ manualPixId: 'pix-1', amountCentavos: 8_000 }),
    }));
    await receivablesPost(new NextRequest('http://localhost/api/admin/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({ manualPixId: 'pix-1', manualRefundedAmountCentavos: 2_000 }),
    }));

    expect(setManualPixFinancialValue).toHaveBeenNthCalledWith(1, { manualPixId: 'pix-1', field: 'professionalPayoutCentavos', amountCentavos: 8_000 }, 'finance-user');
    expect(setManualPixFinancialValue).toHaveBeenNthCalledWith(2, { manualPixId: 'pix-1', field: 'manualRefundedAmountCentavos', amountCentavos: 2_000 }, 'finance-user');
  });

  it('creates a manually recorded PIX payment', async () => {
    const response = await receivablesPost(new NextRequest('http://localhost/api/admin/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({
        source: 'manual_pix',
        clientName: 'Ana Silva',
        professionalName: 'Brenda Martins',
        protocol: 'CDM-2026-00015',
        jobLabel: 'Atendimento domiciliar',
        amountCentavos: 15_000,
        paidAt: '2026-08-03',
        notes: 'Recebido por PIX',
      }),
    }));

    expect(response.status).toBe(201);
    expect(createManualReceivable).toHaveBeenCalledWith({
      clientName: 'Ana Silva',
      professionalName: 'Brenda Martins',
      protocol: 'CDM-2026-00015',
      jobLabel: 'Atendimento domiciliar',
      amountCentavos: 15_000,
      paidAt: '2026-08-03',
      notes: 'Recebido por PIX',
    }, 'finance-user');
  });

  it('falls back to safe financial defaults for invalid payout query parameters', async () => {
    const response = await payoutsGet(request('/api/admin/financeiro/repasses?window=12&pageSize=-10'));

    expect(response.status).toBe(200);
    expect(listPayoutTransfers).toHaveBeenCalledWith({ window: 30, month: undefined, cursor: undefined, pageSize: 50 });
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
    expect(getFinancialOverview).toHaveBeenCalledWith(365, undefined);
    expect(lines.find((line) => line.id === 'connect_commission_net_of_refunds')).toMatchObject({ status: 'available', amountCentavos: 2_000 });
    expect(lines.find((line) => line.id === 'net_cuideme_margin')).toMatchObject({ status: 'available', amountCentavos: 2_000 });
    expect(lines.find((line) => line.id === 'net_revenue')).toMatchObject({ status: 'unavailable', amountCentavos: null });
    expect(lines.find((line) => line.id === 'operating_profit')).toMatchObject({ status: 'unavailable', amountCentavos: null });
  });
});