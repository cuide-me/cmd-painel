export type FinanceTimeWindow = 7 | 30 | 90 | 365;

export type ReceivableStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';

export interface FinanceSourceCoverage {
  loadedRecords: number;
  hasMore: boolean;
  isComplete: boolean;
  note?: string;
}

export interface FinancePerson {
  id: string;
  name: string;
}

export interface FinanceJobReference {
  id: string;
  label: string;
}

export interface ReceivableRow {
  id: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  amountCentavos: number;
  currency: string;
  status: ReceivableStatus;
  paymentMethod: string | null;
  client: FinancePerson | null;
  professional: FinancePerson | null;
  job: FinanceJobReference | null;
  reconciliation: 'reconciled' | 'unlinked';
  refundedAmountCentavos: number;
}

export interface ReceivablesFilters {
  window: FinanceTimeWindow;
  status: ReceivableStatus | 'all';
  clientId?: string;
  professionalId?: string;
  cursor?: string;
  pageSize?: number;
}

export interface ReceivablesResult {
  items: ReceivableRow[];
  nextCursor: string | null;
  coverage: FinanceSourceCoverage;
  filtersApplied: Omit<ReceivablesFilters, 'cursor' | 'pageSize'>;
}

export interface FinancialOverview {
  window: FinanceTimeWindow;
  generatedAt: string;
  coverage: FinanceSourceCoverage;
  gmvCentavos: number | null;
  totalReceivedCentavos: number | null;
  successfulPayments: number | null;
  averageTicketCentavos: number | null;
  activeClients: number | null;
  activeProfessionals: number | null;
  soldShifts: number | null;
  refundedCentavos: number | null;
  connectFinancials: {
    destinationCharges: number;
    legacyCharges: number;
    gmvCentavos: number | null;
    commissionCentavos: number | null;
    refundedCommissionCentavos: number | null;
    netCommissionCentavos: number | null;
    stripeFeesCentavos: number | null;
    takeRatePercent: number | null;
    isComplete: boolean;
    note?: string;
  };
  unavailableMetrics: Array<{
    id: string;
    label: string;
    reason: string;
  }>;
}

export type TransferLifecycle = 'transferred' | 'partially_reversed' | 'reversed';

export interface PayoutTransferRow {
  id: string;
  createdAt: string;
  amountCentavos: number;
  reversedAmountCentavos: number;
  currency: string;
  lifecycle: TransferLifecycle;
  professional: FinancePerson | null;
  job: FinanceJobReference | null;
  reconciliation: 'reconciled' | 'unlinked';
}

export interface PayoutTransfersResult {
  items: PayoutTransferRow[];
  nextCursor: string | null;
  coverage: FinanceSourceCoverage;
  summary: Record<TransferLifecycle, number>;
  bankPayoutReconciliation: {
    status: 'unavailable';
    reason: string;
  };
}