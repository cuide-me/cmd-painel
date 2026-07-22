import { calculateConnectFinancials, calculateOperatingFinancials, calculateReceivableFinancials } from '@/modules/finance/services/receivables';
import { getTransferLifecycle } from '@/modules/finance/services/payout-transfers';

describe('Connect financial calculations', () => {
  it('calculates fees and take rate only for Connect destination charges', () => {
    const result = calculateConnectFinancials([
      { status: 'succeeded', destination: true, amount: 10_000, applicationFeeAmount: 2_000, refundedApplicationFeeAmount: 300, stripeFeeAmount: 320 },
      { status: 'succeeded', destination: false, amount: 5_000, applicationFeeAmount: null, refundedApplicationFeeAmount: null, stripeFeeAmount: 180 },
      { status: 'failed', destination: true, amount: 8_000, applicationFeeAmount: null, refundedApplicationFeeAmount: null, stripeFeeAmount: null },
    ]);

    expect(result).toMatchObject({
      destinationCharges: 1,
      legacyCharges: 1,
      gmvCentavos: 10_000,
      commissionCentavos: 2_000,
      refundedCommissionCentavos: 300,
      netCommissionCentavos: 1_700,
      stripeFeesCentavos: 320,
      takeRatePercent: 20,
      isComplete: true,
    });
  });

  it('keeps Connect indicators unavailable when an effective fee is missing', () => {
    const result = calculateConnectFinancials([
      { status: 'succeeded', destination: true, amount: 10_000, applicationFeeAmount: null, refundedApplicationFeeAmount: null, stripeFeeAmount: 320 },
    ]);

    expect(result.isComplete).toBe(false);
    expect(result.commissionCentavos).toBeNull();
    expect(result.stripeFeesCentavos).toBeNull();
  });

  it('calculates Stripe fees and a 6% tax reserve for all successful charges', () => {
    const result = calculateOperatingFinancials([
      { status: 'succeeded', amount: 10_000, stripeFeeAmount: 320 },
      { status: 'succeeded', amount: 5_000, stripeFeeAmount: 180 },
      { status: 'failed', amount: 8_000, stripeFeeAmount: null },
    ]);

    expect(result).toEqual({
      stripeFeesCentavos: 500,
      taxReserveCentavos: 900,
      taxReserveRatePercent: 6,
      balanceAfterFeesAndTaxReserveCentavos: 13_600,
      isComplete: true,
    });
  });

  it('calculates a receivable net margin from payment less fees, tax reserve, and professional payout', () => {
    expect(calculateReceivableFinancials({
      amountCentavos: 15_000,
      professionalPayoutCentavos: 11_461,
      stripeFeeCentavos: 639,
    })).toEqual({
      taxReserveCentavos: 900,
      netCuidemeMarginCentavos: 2_000,
    });
  });

  it('does not infer a Cuide-me margin when the professional payout is unavailable', () => {
    expect(calculateReceivableFinancials({
      amountCentavos: 15_000,
      professionalPayoutCentavos: null,
      stripeFeeCentavos: 639,
    })).toEqual({
      taxReserveCentavos: 900,
      netCuidemeMarginCentavos: null,
    });
  });

  it('classifies transfer reversals without inferring payout status', () => {
    expect(getTransferLifecycle({ reversed: false, amount: 10_000, amountReversed: 0 })).toBe('transferred');
    expect(getTransferLifecycle({ reversed: false, amount: 10_000, amountReversed: 2_000 })).toBe('partially_reversed');
    expect(getTransferLifecycle({ reversed: true, amount: 10_000, amountReversed: 10_000 })).toBe('reversed');
  });
});