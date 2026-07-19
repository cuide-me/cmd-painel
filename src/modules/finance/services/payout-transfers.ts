import type Stripe from 'stripe';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { getDisplayName } from '@/modules/shared/domain/text';
import { getJobProfessionalId } from '@/modules/shared/domain/job-fields';
import type {
  FinancePerson,
  FinanceTimeWindow,
  PayoutTransferRow,
  PayoutTransfersResult,
  TransferLifecycle,
} from '../domain/types';
import { getJobsByPaymentKeys } from './receivables';

type FirestoreRecord = Record<string, unknown>;

const MAX_PAGE_SIZE = 100;

function getWindowStart(window: FinanceTimeWindow): number {
  return Math.floor((Date.now() - window * 24 * 60 * 60 * 1000) / 1000);
}

export function getTransferLifecycle(input: { reversed: boolean; amount: number; amountReversed: number }): TransferLifecycle {
  if (input.reversed || input.amountReversed >= input.amount) return 'reversed';
  if (input.amountReversed > 0) return 'partially_reversed';
  return 'transferred';
}

function getDestinationAccountId(transfer: Stripe.Transfer): string | null {
  return typeof transfer.destination === 'string' ? transfer.destination : transfer.destination?.id || null;
}

function getSourceTransactionId(transfer: Stripe.Transfer): string | null {
  return typeof transfer.source_transaction === 'string'
    ? transfer.source_transaction
    : transfer.source_transaction?.id || null;
}

async function getUsersByStripeAccountIds(accountIds: string[]): Promise<Map<string, FirestoreRecord>> {
  const ids = [...new Set(accountIds)];
  const usersByAccount = new Map<string, FirestoreRecord>();
  if (ids.length === 0) return usersByAccount;

  const db = getFirestore();
  const fields = ['stripeAccountId', 'stripeStatus.accountId', 'stripe_account_id'];
  for (let index = 0; index < ids.length; index += 30) {
    const chunk = ids.slice(index, index + 30);
    const snapshots = await Promise.all(fields.map(async (field) => {
      try {
        return await db.collection('users').where(field, 'in', chunk).get();
      } catch {
        return null;
      }
    }));

    snapshots.forEach((snapshot) => {
      if (!snapshot) return;
      snapshot.docs.forEach((document: QueryDocumentSnapshot) => {
        const user = document.data() as FirestoreRecord;
        const keys = [
          user.stripeAccountId,
          (user.stripeStatus as FirestoreRecord | undefined)?.accountId,
          user.stripe_account_id,
        ];
        keys.forEach((key) => {
          if (typeof key === 'string' && ids.includes(key)) usersByAccount.set(key, user);
        });
      });
    });
  }

  return usersByAccount;
}

function asProfessional(accountId: string | null, users: Map<string, FirestoreRecord>): FinancePerson | null {
  if (!accountId) return null;
  const user = users.get(accountId);
  return user ? { id: accountId, name: getDisplayName(user) } : null;
}

export async function listPayoutTransfers(input: {
  window: FinanceTimeWindow;
  cursor?: string;
  pageSize?: number;
}): Promise<PayoutTransfersResult> {
  const pageSize = Math.min(Math.max(input.pageSize || 50, 1), MAX_PAGE_SIZE);
  const stripe = getStripeClient();
  const response = await stripe.transfers.list({
    created: { gte: getWindowStart(input.window) },
    limit: pageSize,
    ...(input.cursor ? { starting_after: input.cursor } : {}),
  });
  const sourceTransactionIds = response.data
    .map(getSourceTransactionId)
    .filter((value): value is string => Boolean(value));
  const destinationAccountIds = response.data
    .map(getDestinationAccountId)
    .filter((value): value is string => Boolean(value));
  const [jobsByPaymentKey, usersByAccount] = await Promise.all([
    getJobsByPaymentKeys(sourceTransactionIds),
    getUsersByStripeAccountIds(destinationAccountIds),
  ]);

  const summary: Record<TransferLifecycle, number> = {
    transferred: 0,
    partially_reversed: 0,
    reversed: 0,
  };
  const items: PayoutTransferRow[] = response.data.map((transfer) => {
    const lifecycle = getTransferLifecycle({
      reversed: transfer.reversed,
      amount: transfer.amount,
      amountReversed: transfer.amount_reversed,
    });
    summary[lifecycle] += 1;
    const sourceTransactionId = getSourceTransactionId(transfer);
    const job = sourceTransactionId ? jobsByPaymentKey.get(sourceTransactionId) : undefined;
    const accountId = getDestinationAccountId(transfer);
    const jobProfessionalId = job ? getJobProfessionalId(job) : undefined;

    return {
      id: transfer.id,
      createdAt: new Date(transfer.created * 1000).toISOString(),
      amountCentavos: transfer.amount,
      reversedAmountCentavos: transfer.amount_reversed,
      currency: transfer.currency,
      lifecycle,
      professional: asProfessional(accountId, usersByAccount) || (jobProfessionalId ? { id: jobProfessionalId, name: 'Profissional do atendimento' } : null),
      job: job ? { id: String(job.id), label: String(job.title || job.titulo || `Atendimento ${job.id}`) } : null,
      reconciliation: job ? 'reconciled' : 'unlinked',
    };
  });

  return {
    items,
    nextCursor: response.has_more && response.data.length > 0 ? response.data[response.data.length - 1].id : null,
    coverage: {
      loadedRecords: response.data.length,
      hasMore: response.has_more,
      isComplete: !response.has_more,
      note: response.has_more ? 'A tabela apresenta uma página de transfers no período selecionado.' : undefined,
    },
    summary,
    bankPayoutReconciliation: {
      status: 'unavailable',
      reason: 'Payouts bancários são liquidados em lote por conta Connect e não carregam vínculo confiável com cada transfer neste contrato.',
    },
  };
}