import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { hoursBetween, toDate } from '@/lib/admin/dateHelpers';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getGa4AdminClient, getGa4AdminConfig } from '@/lib/server/ga4Admin';
import { getStripeClient } from '@/lib/server/stripe';
import {
  LEGACY_ANALYTICS_RENAMES,
  OFFICIAL_ANALYTICS_EVENTS,
  OFFICIAL_FUNNEL_SEQUENCE,
} from './analyticsCatalog';
import { getRegionKey, getSaoPauloZoneLabel, inferSaoPauloZone } from './region';
import { hasJobProfessional, isJobCompleted, isJobCancelled, normalizeJobStatus } from './statusNormalizer';
import type {
  AlertItem,
  Bottleneck,
  DashboardZoneKey,
  DashboardMetric,
  DataSourceKey,
  FunnelStep,
  HealthStatus,
  KpiDashboardResponse,
  MetricComparison,
  RegionSnapshot,
  SourceFreshness,
  TimeWindow,
  ZoneUserDistributionSummary,
} from './kpiDashboardTypes';

const ZONE_ORDER: DashboardZoneKey[] = ['norte', 'sul', 'leste', 'oeste'];

type FirestoreRecord = Record<string, any>;

interface RangeWindow {
  start: Date;
  end: Date;
}

interface WindowRanges {
  current: RangeWindow;
  previous: RangeWindow;
}

interface Ga4CountsResult {
  counts: Map<string, number>;
  freshness: SourceFreshness;
}

interface FirestoreLoadResult {
  users: FirestoreRecord[];
  jobs: FirestoreRecord[];
  ratings: FirestoreRecord[];
  tickets: FirestoreRecord[];
  freshness: SourceFreshness;
}

interface StripeLoadResult {
  charges: FirestoreRecord[];
  freshness: SourceFreshness;
  limitation?: string;
}

function createWindowRanges(windowDays: TimeWindow): WindowRanges {
  const now = new Date();
  const currentEnd = new Date(now);
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - (windowDays - 1));
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - windowDays);
  previousStart.setHours(0, 0, 0, 0);

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
  };
}

function formatGaDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildUnavailableFreshness(source: DataSourceKey, reason: string): SourceFreshness {
  return {
    source,
    status: 'unavailable',
    lastSuccessAt: null,
    reason,
  };
}

function buildFreshness(source: DataSourceKey, loadedAt: string, reason?: string): SourceFreshness {
  return {
    source,
    status: 'fresh',
    lastSuccessAt: loadedAt,
    reason: reason || null,
  };
}

function toMetricComparison(current: number | null, previous: number | null): MetricComparison | undefined {
  if (current === null) {
    return undefined;
  }

  if (previous === null || previous === 0) {
    return {
      previousValue: previous,
      changePercent: previous === 0 ? (current > 0 ? 100 : 0) : null,
      direction: current > 0 ? 'up' : 'stable',
    };
  }

  const delta = ((current - previous) / previous) * 100;
  let direction: MetricComparison['direction'] = 'stable';
  if (delta > 2) {
    direction = 'up';
  } else if (delta < -2) {
    direction = 'down';
  }

  return {
    previousValue: previous,
    changePercent: Number(delta.toFixed(1)),
    direction,
  };
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return Number(((numerator / denominator) * 100).toFixed(1));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(1));
}

function isInWindow(value: unknown, window: RangeWindow): boolean {
  const parsed = toDate(value);
  if (!parsed) {
    return false;
  }

  return parsed >= window.start && parsed <= window.end;
}

function sumEventCounts(counts: Map<string, number>, names: string[]): number | null {
  if (counts.size === 0) {
    return null;
  }

  return names.reduce((sum, name) => sum + (counts.get(name) || 0), 0);
}

function normalizeUserProfile(value: unknown): 'cliente' | 'profissional' | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (['cliente', 'familia', 'family'].includes(normalized)) {
    return 'cliente';
  }
  if (['profissional', 'professional', 'cuidador', 'specialist'].includes(normalized)) {
    return 'profissional';
  }
  return null;
}

function countUsersByProfile(users: FirestoreRecord[], profile: 'cliente' | 'profissional', window: RangeWindow): number {
  return users.filter((user) => {
    const userProfile = normalizeUserProfile(user.perfil || user.role || user.userRole);
    return userProfile === profile && isInWindow(user.createdAt, window);
  }).length;
}

function getFirstProposalAt(job: FirestoreRecord): Date | null {
  const directCandidates = [
    job.firstProposalAt,
    job.proposalCreatedAt,
    job.propostaCriadaEm,
    job.proposedAt,
    job.proposal?.sentAt,
    job.proposal?.createdAt,
  ];

  for (const candidate of directCandidates) {
    const parsed = toDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  const derivedDates: Date[] = [];
  if (Array.isArray(job.matches)) {
    for (const match of job.matches) {
      const parsed = toDate(match?.createdAt || match?.proposedAt);
      if (parsed) {
        derivedDates.push(parsed);
      }
    }
  }

  if (Array.isArray(job.proposals)) {
    for (const proposal of job.proposals) {
      const parsed = toDate(proposal?.createdAt || proposal?.sentAt || proposal?.proposedAt);
      if (parsed) {
        derivedDates.push(parsed);
      }
    }
  }

  if (derivedDates.length === 0) {
    return null;
  }

  derivedDates.sort((a, b) => a.getTime() - b.getTime());
  return derivedDates[0];
}

function getProposalAcceptedAt(job: FirestoreRecord): Date | null {
  const directCandidates = [
    job.proposal?.clientDecisionAt,
    job.contractAcceptedAt,
    job.proposal?.contractAcceptedAt,
    job.acceptedAt,
  ];

  for (const candidate of directCandidates) {
    const parsed = toDate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  const acceptedMatches: Date[] = [];
  if (Array.isArray(job.matches)) {
    for (const match of job.matches) {
      if (String(match?.status || '').toLowerCase() !== 'accepted') {
        continue;
      }

      const parsed = toDate(match?.acceptedAt || match?.updatedAt || match?.createdAt);
      if (parsed) {
        acceptedMatches.push(parsed);
      }
    }
  }

  if (acceptedMatches.length === 0) {
    return null;
  }

  acceptedMatches.sort((a, b) => a.getTime() - b.getTime());
  return acceptedMatches[0];
}

function getPaymentLookupKeys(job: FirestoreRecord): string[] {
  const candidates = [
    job.paymentIntentId,
    job.paymentId,
    job.stripePaymentIntentId,
    job.proposal?.paymentIntentId,
  ];

  return candidates
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
}

function getPaymentAt(job: FirestoreRecord, chargesByKey: Map<string, FirestoreRecord>): Date | null {
  for (const key of getPaymentLookupKeys(job)) {
    const charge = chargesByKey.get(key);
    if (!charge) {
      continue;
    }

    const created = typeof charge.created === 'number' ? charge.created * 1000 : charge.created;
    const parsed = toDate(created);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function buildChargesLookup(charges: FirestoreRecord[]): Map<string, FirestoreRecord> {
  const lookup = new Map<string, FirestoreRecord>();
  for (const charge of charges) {
    const keys = [charge.id, charge.payment_intent].filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );

    for (const key of keys) {
      lookup.set(key, charge);
    }
  }

  return lookup;
}

function buildMetric(params: Omit<DashboardMetric, 'comparison'> & { comparison?: MetricComparison }): DashboardMetric {
  return params;
}

function getCountValue(metric: DashboardMetric): number | null {
  return typeof metric.value === 'number' ? metric.value : null;
}

async function loadGa4CountsForWindow(window: RangeWindow): Promise<Ga4CountsResult> {
  const config = getGa4AdminConfig();
  if (!config.enabled || !config.propertyId) {
    return {
      counts: new Map(),
      freshness: buildUnavailableFreshness('ga4', config.error || 'GA4 nao configurado.'),
    };
  }

  try {
    const client = getGa4AdminClient();
    const [report] = await client.runReport({
      property: config.propertyId,
      dateRanges: [
        {
          startDate: formatGaDate(window.start),
          endDate: formatGaDate(window.end),
        },
      ],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: OFFICIAL_ANALYTICS_EVENTS.map((item) => item.technicalName),
            caseSensitive: false,
          },
        },
      },
      limit: OFFICIAL_ANALYTICS_EVENTS.length,
    });

    const counts = new Map<string, number>();
    for (const row of report.rows || []) {
      const eventName = row.dimensionValues?.[0]?.value;
      const eventCount = Number(row.metricValues?.[0]?.value || 0);
      if (eventName) {
        counts.set(eventName, eventCount);
      }
    }

    return {
      counts,
      freshness: buildFreshness('ga4', new Date().toISOString()),
    };
  } catch (error) {
    return {
      counts: new Map(),
      freshness: buildUnavailableFreshness(
        'ga4',
        error instanceof Error ? error.message : 'Falha ao consultar GA4.'
      ),
    };
  }
}

async function loadFirestoreData(ranges: WindowRanges): Promise<FirestoreLoadResult> {
  const db = getFirestore();
  const previousStart = Timestamp.fromDate(ranges.previous.start);

  try {
    const [usersSnap, jobsSnap, ratingsSnap, ticketsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('jobs').where('createdAt', '>=', previousStart).get(),
      db.collection('ratings').where('createdAt', '>=', previousStart).get().catch(() => db.collection('ratings').get()),
      db.collection('tickets').where('createdAt', '>=', previousStart).get().catch(() => db.collection('tickets').get()),
    ]);

    return {
      users: usersSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
      jobs: jobsSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
      ratings: ratingsSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
      tickets: ticketsSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
      freshness: buildFreshness('firebase', new Date().toISOString()),
    };
  } catch (error) {
    return {
      users: [],
      jobs: [],
      ratings: [],
      tickets: [],
      freshness: buildUnavailableFreshness(
        'firebase',
        error instanceof Error ? error.message : 'Falha ao consultar Firestore.'
      ),
    };
  }
}

async function loadStripeData(ranges: WindowRanges): Promise<StripeLoadResult> {
  try {
    const stripe = getStripeClient();
    const sinceUnix = Math.floor(ranges.previous.start.getTime() / 1000);
    const charges: FirestoreRecord[] = [];
    let startingAfter: string | undefined;
    let truncated = false;

    for (let page = 0; page < 15; page += 1) {
      const response = await stripe.charges.list({
        created: { gte: sinceUnix },
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      charges.push(...(response.data as unknown as FirestoreRecord[]));

      if (!response.has_more || response.data.length === 0) {
        break;
      }

      if (page === 14) {
        truncated = true;
        break;
      }

      startingAfter = response.data[response.data.length - 1]?.id;
    }

    return {
      charges,
      freshness: buildFreshness(
        'stripe',
        new Date().toISOString(),
        truncated ? 'Leitura limitada a 1.500 charges por janela combinada.' : undefined
      ),
      limitation: truncated ? 'Leitura limitada a 1.500 charges por janela combinada.' : undefined,
    };
  } catch (error) {
    return {
      charges: [],
      freshness: buildUnavailableFreshness(
        'stripe',
        error instanceof Error ? error.message : 'Falha ao consultar Stripe.'
      ),
    };
  }
}

function partitionRecords(records: FirestoreRecord[], window: RangeWindow, dateSelector: (item: FirestoreRecord) => unknown): FirestoreRecord[] {
  return records.filter((record) => isInWindow(dateSelector(record), window));
}

function classifyMetricStatus(current: number | null, thresholds: { warning?: number; critical?: number }, inverse = false): HealthStatus {
  if (current === null) {
    return 'info';
  }

  const warning = thresholds.warning;
  const critical = thresholds.critical;

  if (inverse) {
    if (critical !== undefined && current <= critical) return 'critical';
    if (warning !== undefined && current <= warning) return 'warning';
    return 'ok';
  }

  if (critical !== undefined && current >= critical) return 'critical';
  if (warning !== undefined && current >= warning) return 'warning';
  return 'ok';
}

function buildExecutiveMetrics(
  currentUsers: FirestoreRecord[],
  previousUsers: FirestoreRecord[],
  currentGa4Counts: Map<string, number>,
  previousGa4Counts: Map<string, number>
): DashboardMetric[] {
  const currentFamilies = countUsersByProfile(currentUsers, 'cliente', { start: new Date(0), end: new Date() });
  const previousFamilies = countUsersByProfile(previousUsers, 'cliente', { start: new Date(0), end: new Date() });
  const currentProfessionals = countUsersByProfile(currentUsers, 'profissional', { start: new Date(0), end: new Date() });
  const previousProfessionals = countUsersByProfile(previousUsers, 'profissional', { start: new Date(0), end: new Date() });

  const eventMetric = (
    id: string,
    label: string,
    technicalName: string,
    definition: string,
    businessGoal: string,
    decision: string,
    expectedAction: string
  ) => {
    const current = currentGa4Counts.get(technicalName) || 0;
    const previous = previousGa4Counts.get(technicalName) || 0;
    return buildMetric({
      id,
      label,
      technicalName,
      value: current,
      status: current > 0 ? 'ok' : 'info',
      source: ['ga4'],
      scope: 'executivo',
      definition,
      businessGoal,
      decision,
      expectedAction,
      comparison: toMetricComparison(current, previous),
    });
  };

  return [
    buildMetric({
      id: 'families_registered',
      label: 'Familias cadastradas',
      technicalName: 'sign_up',
      value: currentFamilies,
      status: currentFamilies > 0 ? 'ok' : 'info',
      source: ['firebase'],
      scope: 'executivo',
      definition: 'Usuarios com perfil de cliente criados no periodo.',
      businessGoal: 'Acompanhar a entrada real de demanda no marketplace.',
      decision: 'Ajuda a decidir esforco de aquisicao de familias.',
      expectedAction: 'Revisar canais e campanhas quando houver queda relevante.',
      note: 'Fonte operacional por ser mais confiavel para cadastro persistido.',
      comparison: toMetricComparison(currentFamilies, previousFamilies),
    }),
    buildMetric({
      id: 'professionals_registered',
      label: 'Profissionais cadastrados',
      technicalName: 'sign_up',
      value: currentProfessionals,
      status: currentProfessionals > 0 ? 'ok' : 'info',
      source: ['firebase'],
      scope: 'executivo',
      definition: 'Usuarios com perfil profissional criados no periodo.',
      businessGoal: 'Medir crescimento da oferta cadastrada.',
      decision: 'Ajuda a decidir reforco de captacao e onboarding de profissionais.',
      expectedAction: 'Ativar captacao regional quando a oferta nova cair.',
      note: 'Fonte operacional por representar cadastros persistidos.',
      comparison: toMetricComparison(currentProfessionals, previousProfessionals),
    }),
    eventMetric(
      'logins_completed',
      'Logins realizados',
      'login',
      'Quantidade de eventos login no periodo.',
      'Medir retorno e uso ativo da plataforma.',
      'Ajuda a decidir se a base esta voltando ao produto.',
      'Investigar friccao de acesso e reengajamento quando houver queda.'
    ),
    eventMetric(
      'care_requests_started',
      'Solicitacoes iniciadas',
      'care_request_started',
      'Quantidade de inicios do fluxo de contratacao.',
      'Medir intencao de contratacao.',
      'Ajuda a decidir se a demanda esta entrando no topo do funil.',
      'Revisar descoberta de profissional e pagina de oferta quando houver queda.'
    ),
    eventMetric(
      'care_requests_created',
      'Solicitacoes criadas',
      'care_request_created',
      'Quantidade de solicitacoes efetivamente criadas.',
      'Medir demanda qualificada que virou pedido real.',
      'Ajuda a decidir prioridades de matching e cobertura de oferta.',
      'Ajustar cobertura operacional quando o volume cresce sem oferta equivalente.'
    ),
    eventMetric(
      'proposals_sent',
      'Propostas enviadas',
      'proposal_sent',
      'Quantidade de propostas enviadas a partir das solicitacoes.',
      'Medir resposta operacional da oferta para a demanda.',
      'Ajuda a decidir se o motor operacional esta cobrindo pedidos.',
      'Atacar regioes e especialidades com baixa cobertura.'
    ),
    eventMetric(
      'proposals_accepted',
      'Propostas aceitas',
      'proposal_accepted',
      'Quantidade de propostas aceitas no periodo.',
      'Medir conversao comercial do meio do funil.',
      'Ajuda a decidir ajustes de preco, qualidade de proposta e velocidade.',
      'Revisar roteiro comercial e qualidade das propostas quando cair.'
    ),
    eventMetric(
      'payments_confirmed',
      'Pagamentos confirmados',
      'payment_confirmed',
      'Quantidade de pagamentos confirmados no periodo.',
      'Medir fechamento real de receita.',
      'Ajuda a decidir foco em cobranca, checkout e conciliacao.',
      'Investigar falhas entre aceite e pagamento quando houver queda.'
    ),
    eventMetric(
      'services_completed',
      'Servicos com encerramento confirmado',
      'service_completion_confirmed',
      'Quantidade de servicos com encerramento confirmado.',
      'Medir qualidade de fechamento do fluxo.',
      'Ajuda a decidir onde o processo termina ou perde confianca.',
      'Revisar acompanhamento de servicos e encerramento quando cair.'
    ),
    eventMetric(
      'refunds_processed',
      'Reembolsos processados',
      'refund_processed',
      'Quantidade de reembolsos efetivamente processados.',
      'Monitorar perda de confianca e impacto financeiro.',
      'Ajuda a decidir quando escalonar analise de qualidade operacional.',
      'Auditar causas de reembolso quando houver alta.'
    ),
  ];
}

function buildFunnel(currentGa4Counts: Map<string, number>): FunnelStep[] {
  const steps: FunnelStep[] = [];

  for (const definition of OFFICIAL_FUNNEL_SEQUENCE) {
    const value = sumEventCounts(currentGa4Counts, definition.technicalNames);
    const previousValue = steps.length > 0 ? steps[steps.length - 1].value : null;
    const startValue = steps.length > 0 ? steps[0].value : value;

    steps.push({
      id: definition.id,
      label: definition.label,
      technicalNames: definition.technicalNames,
      value,
      source: ['ga4'],
      conversionFromPrevious:
        value === null || previousValue === null ? null : rate(value, previousValue),
      conversionFromStart: value === null || startValue === null ? null : rate(value, startValue),
      note: definition.note,
    });
  }

  return steps;
}

function buildOperationalHealth(
  currentJobs: FirestoreRecord[],
  previousJobs: FirestoreRecord[],
  currentGa4Counts: Map<string, number>,
  previousGa4Counts: Map<string, number>,
  chargesByKey: Map<string, FirestoreRecord>
): { metrics: DashboardMetric[]; bottlenecks: Bottleneck[] } {
  const currentProfileCompleted =
    (currentGa4Counts.get('professional_profile_completed') || 0) +
    (currentGa4Counts.get('family_profile_completed') || 0);
  const previousProfileCompleted =
    (previousGa4Counts.get('professional_profile_completed') || 0) +
    (previousGa4Counts.get('family_profile_completed') || 0);

  const currentSignUps = currentGa4Counts.get('sign_up') || 0;
  const previousSignUps = previousGa4Counts.get('sign_up') || 0;
  const currentSelections = currentGa4Counts.get('professional_profile_selected') || 0;
  const previousSelections = previousGa4Counts.get('professional_profile_selected') || 0;
  const currentRequestsCreated = currentGa4Counts.get('care_request_created') || 0;
  const previousRequestsCreated = previousGa4Counts.get('care_request_created') || 0;
  const currentProposalsSent = currentGa4Counts.get('proposal_sent') || 0;
  const previousProposalsSent = previousGa4Counts.get('proposal_sent') || 0;
  const currentProposalsAccepted = currentGa4Counts.get('proposal_accepted') || 0;
  const previousProposalsAccepted = previousGa4Counts.get('proposal_accepted') || 0;
  const currentPaymentsConfirmed = currentGa4Counts.get('payment_confirmed') || 0;
  const previousPaymentsConfirmed = previousGa4Counts.get('payment_confirmed') || 0;
  const currentServicesCompleted = currentGa4Counts.get('service_completion_confirmed') || 0;
  const previousServicesCompleted = previousGa4Counts.get('service_completion_confirmed') || 0;
  const currentRefundsProcessed = currentGa4Counts.get('refund_processed') || 0;
  const previousRefundsProcessed = previousGa4Counts.get('refund_processed') || 0;
  const currentServicesCanceled = currentGa4Counts.get('service_canceled') || 0;
  const previousServicesCanceled = previousGa4Counts.get('service_canceled') || 0;

  const proposalLeadHours: number[] = [];
  const proposalToAcceptHours: number[] = [];
  const acceptToPaymentHours: number[] = [];

  for (const job of currentJobs) {
    const createdAt = toDate(job.createdAt);
    const proposalAt = getFirstProposalAt(job);
    const acceptedAt = getProposalAcceptedAt(job);
    const paymentAt = getPaymentAt(job, chargesByKey);

    const firstInterval = hoursBetween(createdAt, proposalAt);
    if (firstInterval !== null && firstInterval >= 0) {
      proposalLeadHours.push(firstInterval);
    }

    const secondInterval = hoursBetween(proposalAt, acceptedAt);
    if (secondInterval !== null && secondInterval >= 0) {
      proposalToAcceptHours.push(secondInterval);
    }

    const thirdInterval = hoursBetween(acceptedAt, paymentAt);
    if (thirdInterval !== null && thirdInterval >= 0) {
      acceptToPaymentHours.push(thirdInterval);
    }
  }

  const currentProfileRate = rate(currentProfileCompleted, currentSignUps);
  const previousProfileRate = rate(previousProfileCompleted, previousSignUps);
  const currentSelectionRate = rate(currentSelections, currentProfileCompleted);
  const previousSelectionRate = rate(previousSelections, previousProfileCompleted);
  const currentCoverageRate = rate(currentProposalsSent, currentRequestsCreated);
  const previousCoverageRate = rate(previousProposalsSent, previousRequestsCreated);
  const currentAcceptanceRate = rate(currentProposalsAccepted, currentProposalsSent);
  const previousAcceptanceRate = rate(previousProposalsAccepted, previousProposalsSent);
  const currentPaymentRate = rate(currentPaymentsConfirmed, currentProposalsAccepted);
  const previousPaymentRate = rate(previousPaymentsConfirmed, previousProposalsAccepted);
  const currentCompletionRate = rate(currentServicesCompleted, currentPaymentsConfirmed);
  const previousCompletionRate = rate(previousServicesCompleted, previousPaymentsConfirmed);
  const currentRefundRate = rate(currentRefundsProcessed, currentPaymentsConfirmed);
  const previousRefundRate = rate(previousRefundsProcessed, previousPaymentsConfirmed);
  const currentCancellationRate = rate(currentServicesCanceled, currentProposalsAccepted);
  const previousCancellationRate = rate(previousServicesCanceled, previousProposalsAccepted);

  const jobsWithoutProposal = currentJobs.filter((job) => !getFirstProposalAt(job)).length;
  const jobsAcceptedWithoutPayment = currentJobs.filter((job) => getProposalAcceptedAt(job) && !getPaymentAt(job, chargesByKey)).length;
  const jobsMatchedLong = currentJobs.filter((job) => {
    const acceptedAt = getProposalAcceptedAt(job);
    const paymentAt = getPaymentAt(job, chargesByKey);
    const normalized = normalizeJobStatus(String(job.status || 'pending'));
    return acceptedAt && !paymentAt && ['matched', 'active', 'completed'].includes(normalized);
  }).length;

  const previousJobsWithoutProposal = previousJobs.filter((job) => !getFirstProposalAt(job)).length;

  const metrics: DashboardMetric[] = [
    buildMetric({
      id: 'profile_completion_rate',
      label: 'Conversao cadastro -> perfil concluido',
      value: currentProfileRate,
      unit: '%',
      status: classifyMetricStatus(currentProfileRate, { warning: 55, critical: 40 }, true),
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Percentual de cadastros que avancam ate perfil concluido no periodo.',
      businessGoal: 'Medir atrito inicial do onboarding.',
      decision: 'Ajuda a decidir se o problema esta no cadastro ou no onboarding.',
      expectedAction: 'Simplificar formularios e reforcar completude quando a taxa cair.',
      comparison: toMetricComparison(currentProfileRate, previousProfileRate),
    }),
    buildMetric({
      id: 'selection_after_profile_rate',
      label: 'Conversao perfil -> selecao de profissional',
      value: currentSelectionRate,
      unit: '%',
      status: classifyMetricStatus(currentSelectionRate, { warning: 45, critical: 30 }, true),
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Percentual de perfis concluidos que avancam para selecao de profissional.',
      businessGoal: 'Medir qualidade da jornada de descoberta e confianca.',
      decision: 'Ajuda a decidir se a oferta esta sendo percebida como relevante.',
      expectedAction: 'Revisar busca, cards e elementos de confianca quando cair.',
      comparison: toMetricComparison(currentSelectionRate, previousSelectionRate),
    }),
    buildMetric({
      id: 'request_to_proposal_rate',
      label: 'Conversao solicitacao criada -> proposta enviada',
      value: currentCoverageRate,
      unit: '%',
      status: classifyMetricStatus(currentCoverageRate, { warning: 70, critical: 50 }, true),
      source: ['ga4', 'firebase'],
      scope: 'operacional',
      definition: 'Percentual de solicitacoes criadas que recebem proposta.',
      businessGoal: 'Medir cobertura operacional da oferta sobre a demanda.',
      decision: 'Ajuda a decidir prioridade de matching e captacao local.',
      expectedAction: 'Escalar regioes e especialidades com baixa cobertura.',
      comparison: toMetricComparison(currentCoverageRate, previousCoverageRate),
    }),
    buildMetric({
      id: 'proposal_acceptance_rate',
      label: 'Taxa de aceite de proposta',
      technicalName: 'proposal_accepted',
      value: currentAcceptanceRate,
      unit: '%',
      status: classifyMetricStatus(currentAcceptanceRate, { warning: 40, critical: 25 }, true),
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Percentual de propostas enviadas que viram aceite.',
      businessGoal: 'Medir aderencia comercial de proposta, preco e timing.',
      decision: 'Ajuda a decidir se o gargalo esta na proposta ou na oferta.',
      expectedAction: 'Revisar qualidade das propostas e SLA comercial quando cair.',
      comparison: toMetricComparison(currentAcceptanceRate, previousAcceptanceRate),
    }),
    buildMetric({
      id: 'refund_rate',
      label: 'Taxa de reembolso',
      technicalName: 'refund_processed',
      value: currentRefundRate,
      unit: '%',
      status: classifyMetricStatus(currentRefundRate, { warning: 5, critical: 10 }),
      source: ['ga4', 'stripe'],
      scope: 'operacional',
      definition: 'Percentual de pagamentos confirmados que viraram reembolso processado.',
      businessGoal: 'Medir perda de confianca e desgaste operacional.',
      decision: 'Ajuda a decidir onde ha quebra de experiencia ou politica.',
      expectedAction: 'Auditar causas e rotas com maior incidencia quando subir.',
      comparison: toMetricComparison(currentRefundRate, previousRefundRate),
    }),
    buildMetric({
      id: 'cancellation_rate',
      label: 'Taxa de cancelamento',
      technicalName: 'service_canceled',
      value: currentCancellationRate,
      unit: '%',
      status: classifyMetricStatus(currentCancellationRate, { warning: 10, critical: 18 }),
      source: ['ga4', 'firebase'],
      scope: 'operacional',
      definition: 'Percentual de propostas aceitas que resultaram em servico cancelado.',
      businessGoal: 'Monitorar confianca apos a formalizacao da contratacao.',
      decision: 'Ajuda a decidir se o problema esta em disponibilidade, expectativa ou processo.',
      expectedAction: 'Acompanhar causas por profissional, familia e timing do cancelamento.',
      comparison: toMetricComparison(currentCancellationRate, previousCancellationRate),
    }),
    buildMetric({
      id: 'avg_request_to_proposal_hours',
      label: 'Tempo medio entre solicitacao criada e proposta enviada',
      value: average(proposalLeadHours),
      unit: 'h',
      status: classifyMetricStatus(average(proposalLeadHours), { warning: 12, critical: 24 }),
      source: ['firebase'],
      scope: 'diagnostico',
      definition: 'Tempo medio entre createdAt do job e o primeiro timestamp de proposta.',
      businessGoal: 'Medir velocidade de resposta operacional.',
      decision: 'Ajuda a decidir onde o matching esta lento.',
      expectedAction: 'Ativar fila manual ou redistribuicao quando ultrapassar o SLA.',
    }),
    buildMetric({
      id: 'avg_proposal_to_accept_hours',
      label: 'Tempo medio entre proposta enviada e proposta aceita',
      value: average(proposalToAcceptHours),
      unit: 'h',
      status: classifyMetricStatus(average(proposalToAcceptHours), { warning: 24, critical: 48 }),
      source: ['firebase'],
      scope: 'diagnostico',
      definition: 'Tempo medio entre envio de proposta e aceite registrado.',
      businessGoal: 'Medir velocidade comercial no meio do funil.',
      decision: 'Ajuda a decidir se ha demora de resposta do cliente ou friccao na proposta.',
      expectedAction: 'Revisar follow-up e clareza da proposta quando o tempo subir.',
    }),
    buildMetric({
      id: 'avg_accept_to_payment_hours',
      label: 'Tempo medio entre proposta aceita e pagamento confirmado',
      value: average(acceptToPaymentHours),
      unit: 'h',
      status: classifyMetricStatus(average(acceptToPaymentHours), { warning: 12, critical: 24 }),
      source: ['firebase', 'stripe'],
      scope: 'diagnostico',
      definition: 'Tempo medio entre aceite da proposta e charge conciliada no Stripe.',
      businessGoal: 'Medir atrito final de fechamento.',
      decision: 'Ajuda a decidir se o gargalo esta no checkout ou na cobranca.',
      expectedAction: 'Revisar pagamento e conciliacao quando o tempo subir.',
      note: 'Calculado por conciliacao de paymentIntent/paymentId dos jobs com charges.',
    }),
  ];

  const jobsTotal = currentJobs.length;
  const withoutProposalRate = rate(jobsWithoutProposal, jobsTotal);
  const previousWithoutProposalRate = rate(previousJobsWithoutProposal, previousJobs.length);

  const bottlenecks: Bottleneck[] = [
    {
      id: 'requests_without_proposal',
      label: 'Solicitacoes sem proposta',
      volume: jobsWithoutProposal,
      description:
        withoutProposalRate === null
          ? 'Nao ha base suficiente para medir cobertura de proposta.'
          : `${withoutProposalRate.toFixed(1)}% das solicitacoes do periodo ainda nao receberam proposta.`,
      expectedAction: 'Priorizar matching e cobertura local onde a fila sem proposta cresce.',
      source: ['firebase'],
      status: classifyMetricStatus(withoutProposalRate, { warning: 30, critical: 45 }),
    },
    {
      id: 'accepted_without_payment',
      label: 'Aceites sem pagamento confirmado',
      volume: jobsAcceptedWithoutPayment,
      description: 'Jobs com aceite registrado e sem conciliacao de pagamento confirmada.',
      expectedAction: 'Auditar cobranca, checkout e comunicacao de pagamento.',
      source: ['firebase', 'stripe'],
      status: jobsAcceptedWithoutPayment >= 10 ? 'critical' : jobsAcceptedWithoutPayment > 0 ? 'warning' : 'ok',
    },
    {
      id: 'matched_stuck',
      label: 'Servico travado apos aceite',
      volume: jobsMatchedLong,
      description: 'Jobs com aceite identificado que seguem sem pagamento confirmado.',
      expectedAction: 'Acionar operacao para destravar o fim do funil.',
      source: ['firebase', 'stripe'],
      status: jobsMatchedLong >= 8 ? 'critical' : jobsMatchedLong > 0 ? 'warning' : 'ok',
    },
    {
      id: 'mid_funnel_conversion',
      label: 'Conversao critica no meio do funil',
      volume: currentProposalsSent - currentProposalsAccepted,
      description:
        currentAcceptanceRate === null
          ? 'Sem base para medir aceite de proposta.'
          : `A taxa de aceite esta em ${currentAcceptanceRate.toFixed(1)}% no periodo.`,
      expectedAction: 'Rever qualidade da proposta, prazo de resposta e alinhamento de preco.',
      source: ['ga4'],
      status: classifyMetricStatus(currentAcceptanceRate, { warning: 40, critical: 25 }, true),
    },
  ];

  if (previousWithoutProposalRate !== null && withoutProposalRate !== null && withoutProposalRate < previousWithoutProposalRate) {
    bottlenecks[0].status = 'ok';
  }

  return { metrics, bottlenecks };
}

function buildLiquidity(
  currentJobs: FirestoreRecord[],
  previousJobs: FirestoreRecord[],
  currentGa4Counts: Map<string, number>,
  previousGa4Counts: Map<string, number>,
  allUsers: FirestoreRecord[]
): { metrics: DashboardMetric[]; regions: RegionSnapshot[]; usersByZone: ZoneUserDistributionSummary } {
  const currentRequestsCreated = currentGa4Counts.get('care_request_created') || 0;
  const previousRequestsCreated = previousGa4Counts.get('care_request_created') || 0;
  const currentProposalsSent = currentGa4Counts.get('proposal_sent') || 0;
  const previousProposalsSent = previousGa4Counts.get('proposal_sent') || 0;
  const currentProposalsAccepted = currentGa4Counts.get('proposal_accepted') || 0;
  const previousProposalsAccepted = previousGa4Counts.get('proposal_accepted') || 0;
  const currentProfessionalProfiles = currentGa4Counts.get('professional_profile_completed') || 0;
  const previousProfessionalProfiles = previousGa4Counts.get('professional_profile_completed') || 0;

  const currentCoverage = rate(currentProposalsSent, currentRequestsCreated);
  const previousCoverage = rate(previousProposalsSent, previousRequestsCreated);
  const demandOfferRatio = currentProposalsSent > 0 ? Number((currentRequestsCreated / currentProposalsSent).toFixed(2)) : null;
  const previousDemandOfferRatio = previousProposalsSent > 0 ? Number((previousRequestsCreated / previousProposalsSent).toFixed(2)) : null;
  const requestsWithoutProposal = currentJobs.filter((job) => !getFirstProposalAt(job)).length;
  const previousRequestsWithoutProposal = previousJobs.filter((job) => !getFirstProposalAt(job)).length;
  const requestsWithoutProposalRate = rate(requestsWithoutProposal, currentJobs.length);
  const previousRequestsWithoutProposalRate = rate(previousRequestsWithoutProposal, previousJobs.length);
  const currentMatchRate = rate(currentJobs.filter((job) => hasJobProfessional(job)).length, currentJobs.length);
  const previousMatchRate = rate(previousJobs.filter((job) => hasJobProfessional(job)).length, previousJobs.length);
  const currentAcceptanceRate = rate(currentProposalsAccepted, currentProposalsSent);
  const previousAcceptanceRate = rate(previousProposalsAccepted, previousProposalsSent);

  const regionMap = new Map<string, RegionSnapshot>();
  for (const job of currentJobs) {
    const region = getRegionKey(job);
    if (!regionMap.has(region.key)) {
      regionMap.set(region.key, {
        region: region.label,
        cidade: region.cidade,
        estado: region.estado,
        requestsCreated: 0,
        requestsWithoutProposal: 0,
        matchedJobs: 0,
        completedJobs: 0,
        withoutProposalRate: null,
      });
    }

    const snapshot = regionMap.get(region.key)!;
    snapshot.requestsCreated += 1;
    if (!getFirstProposalAt(job)) {
      snapshot.requestsWithoutProposal += 1;
    }
    if (hasJobProfessional(job)) {
      snapshot.matchedJobs += 1;
    }
    if (isJobCompleted(job)) {
      snapshot.completedJobs += 1;
    }
  }

  const regions = Array.from(regionMap.values())
    .map((item) => ({
      ...item,
      withoutProposalRate: rate(item.requestsWithoutProposal, item.requestsCreated),
    }))
    .sort((a, b) => b.requestsCreated - a.requestsCreated)
    .slice(0, 8);

  const usersByZone = buildUsersByZone(allUsers);

  const metrics: DashboardMetric[] = [
    buildMetric({
      id: 'professional_profiles_completed',
      label: 'Profissionais com perfil concluido',
      technicalName: 'professional_profile_completed',
      value: currentProfessionalProfiles,
      status: currentProfessionalProfiles > 0 ? 'ok' : 'info',
      source: ['ga4'],
      scope: 'executivo',
      definition: 'Quantidade de perfis profissionais concluidos no periodo.',
      businessGoal: 'Medir maturidade da oferta habilitada.',
      decision: 'Ajuda a decidir intensidade do onboarding profissional.',
      expectedAction: 'Atuar no onboarding quando a base pronta cai.',
      comparison: toMetricComparison(currentProfessionalProfiles, previousProfessionalProfiles),
    }),
    buildMetric({
      id: 'demand_offer_ratio',
      label: 'Proporcao entre demanda criada e oferta enviada',
      value: demandOfferRatio,
      status: demandOfferRatio === null ? 'info' : demandOfferRatio > 1.4 ? 'warning' : 'ok',
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Razao entre solicitacoes criadas e propostas enviadas no periodo.',
      businessGoal: 'Medir equilibrio entre demanda real e resposta de oferta.',
      decision: 'Ajuda a decidir onde a oferta esta insuficiente para a demanda.',
      expectedAction: 'Reforcar captacao ou redistribuicao operacional nas regioes mais pressionadas.',
      note: 'Valores acima de 1 indicam mais demanda criada do que oferta enviada.',
      comparison: toMetricComparison(demandOfferRatio, previousDemandOfferRatio),
    }),
    buildMetric({
      id: 'proposal_coverage',
      label: 'Cobertura de propostas por solicitacao',
      value: currentCoverage,
      unit: '%',
      status: classifyMetricStatus(currentCoverage, { warning: 70, critical: 50 }, true),
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Percentual de solicitacoes criadas que receberam proposta.',
      businessGoal: 'Medir liquidez operacional do marketplace.',
      decision: 'Ajuda a decidir onde falta oferta ou velocidade.',
      expectedAction: 'Intervir em matching, escala local e cobertura por especialidade.',
      comparison: toMetricComparison(currentCoverage, previousCoverage),
    }),
    buildMetric({
      id: 'requests_without_proposal_rate',
      label: 'Taxa de solicitacoes sem proposta',
      value: requestsWithoutProposalRate,
      unit: '%',
      status: classifyMetricStatus(requestsWithoutProposalRate, { warning: 30, critical: 45 }),
      source: ['firebase'],
      scope: 'operacional',
      definition: 'Percentual de jobs criados no periodo que ainda nao tem proposta.',
      businessGoal: 'Medir o backlog operacional sem cobertura.',
      decision: 'Ajuda a decidir prioridade da operacao de matching.',
      expectedAction: 'Atacar filas e regioes sem proposta rapidamente.',
      comparison: toMetricComparison(requestsWithoutProposalRate, previousRequestsWithoutProposalRate),
    }),
    buildMetric({
      id: 'proposal_acceptance_rate_liquidity',
      label: 'Taxa de propostas aceitas',
      value: currentAcceptanceRate,
      unit: '%',
      status: classifyMetricStatus(currentAcceptanceRate, { warning: 40, critical: 25 }, true),
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Percentual de propostas enviadas que viraram aceite.',
      businessGoal: 'Medir aderencia da oferta enviada ao que o cliente espera.',
      decision: 'Ajuda a decidir ajustes de proposta e precificacao.',
      expectedAction: 'Revisar qualidade e tempo de resposta das propostas.',
      comparison: toMetricComparison(currentAcceptanceRate, previousAcceptanceRate),
    }),
    buildMetric({
      id: 'match_rate_operational',
      label: 'Evolucao de match entre familia e profissional',
      value: currentMatchRate,
      unit: '%',
      status: classifyMetricStatus(currentMatchRate, { warning: 65, critical: 50 }, true),
      source: ['firebase'],
      scope: 'diagnostico',
      definition: 'Percentual de jobs do periodo que possuem profissional associado.',
      businessGoal: 'Medir liquidez operacional observada na base transacional.',
      decision: 'Ajuda a decidir se o matching observado acompanha a demanda.',
      expectedAction: 'Ajustar cobertura local e filtros de elegibilidade quando cair.',
      comparison: toMetricComparison(currentMatchRate, previousMatchRate),
      note: 'Indicador operacional derivado de jobs, complementar ao funil GA4.',
    }),
  ];

  return { metrics, regions, usersByZone };
}

function buildUsersByZone(users: FirestoreRecord[]): ZoneUserDistributionSummary {
  const zoneMap = new Map<DashboardZoneKey, { professionals: number; families: number }>(
    ZONE_ORDER.map((zone) => [zone, { professionals: 0, families: 0 }])
  );

  let totalProfessionals = 0;
  let totalFamilies = 0;
  let classifiedProfessionals = 0;
  let classifiedFamilies = 0;
  let unclassifiedProfessionals = 0;
  let unclassifiedFamilies = 0;

  for (const user of users) {
    const profile = normalizeUserProfile(user.perfil || user.role || user.userRole);
    if (!profile) {
      continue;
    }

    const zone = inferSaoPauloZone(user);

    if (profile === 'profissional') {
      totalProfessionals += 1;
    } else {
      totalFamilies += 1;
    }

    if (!zone) {
      if (profile === 'profissional') {
        unclassifiedProfessionals += 1;
      } else {
        unclassifiedFamilies += 1;
      }
      continue;
    }

    const zoneCounts = zoneMap.get(zone)!;
    if (profile === 'profissional') {
      zoneCounts.professionals += 1;
      classifiedProfessionals += 1;
    } else {
      zoneCounts.families += 1;
      classifiedFamilies += 1;
    }
  }

  return {
    zones: ZONE_ORDER.map((zone) => {
      const counts = zoneMap.get(zone)!;
      return {
        zone,
        label: getSaoPauloZoneLabel(zone),
        professionals: counts.professionals,
        families: counts.families,
        totalUsers: counts.professionals + counts.families,
      };
    }),
    totalProfessionals,
    totalFamilies,
    classifiedProfessionals,
    classifiedFamilies,
    unclassifiedProfessionals,
    unclassifiedFamilies,
  };
}

function buildTrust(
  currentRatings: FirestoreRecord[],
  previousRatings: FirestoreRecord[],
  currentGa4Counts: Map<string, number>,
  previousGa4Counts: Map<string, number>
): DashboardMetric[] {
  const currentRatingsCount = currentRatings.filter((item) => typeof item.rating === 'number').length;
  const previousRatingsCount = previousRatings.filter((item) => typeof item.rating === 'number').length;
  const currentRefunds = currentGa4Counts.get('refund_processed') || 0;
  const previousRefunds = previousGa4Counts.get('refund_processed') || 0;
  const currentCancellations = currentGa4Counts.get('service_canceled') || 0;
  const previousCancellations = previousGa4Counts.get('service_canceled') || 0;
  const currentValidations = currentGa4Counts.get('required_field_validation_shown') || 0;
  const previousValidations = previousGa4Counts.get('required_field_validation_shown') || 0;
  const currentWhatsApp = currentGa4Counts.get('whatsapp_contact_started') || 0;
  const previousWhatsApp = previousGa4Counts.get('whatsapp_contact_started') || 0;
  const currentProfileCompleted =
    (currentGa4Counts.get('professional_profile_completed') || 0) +
    (currentGa4Counts.get('family_profile_completed') || 0);
  const previousProfileCompleted =
    (previousGa4Counts.get('professional_profile_completed') || 0) +
    (previousGa4Counts.get('family_profile_completed') || 0);
  const currentSignUps = currentGa4Counts.get('sign_up') || 0;
  const previousSignUps = previousGa4Counts.get('sign_up') || 0;

  return [
    buildMetric({
      id: 'ratings_submitted',
      label: 'Avaliacoes enviadas',
      technicalName: 'rating_submitted',
      value: currentRatingsCount,
      status: currentRatingsCount > 0 ? 'ok' : 'info',
      source: ['firebase'],
      scope: 'operacional',
      definition: 'Quantidade de avaliacoes persistidas na colecao ratings no periodo.',
      businessGoal: 'Medir fechamento de experiencia e captura de feedback.',
      decision: 'Ajuda a decidir se a coleta de avaliacao esta ativa o suficiente.',
      expectedAction: 'Reforcar solicitacao de avaliacao quando o volume cair.',
      note: 'Usa dado persistido em vez de depender apenas do evento analytics.',
      comparison: toMetricComparison(currentRatingsCount, previousRatingsCount),
    }),
    buildMetric({
      id: 'refunds_processed_trust',
      label: 'Reembolsos processados',
      technicalName: 'refund_processed',
      value: currentRefunds,
      status: currentRefunds > 0 ? 'warning' : 'ok',
      source: ['ga4', 'stripe'],
      scope: 'operacional',
      definition: 'Quantidade de reembolsos efetivamente processados no periodo.',
      businessGoal: 'Monitorar quebra de confianca e custo operacional.',
      decision: 'Ajuda a decidir profundidade de auditoria de qualidade.',
      expectedAction: 'Investigar causas, politicas e profissionais associados.',
      comparison: toMetricComparison(currentRefunds, previousRefunds),
    }),
    buildMetric({
      id: 'services_canceled_trust',
      label: 'Cancelamentos',
      technicalName: 'service_canceled',
      value: currentCancellations,
      status: currentCancellations > 0 ? 'warning' : 'ok',
      source: ['ga4', 'firebase'],
      scope: 'operacional',
      definition: 'Quantidade de servicos cancelados no periodo.',
      businessGoal: 'Medir confianca apos a contratacao.',
      decision: 'Ajuda a decidir onde a operacao quebra apos aceite.',
      expectedAction: 'Segregar causas por lado do cancelamento e timing.',
      comparison: toMetricComparison(currentCancellations, previousCancellations),
    }),
    buildMetric({
      id: 'required_validations',
      label: 'Validacoes criticas de preenchimento',
      technicalName: 'required_field_validation_shown',
      value: currentValidations,
      status: currentValidations > 0 ? 'warning' : 'ok',
      source: ['ga4'],
      scope: 'diagnostico',
      definition: 'Quantidade de exibicoes de validacao de campo obrigatorio.',
      businessGoal: 'Medir atrito evitavel no onboarding e em formularios criticos.',
      decision: 'Ajuda a decidir onde simplificar ou orientar melhor o preenchimento.',
      expectedAction: 'Revisar formularios com maior incidencia de validacao.',
      comparison: toMetricComparison(currentValidations, previousValidations),
    }),
    buildMetric({
      id: 'whatsapp_contacts_started',
      label: 'Contatos iniciados via WhatsApp',
      technicalName: 'whatsapp_contact_started',
      value: currentWhatsApp,
      status: currentWhatsApp > 0 ? 'ok' : 'info',
      source: ['ga4'],
      scope: 'diagnostico',
      definition: 'Quantidade de contatos via CTA de WhatsApp iniciados no periodo.',
      businessGoal: 'Medir busca por suporte ou destravamento fora da interface principal.',
      decision: 'Ajuda a decidir onde ha necessidade de assistencia humana.',
      expectedAction: 'Cruzar com atrito de funil e formularios quando crescer demais.',
      comparison: toMetricComparison(currentWhatsApp, previousWhatsApp),
    }),
    buildMetric({
      id: 'profile_completion_rate_trust',
      label: 'Evolucao do preenchimento de perfil',
      value: rate(currentProfileCompleted, currentSignUps),
      unit: '%',
      status: classifyMetricStatus(rate(currentProfileCompleted, currentSignUps), { warning: 55, critical: 40 }, true),
      source: ['ga4'],
      scope: 'operacional',
      definition: 'Percentual de cadastros que concluem perfil no mesmo periodo.',
      businessGoal: 'Medir clareza e confianca no onboarding.',
      decision: 'Ajuda a decidir se o onboarding esta ajudando ou travando a jornada.',
      expectedAction: 'Ajustar passos, copy e UX do onboarding quando cair.',
      comparison: toMetricComparison(rate(currentProfileCompleted, currentSignUps), rate(previousProfileCompleted, previousSignUps)),
    }),
  ];
}

function buildAlerts(
  operationalMetrics: DashboardMetric[],
  liquidityMetrics: DashboardMetric[],
  trustMetrics: DashboardMetric[]
): AlertItem[] {
  const lookup = new Map<string, DashboardMetric>();
  for (const metric of [...operationalMetrics, ...liquidityMetrics, ...trustMetrics]) {
    lookup.set(metric.id, metric);
  }

  const alerts: AlertItem[] = [];

  const refundRate = lookup.get('refund_rate');
  if (refundRate && refundRate.status === 'critical') {
    alerts.push({
      id: 'refund_rate_high',
      severity: 'critical',
      title: 'Alta de reembolso exige auditoria imediata',
      description: 'A taxa de reembolso ultrapassou o limite de risco definido para o painel.',
      source: refundRate.source,
      expectedAction: 'Auditar causas, regioes, profissionais e politica aplicada nos ultimos casos.',
      metricId: refundRate.id,
    });
  }

  const acceptanceRate = lookup.get('proposal_acceptance_rate');
  if (acceptanceRate && acceptanceRate.status !== 'ok') {
    alerts.push({
      id: 'proposal_acceptance_drop',
      severity: acceptanceRate.status === 'critical' ? 'critical' : 'warning',
      title: 'Queda de aceite de proposta no meio do funil',
      description: 'A conversao entre proposta enviada e proposta aceita esta abaixo do nivel saudavel.',
      source: acceptanceRate.source,
      expectedAction: 'Revisar precificacao, clareza da proposta e tempo de resposta comercial.',
      metricId: acceptanceRate.id,
    });
  }

  const requestsWithoutProposal = lookup.get('requests_without_proposal_rate');
  if (requestsWithoutProposal && requestsWithoutProposal.status !== 'ok') {
    alerts.push({
      id: 'requests_without_proposal_high',
      severity: requestsWithoutProposal.status === 'critical' ? 'critical' : 'warning',
      title: 'Solicitacoes sem proposta acima do aceitavel',
      description: 'A cobertura de propostas nao esta acompanhando a demanda criada.',
      source: requestsWithoutProposal.source,
      expectedAction: 'Acionar matching manual e reforcar oferta nas regioes com fila crescente.',
      metricId: requestsWithoutProposal.id,
    });
  }

  const cancellationRate = lookup.get('cancellation_rate');
  if (cancellationRate && cancellationRate.status !== 'ok') {
    alerts.push({
      id: 'cancellation_rate_high',
      severity: cancellationRate.status === 'critical' ? 'critical' : 'warning',
      title: 'Cancelamento elevado apos aceite',
      description: 'Os cancelamentos estao acima do patamar esperado para a confianca operacional.',
      source: cancellationRate.source,
      expectedAction: 'Segregar cancelamentos por profissional, familia, antecedencia e motivo.',
      metricId: cancellationRate.id,
    });
  }

  const paymentRate = lookup.get('avg_accept_to_payment_hours');
  if (paymentRate && paymentRate.status !== 'ok') {
    alerts.push({
      id: 'payment_slowdown',
      severity: paymentRate.status === 'critical' ? 'critical' : 'warning',
      title: 'Pagamento confirmado demorando apos aceite',
      description: 'A etapa entre aceite e pagamento esta mais lenta do que o esperado.',
      source: paymentRate.source,
      expectedAction: 'Revisar checkout, comunicacao de cobranca e conciliacao com Stripe.',
      metricId: paymentRate.id,
    });
  }

  const validations = lookup.get('required_validations');
  if (validations && validations.status === 'warning') {
    alerts.push({
      id: 'form_validation_pressure',
      severity: 'warning',
      title: 'Validacoes obrigatorias em alta',
      description: 'O volume de validacoes sugere friccao de preenchimento nos fluxos criticos.',
      source: validations.source,
      expectedAction: 'Priorizar revisao de formularios e mensagens de erro.',
      metricId: validations.id,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'no_priority_alerts',
      severity: 'info',
      title: 'Sem alertas prioritarios na janela atual',
      description: 'Nenhum indicador critico ultrapassou o limite definido para este painel.',
      source: ['ga4', 'firebase', 'stripe'],
      expectedAction: 'Manter acompanhamento de rotina e observar mudancas nas proximas janelas.',
    });
  }

  return alerts;
}

export async function calculateKpiDashboardMetrics(windowDays: TimeWindow = 30): Promise<KpiDashboardResponse> {
  const ranges = createWindowRanges(windowDays);

  const [ga4Current, ga4Previous, firestoreData, stripeData] = await Promise.all([
    loadGa4CountsForWindow(ranges.current),
    loadGa4CountsForWindow(ranges.previous),
    loadFirestoreData(ranges),
    loadStripeData(ranges),
  ]);

  const currentUsers = partitionRecords(firestoreData.users, ranges.current, (item) => item.createdAt);
  const previousUsers = partitionRecords(firestoreData.users, ranges.previous, (item) => item.createdAt);
  const currentJobs = partitionRecords(firestoreData.jobs, ranges.current, (item) => item.createdAt);
  const previousJobs = partitionRecords(firestoreData.jobs, ranges.previous, (item) => item.createdAt);
  const currentRatings = partitionRecords(firestoreData.ratings, ranges.current, (item) => item.createdAt);
  const previousRatings = partitionRecords(firestoreData.ratings, ranges.previous, (item) => item.createdAt);

  const currentCharges = stripeData.charges.filter((charge) => isInWindow(typeof charge.created === 'number' ? charge.created * 1000 : charge.created, ranges.current));
  const previousCharges = stripeData.charges.filter((charge) => isInWindow(typeof charge.created === 'number' ? charge.created * 1000 : charge.created, ranges.previous));
  const allChargesLookup = buildChargesLookup([...currentCharges, ...previousCharges]);

  const executiveMetrics = buildExecutiveMetrics(currentUsers, previousUsers, ga4Current.counts, ga4Previous.counts);
  const funnelSteps = buildFunnel(ga4Current.counts);
  const operational = buildOperationalHealth(currentJobs, previousJobs, ga4Current.counts, ga4Previous.counts, allChargesLookup);
  const liquidity = buildLiquidity(currentJobs, previousJobs, ga4Current.counts, ga4Previous.counts, firestoreData.users);
  const trust = buildTrust(currentRatings, previousRatings, ga4Current.counts, ga4Previous.counts);
  const alerts = buildAlerts(operational.metrics, liquidity.metrics, trust);

  const limitations = [
    'Eventos de funil e taxonomia oficial dependem de GA4 configurado no ambiente do painel.',
    'Tempos operacionais sao derivados de timestamps transacionais de jobs e conciliacao Stripe.',
    'Cobertura regional usa jobs observados no periodo; nao representa capacidade em tempo real.',
    'Avaliacoes enviadas usam a colecao ratings por refletirem persistencia de feedback.',
    'Distribuicao por zona considera apenas usuarios com zona explicita ou bairro mapeado com confianca em Sao Paulo.',
  ];

  if (stripeData.limitation) {
    limitations.push(stripeData.limitation);
  }

  if (ga4Current.freshness.status !== 'fresh') {
    limitations.push('Quando GA4 estiver indisponivel, blocos de funil e eventos ficam sem base confiavel.');
  }

  return {
    timestamp: new Date().toISOString(),
    window: windowDays,
    cached: false,
    freshness: {
      ga4: ga4Current.freshness,
      firebase: firestoreData.freshness,
      stripe: stripeData.freshness,
    },
    executive: {
      metrics: executiveMetrics,
    },
    funnel: {
      steps: funnelSteps,
      summary:
        'Funil oficial exibido a partir de solicitacao iniciada. As etapas seguintes usam a taxonomia canonica do produto e devem ser lidas com a quebra historica de nomenclatura em mente.',
    },
    operationalHealth: operational,
    liquidity,
    trust: {
      metrics: trust,
    },
    alerts: {
      items: alerts,
    },
    taxonomy: {
      friendlyLabels: OFFICIAL_ANALYTICS_EVENTS,
      legacyRenames: LEGACY_ANALYTICS_RENAMES,
    },
    dataQuality: {
      historyNote:
        'Historicos anteriores a consolidacao da taxonomia precisam considerar a troca de nomes legados para a camada canonica atual.',
      limitations,
    },
  };
}
