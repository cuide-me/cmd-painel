import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import type { JobPaymentStatus, JobPaymentStatusInfo } from './types';

type FirestoreRecord = Record<string, unknown>;

const STATUS_LABELS: Record<JobPaymentStatus, string> = {
  protocol_created: 'Protocolo criado',
  awaiting_payment: 'Aguardando pagamento',
  processing: 'Pagamento em processamento',
  paid: 'Pagamento efetuado',
  failed: 'Pagamento falhou',
  refunded: 'Pagamento estornado',
  cancelled: 'Pagamento cancelado',
  unavailable: 'Status de pagamento indisponivel',
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getPaymentReference(job: FirestoreRecord): string | null {
  const proposal = job.proposal && typeof job.proposal === 'object' ? job.proposal as FirestoreRecord : {};
  return text(job.paymentIntentId)
    || text(job.paymentId)
    || text(job.stripePaymentIntentId)
    || text(job.chargeId)
    || text(job.stripeChargeId)
    || text(proposal.paymentIntentId);
}

function getStoredPaymentStatus(job: FirestoreRecord): string | null {
  const payment = job.payment && typeof job.payment === 'object' ? job.payment as FirestoreRecord : {};
  return text(job.paymentStatus) || text(job.stripePaymentStatus) || text(payment.status);
}

export function normalizeJobPaymentStatus(rawStatus: string | null, hasPaymentReference: boolean): JobPaymentStatus {
  if (!rawStatus) return hasPaymentReference ? 'awaiting_payment' : 'protocol_created';

  const status = rawStatus.trim().toLowerCase();
  if (['succeeded', 'paid', 'approved', 'completed'].includes(status)) return 'paid';
  if (['processing', 'in_progress'].includes(status)) return 'processing';
  if (['refunded', 'partially_refunded'].includes(status)) return 'refunded';
  if (['canceled', 'cancelled'].includes(status)) return 'cancelled';
  if (['failed', 'payment_failed'].includes(status)) return 'failed';
  if (['pending', 'open', 'unpaid', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'requires_capture'].includes(status)) {
    return 'awaiting_payment';
  }
  return 'unavailable';
}

function toPaymentStatusInfo(status: JobPaymentStatus, stripeStatus: string | null): JobPaymentStatusInfo {
  return { status, label: STATUS_LABELS[status], stripeStatus };
}

export async function getJobPaymentStatus(jobId: string): Promise<JobPaymentStatusInfo> {
  const document = await getFirestore().collection('jobs').doc(jobId).get();
  if (!document.exists) throw new Error('Atendimento nao encontrado');

  const job = document.data() as FirestoreRecord;
  const paymentReference = getPaymentReference(job);
  if (!paymentReference) return toPaymentStatusInfo('protocol_created', null);

  try {
    const stripe = getStripeClient();
    const stripeStatus = paymentReference.startsWith('ch_')
      ? (await stripe.charges.retrieve(paymentReference)).status
      : (await stripe.paymentIntents.retrieve(paymentReference)).status;
    return toPaymentStatusInfo(normalizeJobPaymentStatus(stripeStatus, true), stripeStatus);
  } catch {
    const storedStatus = getStoredPaymentStatus(job);
    return toPaymentStatusInfo(normalizeJobPaymentStatus(storedStatus, true), storedStatus);
  }
}