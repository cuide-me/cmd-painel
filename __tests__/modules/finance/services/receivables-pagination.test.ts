const mockChargesList = jest.fn();
const mockGetStripeClient = jest.fn();
const mockGetFirestore = jest.fn();

jest.mock('@/lib/server/stripe', () => ({ getStripeClient: mockGetStripeClient }));
jest.mock('@/lib/server/firebaseAdmin', () => ({ getFirestore: mockGetFirestore }));

import { listReceivables } from '@/modules/finance/services/receivables';

function charge(id: string, status: 'failed' | 'succeeded') {
  return {
    id,
    payment_intent: null,
    created: 1_784_332_800,
    amount: 10_000,
    currency: 'brl',
    status,
    refunded: false,
    amount_refunded: 0,
  };
}

describe('listReceivables pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStripeClient.mockReturnValue({ charges: { list: mockChargesList } });
    mockGetFirestore.mockReturnValue({
      collection: jest.fn(() => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
        doc: jest.fn((id) => ({ id })),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      })),
      getAll: jest.fn().mockResolvedValue([]),
    });
  });

  it('continues through Stripe pages until it fills the requested filtered page', async () => {
    mockChargesList
      .mockResolvedValueOnce({ data: [charge('ch_failed', 'failed')], has_more: true })
      .mockResolvedValueOnce({ data: [charge('ch_succeeded', 'succeeded')], has_more: false });

    const result = await listReceivables({ window: 30, status: 'succeeded', pageSize: 1 });

    expect(result.items.map((item) => item.id)).toEqual(['ch_succeeded']);
    expect(result.coverage).toMatchObject({ loadedRecords: 2, hasMore: false, isComplete: true });
    expect(mockChargesList).toHaveBeenNthCalledWith(1, {
      created: { gte: expect.any(Number) },
      expand: ['data.balance_transaction'],
      limit: 1,
    });
    expect(mockChargesList).toHaveBeenNthCalledWith(2, {
      created: { gte: expect.any(Number) },
      expand: ['data.balance_transaction'],
      limit: 1,
      starting_after: 'ch_failed',
    });
  });

  it('uses the exact selected month as the Stripe date range', async () => {
    mockChargesList.mockResolvedValue({ data: [], has_more: false });

    await listReceivables({ window: 30, month: '2026-07', status: 'all', pageSize: 1 });

    expect(mockChargesList).toHaveBeenCalledWith(expect.objectContaining({
      created: { gte: 1_782_864_000, lt: 1_785_542_400 },
    }));
  });

  it('reconciles a charge to its job through Stripe metadata when payment fields are absent', async () => {
    const job = {
      exists: true,
      id: 'job-1',
      data: () => ({ title: 'Atendimento domiciliar', protocol: 'CDM-2026-00015' }),
    };
    mockGetFirestore.mockReturnValue({
      collection: jest.fn((name) => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
        doc: jest.fn((id) => ({ collection: name, id })),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      })),
      getAll: jest.fn((...documents) => Promise.resolve(documents[0]?.collection === 'jobs' ? [job] : [])),
    });
    mockChargesList.mockResolvedValue({
      data: [{ ...charge('ch_metadata', 'succeeded'), metadata: { jobId: 'job-1' } }],
      has_more: false,
    });

    const result = await listReceivables({ window: 30, status: 'all', pageSize: 1 });

    expect(result.items[0].job).toEqual({ id: 'job-1', label: 'Atendimento domiciliar', protocol: 'CDM-2026-00015' });
    expect(result.items[0].reconciliation).toBe('reconciled');
  });

  it('returns a manually saved protocol for an unlinked charge', async () => {
    const manualProtocolSetting = {
      id: 'ch_unlinked',
      data: () => ({ manualProtocol: 'CDM-2026-00016' }),
    };
    mockGetFirestore.mockReturnValue({
      collection: jest.fn((name) => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
        doc: jest.fn((id) => ({ collection: name, id })),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      })),
      getAll: jest.fn((...documents) => Promise.resolve(
        documents[0]?.collection === 'receivableSettings' ? [manualProtocolSetting] : []
      )),
    });
    mockChargesList.mockResolvedValue({ data: [charge('ch_unlinked', 'succeeded')], has_more: false });

    const result = await listReceivables({ window: 30, status: 'all', pageSize: 1 });

    expect(result.items[0]).toMatchObject({
      job: null,
      manualProtocol: 'CDM-2026-00016',
      reconciliation: 'unlinked',
    });
  });

  it('returns a manually saved refund alongside the Stripe refund amount', async () => {
    const manualRefundSetting = {
      id: 'ch_refunded',
      data: () => ({ manualRefundedAmountCentavos: 2_500 }),
    };
    mockGetFirestore.mockReturnValue({
      collection: jest.fn((name) => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
        doc: jest.fn((id) => ({ collection: name, id })),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      })),
      getAll: jest.fn((...documents) => Promise.resolve(
        documents[0]?.collection === 'receivableSettings' ? [manualRefundSetting] : []
      )),
    });
    mockChargesList.mockResolvedValue({ data: [{ ...charge('ch_refunded', 'succeeded'), amount_refunded: 1_000 }], has_more: false });

    const result = await listReceivables({ window: 30, status: 'all', pageSize: 1 });

    expect(result.items[0]).toMatchObject({ refundedAmountCentavos: 1_000, manualRefundedAmountCentavos: 2_500 });
  });

  it('does not apply a Stripe fee to a manually recorded PIX payment', async () => {
    mockGetFirestore.mockReturnValue({
      collection: jest.fn((name) => ({
        where: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })),
        doc: jest.fn((id) => ({ collection: name, id })),
        get: jest.fn().mockResolvedValue({
          docs: name === 'manualReceivables' ? [{
            id: 'pix-1',
            data: () => ({
              clientName: 'Ana Silva',
              protocol: 'CDM-2026-00015',
              amountCentavos: 15_000,
              paidAt: '2026-08-03',
              createdAt: new Date().toISOString(),
            }),
          }] : [],
        }),
      })),
      getAll: jest.fn().mockResolvedValue([]),
    });
    mockChargesList.mockResolvedValue({ data: [], has_more: false });

    const result = await listReceivables({ window: 30, status: 'all', pageSize: 1 });

    expect(result.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'manual_pix_pix-1', source: 'manual_pix', stripeFeeCentavos: 0 }),
    ]));
  });
});