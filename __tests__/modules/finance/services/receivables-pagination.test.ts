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
      })),
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
      limit: 1,
    });
    expect(mockChargesList).toHaveBeenNthCalledWith(2, {
      created: { gte: expect.any(Number) },
      limit: 1,
      starting_after: 'ch_failed',
    });
  });
});