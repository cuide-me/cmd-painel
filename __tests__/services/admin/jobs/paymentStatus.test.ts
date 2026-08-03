import { normalizeJobPaymentStatus } from '@/services/admin/jobs/paymentStatus';

describe('job payment status normalization', () => {
  it('uses protocol creation when no payment exists', () => {
    expect(normalizeJobPaymentStatus(null, false)).toBe('protocol_created');
  });

  it('maps Stripe payment intent statuses to operational payment labels', () => {
    expect(normalizeJobPaymentStatus('requires_payment_method', true)).toBe('awaiting_payment');
    expect(normalizeJobPaymentStatus('requires_action', true)).toBe('awaiting_payment');
    expect(normalizeJobPaymentStatus('processing', true)).toBe('processing');
    expect(normalizeJobPaymentStatus('succeeded', true)).toBe('paid');
    expect(normalizeJobPaymentStatus('canceled', true)).toBe('cancelled');
  });
});