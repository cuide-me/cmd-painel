import type Stripe from 'stripe';
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { toDate } from '@/modules/shared/domain/date';
import { getJobClientId, getJobProfessionalId } from '@/modules/shared/domain/job-fields';
import { getDisplayName } from '@/modules/shared/domain/text';
import type {
  FinancePerson,
  FinanceTimeWindow,
  FinancialOverview,
  ReceivableRow,
  ReceivableStatus,
  ReceivablesFilters,
  ReceivablesResult,
} from '../domain/types';

type FirestoreRecord = Record<string, unknown>;

const MAX_PAGE_SIZE = 100;
const OVERVIEW_PAGE_LIMIT = 10;
const MAX_FILTER_SCAN_RECORDS = 1_000;
const SIMPLES_NACIONAL_TAX_RESERVE_RATE = 0.06;

export function getJobProtocol(job: FirestoreRecord): string {
  const existingProtocol = job.protocol || job.protocolNumber || job.numeroProtocolo || job.codigoProtocolo;
  if (typeof existingProtocol === 'string' && existingProtocol.trim()) return existingProtocol.trim();

  const createdAt = toDate(job.createdAt || job.date || job.data);
  const year = createdAt?.getFullYear() || new Date().getFullYear();
  const suffix = String(job.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '00000';
  return `CDM-${year}-${suffix}`;
}

function getWindowStart(window: FinanceTimeWindow): number {
  return Math.floor((Date.now() - window * 24 * 60 * 60 * 1000) / 1000);
}

function getReceivableStatus(charge: Stripe.Charge): ReceivableStatus {
  if (charge.refunded) return 'refunded';
  if (charge.status === 'succeeded') return 'succeeded';
  if (charge.status === 'pending') return 'pending';
  return 'failed';
}

function getPaymentIntentId(charge: Stripe.Charge): string | null {
  return typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || null;
}

function getPaymentMethod(charge: Stripe.Charge): string | null {
  const type = charge.payment_method_details?.type;
  return typeof type === 'string' ? type : null;
}

function getStripeFeeCentavos(charge: Stripe.Charge): number | null {
  if (!charge.balance_transaction || typeof charge.balance_transaction === 'string') return null;
  return typeof charge.balance_transaction.fee === 'number' ? charge.balance_transaction.fee : null;
}

export function calculateConnectFinancials(charges: Array<{
  status: string;
  destination: unknown;
  amount: number;
  applicationFeeAmount: number | null;
  refundedApplicationFeeAmount: number | null;
  stripeFeeAmount: number | null;
}>) {
  const succeeded = charges.filter((charge) => charge.status === 'succeeded');
  const destinationCharges = succeeded.filter((charge) => Boolean(charge.destination));
  const legacyCharges = succeeded.length - destinationCharges.length;
  const hasCompleteFees = destinationCharges.every((charge) =>
    typeof charge.applicationFeeAmount === 'number'
    && typeof charge.refundedApplicationFeeAmount === 'number'
    && typeof charge.stripeFeeAmount === 'number'
  );
  const gmvCentavos = destinationCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const commissionCentavos = hasCompleteFees
    ? destinationCharges.reduce((sum, charge) => sum + (charge.applicationFeeAmount || 0), 0)
    : null;
  const refundedCommissionCentavos = hasCompleteFees
    ? destinationCharges.reduce((sum, charge) => sum + (charge.refundedApplicationFeeAmount || 0), 0)
    : null;
  const stripeFeesCentavos = hasCompleteFees
    ? destinationCharges.reduce((sum, charge) => sum + (charge.stripeFeeAmount || 0), 0)
    : null;

  return {
    destinationCharges: destinationCharges.length,
    legacyCharges,
    gmvCentavos: hasCompleteFees ? gmvCentavos : null,
    commissionCentavos,
    refundedCommissionCentavos,
    netCommissionCentavos: commissionCentavos !== null && refundedCommissionCentavos !== null
      ? commissionCentavos - refundedCommissionCentavos
      : null,
    stripeFeesCentavos,
    takeRatePercent: commissionCentavos !== null && gmvCentavos > 0
      ? Number(((commissionCentavos / gmvCentavos) * 100).toFixed(2))
      : null,
    isComplete: hasCompleteFees,
  };
}

export function calculateOperatingFinancials(charges: Array<{
  status: string;
  amount: number;
  stripeFeeAmount: number | null;
}>) {
  const succeeded = charges.filter((charge) => charge.status === 'succeeded');
  const hasCompleteFees = succeeded.every((charge) => typeof charge.stripeFeeAmount === 'number');
  const gmvCentavos = succeeded.reduce((sum, charge) => sum + charge.amount, 0);
  const stripeFeesCentavos = hasCompleteFees
    ? succeeded.reduce((sum, charge) => sum + (charge.stripeFeeAmount || 0), 0)
    : null;
  const taxReserveCentavos = Math.round(gmvCentavos * SIMPLES_NACIONAL_TAX_RESERVE_RATE);

  return {
    stripeFeesCentavos,
    taxReserveCentavos,
    taxReserveRatePercent: SIMPLES_NACIONAL_TAX_RESERVE_RATE * 100,
    balanceAfterFeesAndTaxReserveCentavos: stripeFeesCentavos === null
      ? null
      : gmvCentavos - stripeFeesCentavos - taxReserveCentavos,
    isComplete: hasCompleteFees,
  };
}

function getPaymentKeys(charge: Stripe.Charge): string[] {
  return [charge.id, getPaymentIntentId(charge)].filter((value): value is string => Boolean(value));
}

export async function getJobsByPaymentKeys(keys: string[]): Promise<Map<string, FirestoreRecord>> {
  const uniqueKeys = [...new Set(keys)];
  const jobsByKey = new Map<string, FirestoreRecord>();
  if (uniqueKeys.length === 0) return jobsByKey;

  const db = getFirestore();
  const fields = ['paymentIntentId', 'paymentId', 'stripePaymentIntentId', 'proposal.paymentIntentId'];

  for (let index = 0; index < uniqueKeys.length; index += 30) {
    const chunk = uniqueKeys.slice(index, index + 30);
    const snapshots = await Promise.all(
      fields.map(async (field) => {
        try {
          return await db.collection('jobs').where(field, 'in', chunk).get();
        } catch {
          return null;
        }
      })
    );

    snapshots.forEach((snapshot) => {
      if (!snapshot) return;

      snapshot.docs.forEach((document: QueryDocumentSnapshot) => {
        const job: FirestoreRecord = { id: document.id, ...(document.data() as FirestoreRecord) };
        const jobKeys = [
          job.paymentIntentId,
          job.paymentId,
          job.stripePaymentIntentId,
          (job.proposal as FirestoreRecord | undefined)?.paymentIntentId,
        ];
        jobKeys.forEach((key) => {
          if (typeof key === 'string' && uniqueKeys.includes(key)) jobsByKey.set(key, job);
        });
      });
    });
  }

  return jobsByKey;
}

async function getUsersByIds(ids: string[]): Promise<Map<string, FirestoreRecord>> {
  const uniqueIds = [...new Set(ids)];
  const users = new Map<string, FirestoreRecord>();
  if (uniqueIds.length === 0) return users;

  const db = getFirestore();
  for (let index = 0; index < uniqueIds.length; index += 50) {
    const refs = uniqueIds.slice(index, index + 50).map((id) => db.collection('users').doc(id));
    const documents = await db.getAll(...refs);
    documents.forEach((document: DocumentSnapshot) => {
      if (document.exists) users.set(document.id, document.data() as FirestoreRecord);
    });
  }

  return users;
}

function asPerson(id: string | undefined, users: Map<string, FirestoreRecord>): FinancePerson | null {
  if (!id) return null;
  return { id, name: getDisplayName(users.get(id)) };
}

async function mapCharges(charges: Stripe.Charge[]): Promise<ReceivableRow[]> {
  const paymentKeys = charges.flatMap(getPaymentKeys);
  const jobsByPaymentKey = await getJobsByPaymentKeys(paymentKeys);
  const userIds = new Set<string>();

  jobsByPaymentKey.forEach((job) => {
    const clientId = getJobClientId(job);
    const professionalId = getJobProfessionalId(job);
    if (clientId) userIds.add(clientId);
    if (professionalId) userIds.add(professionalId);
  });

  const users = await getUsersByIds([...userIds]);

  return charges.map((charge) => {
    const job = getPaymentKeys(charge)
      .map((key) => jobsByPaymentKey.get(key))
      .find((candidate): candidate is FirestoreRecord => Boolean(candidate));
    const clientId = job ? getJobClientId(job) : undefined;
    const professionalId = job ? getJobProfessionalId(job) : undefined;

    return {
      id: charge.id,
      stripePaymentIntentId: getPaymentIntentId(charge),
      createdAt: new Date(charge.created * 1000).toISOString(),
      amountCentavos: charge.amount,
      currency: charge.currency,
      status: getReceivableStatus(charge),
      paymentMethod: getPaymentMethod(charge),
      client: asPerson(clientId, users),
      professional: asPerson(professionalId, users),
      job: job ? { id: String(job.id), label: String(job.title || job.titulo || `Atendimento ${job.id}`), protocol: getJobProtocol(job) } : null,
      reconciliation: job ? 'reconciled' : 'unlinked',
      refundedAmountCentavos: charge.amount_refunded || 0,
    };
  });
}

function applyFilters(items: ReceivableRow[], filters: ReceivablesFilters): ReceivableRow[] {
  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.clientId && item.client?.id !== filters.clientId) return false;
    if (filters.professionalId && item.professional?.id !== filters.professionalId) return false;
    return true;
  });
}

export async function listReceivables(filters: ReceivablesFilters): Promise<ReceivablesResult> {
  const pageSize = Math.min(Math.max(filters.pageSize || 50, 1), MAX_PAGE_SIZE);
  const stripe = getStripeClient();
  const items: ReceivableRow[] = [];
  let cursor = filters.cursor;
  let hasMore = true;
  let scannedRecords = 0;

  // Stripe cannot filter charges by the job participants stored in Firestore.
  // Fetch only the remaining capacity so advancing the cursor never skips a matching row.
  while (items.length < pageSize && hasMore && scannedRecords < MAX_FILTER_SCAN_RECORDS) {
    const response = await stripe.charges.list({
      created: { gte: getWindowStart(filters.window) },
      limit: Math.min(pageSize - items.length, MAX_FILTER_SCAN_RECORDS - scannedRecords),
      ...(cursor ? { starting_after: cursor } : {}),
    });
    scannedRecords += response.data.length;
    items.push(...applyFilters(await mapCharges(response.data), filters));
    hasMore = response.has_more;
    cursor = response.data.length > 0 ? response.data[response.data.length - 1].id : undefined;

    if (response.data.length === 0) break;
  }

  return {
    items,
    nextCursor: hasMore ? cursor || null : null,
    coverage: {
      loadedRecords: scannedRecords,
      hasMore,
      isComplete: !hasMore,
      note: hasMore
        ? `A página filtrada percorreu ${scannedRecords} charges do período; avance para continuar a busca.`
        : scannedRecords > pageSize
          ? `A busca percorreu ${scannedRecords} charges para aplicar os filtros no período.`
          : undefined,
    },
    filtersApplied: {
      window: filters.window,
      status: filters.status,
      clientId: filters.clientId,
      professionalId: filters.professionalId,
    },
  };
}

export async function getReceivableById(id: string): Promise<ReceivableRow | null> {
  const stripe = getStripeClient();

  try {
    const charge = await stripe.charges.retrieve(id);
    const [row] = await mapCharges([charge]);
    return row || null;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'resource_missing') return null;
    throw error;
  }
}

export async function getFinancialOverview(window: FinanceTimeWindow): Promise<FinancialOverview> {
  const stripe = getStripeClient();
  const charges: Stripe.Charge[] = [];
  let cursor: string | undefined;
  let hasMore = false;

  for (let page = 0; page < OVERVIEW_PAGE_LIMIT; page += 1) {
    const response = await stripe.charges.list({
      created: { gte: getWindowStart(window) },
      limit: MAX_PAGE_SIZE,
      expand: ['data.application_fee', 'data.balance_transaction'],
      ...(cursor ? { starting_after: cursor } : {}),
    });
    charges.push(...response.data);
    hasMore = response.has_more;
    if (!response.has_more || response.data.length === 0) break;
    cursor = response.data[response.data.length - 1].id;
  }

  const rows = await mapCharges(charges);
  const succeeded = rows.filter((row) => row.status === 'succeeded');
  const isComplete = !hasMore;
  const gmvCentavos = succeeded.reduce((sum, row) => sum + row.amountCentavos, 0);
  const activeClients = new Set(succeeded.flatMap((row) => row.client ? [row.client.id] : [])).size;
  const activeProfessionals = new Set(succeeded.flatMap((row) => row.professional ? [row.professional.id] : [])).size;
  const connectFinancials = calculateConnectFinancials(charges.map((charge) => ({
    status: charge.status,
    destination: Boolean(charge.transfer || charge.on_behalf_of),
    amount: charge.amount,
    applicationFeeAmount: charge.application_fee_amount,
    refundedApplicationFeeAmount: typeof charge.application_fee === 'object' && charge.application_fee
      ? charge.application_fee.amount_refunded
      : null,
    stripeFeeAmount: getStripeFeeCentavos(charge),
  })));
  const operatingFinancials = calculateOperatingFinancials(charges.map((charge) => ({
    status: charge.status,
    amount: charge.amount,
    stripeFeeAmount: getStripeFeeCentavos(charge),
  })));

  return {
    window,
    generatedAt: new Date().toISOString(),
    coverage: {
      loadedRecords: rows.length,
      hasMore,
      isComplete,
      note: isComplete ? undefined : 'Resumo parcial: o periodo excede 1.000 charges. Refine o periodo para leitura completa.',
    },
    gmvCentavos: isComplete ? gmvCentavos : null,
    totalReceivedCentavos: isComplete ? gmvCentavos : null,
    successfulPayments: isComplete ? succeeded.length : null,
    averageTicketCentavos: isComplete && succeeded.length > 0 ? Math.round(gmvCentavos / succeeded.length) : null,
    activeClients: isComplete ? activeClients : null,
    activeProfessionals: isComplete ? activeProfessionals : null,
    soldShifts: isComplete ? succeeded.filter((row) => row.job !== null).length : null,
    refundedCentavos: isComplete ? rows.reduce((sum, row) => sum + row.refundedAmountCentavos, 0) : null,
    operatingFinancials: {
      ...operatingFinancials,
      stripeFeesCentavos: isComplete ? operatingFinancials.stripeFeesCentavos : null,
      taxReserveCentavos: isComplete ? operatingFinancials.taxReserveCentavos : null,
      balanceAfterFeesAndTaxReserveCentavos: isComplete
        ? operatingFinancials.balanceAfterFeesAndTaxReserveCentavos
        : null,
      note: operatingFinancials.isComplete
        ? undefined
        : 'Uma ou mais cobranças ainda não possuem tarifa Stripe disponível para leitura.',
    },
    connectFinancials: {
      ...connectFinancials,
      note: connectFinancials.legacyCharges > 0
        ? 'Há cobranças legadas sem destino Connect; elas não entram em comissão, taxa ou take rate Connect.'
        : undefined,
    },
    unavailableMetrics: [
      { id: 'hours_sold', label: 'Horas vendidas', reason: 'Jobs nao possuem duracao canonica consumida pelo painel.' },
      { id: 'taxes', label: 'Apuracao tributaria', reason: 'A reserva de 6% e uma estimativa operacional; a apuracao oficial exige dados fiscais e validacao contabil.' },
      { id: 'operating_profit', label: 'Lucro operacional', reason: 'Custos operacionais e a apuracao tributaria oficial nao estao disponiveis.' },
    ],
  };
}