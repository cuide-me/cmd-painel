/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD V3 METRICS - NUCLEO MINIMO OPERACIONAL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este serviço retorna somente o contrato mínimo da nova home operacional:
 * - cards operacionais reais
 * - fila crítica
 * - alertas ativos
 * - ranking local
 * - freshness por fonte
 * - sinalização de base insuficiente/indisponibilidade
 *
 * Regras deste núcleo:
 * - sem health score
 * - sem métricas decorativas
 * - sem placeholders/TODO/hardcoded
 * - sem transformar indisponibilidade em zero falso
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { getRegionKey } from './region';
import { buildAgingExtremeMetrics } from './agingExtremeMetrics';
import type {
  DashboardV3Response,
  TimeWindow,
  SourceFreshness,
  OperationalCard,
  CriticalQueueItem,
  ActiveAlert,
  LocalRankingItem,
  SampleMeta,
} from './dashboardV3Types';

interface LoadedFirebaseData {
  jobs: Array<Record<string, any>>;
  tickets: Array<Record<string, any>>;
  loadedAt: string;
}

interface LoadedStripeData {
  charges: Array<Record<string, any>>;
  loadedAt: string;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function hoursSince(value: any): number {
  const date = toDate(value);
  if (!date) return 0;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function normalizeJobStatus(status: any): 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'unknown' {
  if (!status) return 'unknown';

  const s = String(status).toLowerCase().trim();

  if (['pending', 'pendente', 'open', 'aberto', 'novo', 'new'].includes(s)) return 'pending';
  if (['matched', 'accepted', 'proposta_aceita', 'active', 'in_progress', 'em_andamento'].includes(s)) return 'in_progress';
  if (['completed', 'concluido', 'concluído', 'finalizado', 'done'].includes(s)) return 'completed';
  if (['cancelled', 'cancelado', 'canceled'].includes(s)) return 'cancelled';

  return 'unknown';
}

function hasProfessional(job: Record<string, any>): boolean {
  return Boolean(job.professionalId || job.specialistId || job.profissionalId);
}

function normalizeSpecialty(job: Record<string, any>): string | undefined {
  const raw = job.specialty || job.especialidade || job.tipo;
  if (!raw || typeof raw !== 'string') return undefined;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isEligibleForLiquidity(job: Record<string, any>): boolean {
  const status = normalizeJobStatus(job.status);
  return status !== 'cancelled';
}

function buildSample(sampleSize: number, minimumRequired: number, note?: string): SampleMeta {
  return {
    sampleSize,
    minimumRequired,
    isSufficient: sampleSize >= minimumRequired,
    note,
  };
}

function buildFreshness(
  source: SourceFreshness['source'],
  status: SourceFreshness['status'],
  reason?: string,
  loadedAt?: string
): SourceFreshness {
  if (status === 'fresh') {
    return {
      source,
      status,
      lastSuccessAt: loadedAt || new Date().toISOString(),
      delayMinutes: 0,
      reason: null,
    };
  }

  return {
    source,
    status,
    lastSuccessAt: null,
    delayMinutes: null,
    reason: reason || 'Fonte indisponivel',
  };
}

async function loadFirebaseData(windowDays: TimeWindow): Promise<LoadedFirebaseData> {
  const db = getFirestore();
  const periodStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [jobsSnapshot, ticketsSnapshot] = await Promise.all([
    db.collection('jobs')
      .where('createdAt', '>=', Timestamp.fromDate(periodStart))
      .get(),
    db.collection('tickets')
      .where('createdAt', '>=', Timestamp.fromDate(periodStart))
      .get()
      .catch(() => ({ docs: [] as QueryDocumentSnapshot[] })),
  ]);

  return {
    jobs: jobsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
    tickets: ticketsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })),
    loadedAt: new Date().toISOString(),
  };
}

async function loadStripeData(windowDays: TimeWindow): Promise<LoadedStripeData> {
  const stripe = getStripeClient();
  const unixStart = Math.floor((Date.now() - windowDays * 24 * 60 * 60 * 1000) / 1000);

  const charges = await stripe.charges.list({
    created: { gte: unixStart },
    limit: 100,
  });

  return {
    charges: charges.data as unknown as Array<Record<string, any>>,
    loadedAt: new Date().toISOString(),
  };
}

function buildCards(
  jobs: Array<Record<string, any>>,
  tickets: Array<Record<string, any>>,
  charges: Array<Record<string, any>>,
  stripeAvailable: boolean
): OperationalCard[] {
  const totalJobs = jobs.length;
  const matchedJobs = jobs.filter((job) => hasProfessional(job)).length;
  const criticalJobs48h = jobs.filter((job) => !hasProfessional(job) && normalizeJobStatus(job.status) === 'pending' && hoursSince(job.createdAt) >= 48).length;

  const criticalTickets = tickets.filter((ticket) => {
    const type = String(ticket.tipo || '').toUpperCase();
    const status = String(ticket.status || '').toUpperCase();
    return type === 'RECLAMAÇÃO' && !['CONCLUIDO', 'CLOSED', 'RESOLVED'].includes(status);
  }).length;

  const matchRate = totalJobs > 0 ? (matchedJobs / totalJobs) * 100 : 0;
  const matchSample = buildSample(totalJobs, 20, 'Taxa de match com base mínima de 20 jobs no período');

  const paymentSucceeded = stripeAvailable
    ? charges.filter((charge) => String(charge.status).toLowerCase() === 'succeeded').length
    : null;

  return [
    {
      id: 'jobs_eligible',
      title: 'Jobs Elegíveis',
      value: totalJobs,
      status: totalJobs > 0 ? 'ok' : 'info',
      source: ['firebase'],
      sample: buildSample(totalJobs, 10, 'Leitura de volume mínimo operacional'),
    },
    {
      id: 'match_rate',
      title: 'Taxa de Match',
      value: matchSample.isSufficient ? Number(matchRate.toFixed(1)) : 'Base insuficiente',
      unit: matchSample.isSufficient ? '%' : undefined,
      status: !matchSample.isSufficient ? 'info' : matchRate < 60 ? 'warning' : 'ok',
      source: ['firebase'],
      sample: matchSample,
    },
    {
      id: 'critical_jobs_48h',
      title: 'Jobs Críticos +48h',
      value: criticalJobs48h,
      status: criticalJobs48h > 0 ? (criticalJobs48h >= 10 ? 'critical' : 'warning') : 'ok',
      source: ['firebase'],
      sample: buildSample(totalJobs, 10, 'Indicador calculado sobre jobs elegíveis no período'),
    },
    {
      id: 'critical_tickets_open',
      title: 'Tickets Críticos Abertos',
      value: criticalTickets,
      status: criticalTickets > 0 ? 'critical' : 'ok',
      source: ['firebase'],
      sample: buildSample(tickets.length, 1),
    },
    {
      id: 'payments_confirmed',
      title: 'Pagamentos Confirmados',
      value: paymentSucceeded === null ? 'Indisponível' : paymentSucceeded,
      status: paymentSucceeded === null ? 'info' : paymentSucceeded > 0 ? 'ok' : 'info',
      source: ['stripe'],
      sample: paymentSucceeded === null
        ? buildSample(0, 1, 'Fonte Stripe indisponível')
        : buildSample(charges.length, 5, 'Base mínima de 5 transações no período'),
    },
  ];
}

function buildCriticalQueue(jobs: Array<Record<string, any>>): { queue: CriticalQueueItem[]; sample: SampleMeta } {
  const pending = jobs.filter((job) => !hasProfessional(job) && normalizeJobStatus(job.status) === 'pending');

  const queue = pending
    .map((job) => {
      const waitHours = Math.round(hoursSince(job.createdAt));
      const region = getRegionKey(job);

      return {
        id: String(job.id),
        title: `Job ${String(job.id).slice(0, 8)}`,
        region: {
          region: region.key,
          label: region.label,
          cidade: region.cidade,
          estado: region.estado,
        },
        specialty: job.specialty || job.especialidade,
        shift: job.tipo,
        status: String(job.status || 'pending'),
        priority: waitHours >= 72 ? 'critical' : waitHours >= 48 ? 'high' : 'medium',
        hoursWaiting: waitHours,
        createdAt: toDate(job.createdAt)?.toISOString() || new Date().toISOString(),
      } as CriticalQueueItem;
    })
    .filter((item) => item.hoursWaiting >= 24)
    .sort((a, b) => b.hoursWaiting - a.hoursWaiting)
    .slice(0, 20);

  return {
    queue,
    sample: buildSample(pending.length, 5, 'Fila crítica considera apenas jobs pendentes sem profissional'),
  };
}

function buildActiveAlerts(
  jobs: Array<Record<string, any>>,
  tickets: Array<Record<string, any>>,
  queue: CriticalQueueItem[],
  firebaseFreshness: SourceFreshness,
  stripeFreshness: SourceFreshness
): { alerts: ActiveAlert[]; sample: SampleMeta } {
  const alerts: ActiveAlert[] = [];

  const critical48h = queue.filter((item) => item.hoursWaiting >= 48);
  const critical72h = queue.filter((item) => item.hoursWaiting >= 72);

  const criticalTickets = tickets.filter((ticket) => {
    const type = String(ticket.tipo || '').toUpperCase();
    const status = String(ticket.status || '').toUpperCase();
    return type === 'RECLAMAÇÃO' && !['CONCLUIDO', 'CLOSED', 'RESOLVED'].includes(status);
  });

  if (firebaseFreshness.status !== 'fresh') {
    alerts.push({
      id: 'firebase_unavailable',
      type: 'data',
      severity: 'critical',
      title: 'Fonte Firebase indisponível',
      description: firebaseFreshness.reason || 'Não foi possível carregar dados operacionais',
      count: 1,
      createdAt: new Date().toISOString(),
      source: ['firebase'],
      reactionSlaMinutes: 15,
      sample: buildSample(0, 1, 'Sem dados operacionais disponíveis'),
    });
  }

  if (critical48h.length > 0) {
    alerts.push({
      id: 'jobs_without_match_48h',
      type: 'liquidity',
      severity: critical48h.length >= 10 ? 'critical' : 'high',
      title: `${critical48h.length} jobs sem match há +48h`,
      description: 'Pedidos aguardando profissional além do limite operacional',
      count: critical48h.length,
      createdAt: new Date().toISOString(),
      source: ['firebase'],
      reactionSlaMinutes: 30,
      sample: buildSample(jobs.length, 10),
      affectedItems: critical48h.slice(0, 10).map((item) => ({
        id: item.id,
        label: item.title,
        metadata: {
          region: item.region.label,
          hoursWaiting: item.hoursWaiting,
        },
      })),
      actions: [
        { label: 'Ver jobs pendentes', href: '/admin/jobs?status=pending' },
      ],
    });
  }

  if (critical72h.length > 0) {
    alerts.push({
      id: 'jobs_without_match_72h',
      type: 'liquidity',
      severity: 'critical',
      title: `${critical72h.length} jobs críticos há +72h`,
      description: 'Pedidos sem profissional exigindo intervenção imediata',
      count: critical72h.length,
      createdAt: new Date().toISOString(),
      source: ['firebase'],
      reactionSlaMinutes: 15,
      sample: buildSample(jobs.length, 10),
      affectedItems: critical72h.slice(0, 5).map((item) => ({
        id: item.id,
        label: item.title,
        metadata: {
          region: item.region.label,
          hoursWaiting: item.hoursWaiting,
        },
      })),
    });
  }

  if (criticalTickets.length > 0) {
    alerts.push({
      id: 'critical_tickets_open',
      type: 'support',
      severity: 'high',
      title: `${criticalTickets.length} tickets críticos em aberto`,
      description: 'Reclamações abertas sem resolução',
      count: criticalTickets.length,
      createdAt: new Date().toISOString(),
      source: ['firebase'],
      reactionSlaMinutes: 30,
      sample: buildSample(tickets.length, 1),
      affectedItems: criticalTickets.slice(0, 10).map((ticket) => ({
        id: String(ticket.id),
        label: String(ticket.titulo || 'Ticket'),
        metadata: {
          user: ticket.usuarioNome || ticket.usuarioId || 'N/A',
        },
      })),
      actions: [
        { label: 'Ver service desk', href: '/admin/service-desk' },
      ],
    });
  }

  if (stripeFreshness.status !== 'fresh') {
    alerts.push({
      id: 'stripe_unavailable',
      type: 'financial',
      severity: 'medium',
      title: 'Fonte Stripe indisponível',
      description: stripeFreshness.reason || 'Não foi possível carregar dados financeiros',
      count: 1,
      createdAt: new Date().toISOString(),
      source: ['stripe'],
      reactionSlaMinutes: 60,
      sample: buildSample(0, 1, 'Sem dados financeiros confiáveis no período'),
    });
  }

  if (jobs.length < 10) {
    alerts.push({
      id: 'insufficient_sample_jobs',
      type: 'data',
      severity: 'low',
      title: 'Base insuficiente para leitura robusta',
      description: `A janela atual possui apenas ${jobs.length} jobs elegíveis`,
      count: jobs.length,
      createdAt: new Date().toISOString(),
      source: ['firebase'],
      sample: buildSample(jobs.length, 10),
    });
  }

  return {
    alerts,
    sample: buildSample(jobs.length, 10),
  };
}

function buildLocalRanking(
  jobs: Array<Record<string, any>>,
  firebaseFreshness: SourceFreshness,
  specialtyFilter?: string
): {
  items: LocalRankingItem[];
  sample: SampleMeta;
  freshness: SourceFreshness;
  observation: {
    supplyDefinition: string;
    ratioPolicy: string;
    limitations: string[];
  };
} {
  const normalizedSpecialtyFilter = specialtyFilter?.trim().toLowerCase();

  const regionMap = new Map<string, {
    ref: ReturnType<typeof getRegionKey>;
    eligibleJobs: number;
    localCriticalJobs: number;
    professionalIds: Set<string>;
    specialtyCount: Map<string, number>;
    jobsWithoutSpecialty: number;
  }>();

  for (const job of jobs) {
    if (!isEligibleForLiquidity(job)) continue;

    const specialty = normalizeSpecialty(job);
    if (normalizedSpecialtyFilter) {
      if (!specialty || specialty.toLowerCase() !== normalizedSpecialtyFilter) continue;
    }

    const ref = getRegionKey(job);

    if (!regionMap.has(ref.key)) {
      regionMap.set(ref.key, {
        ref,
        eligibleJobs: 0,
        localCriticalJobs: 0,
        professionalIds: new Set<string>(),
        specialtyCount: new Map<string, number>(),
        jobsWithoutSpecialty: 0,
      });
    }

    const item = regionMap.get(ref.key)!;
    item.eligibleJobs += 1;

    if (specialty) {
      item.specialtyCount.set(specialty, (item.specialtyCount.get(specialty) || 0) + 1);
    } else {
      item.jobsWithoutSpecialty += 1;
    }

    if (hasProfessional(job)) {
      const professionalId = job.professionalId || job.specialistId || job.profissionalId;
      if (professionalId) item.professionalIds.add(String(professionalId));
    }

    const status = normalizeJobStatus(job.status);
    const wait = hoursSince(job.createdAt);
    if (status === 'pending' && !hasProfessional(job) && wait >= 48) {
      item.localCriticalJobs += 1;
    }
  }

  const items: LocalRankingItem[] = Array.from(regionMap.values())
    .map((item) => {
      const observedSupply = item.professionalIds.size;
      const demandSupplyRatio = observedSupply > 0
        ? Number((item.eligibleJobs / observedSupply).toFixed(2))
        : undefined;

      const dominantSpecialty = Array.from(item.specialtyCount.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      const notes: string[] = [];
      if (observedSupply === 0 && item.eligibleJobs > 0) {
        notes.push('Sem oferta observada no periodo/filtro.');
      }
      if (item.jobsWithoutSpecialty > 0) {
        notes.push('Parte dos jobs sem especialidade estruturada.');
      }

      let localCriticality: LocalRankingItem['localCriticality'] = 'stable';
      if (
        item.localCriticalJobs >= 3 ||
        (demandSupplyRatio !== undefined && demandSupplyRatio >= 2) ||
        (observedSupply === 0 && item.eligibleJobs >= 3)
      ) {
        localCriticality = 'critical';
      } else if (
        item.localCriticalJobs >= 1 ||
        (demandSupplyRatio !== undefined && demandSupplyRatio >= 1.2) ||
        (observedSupply === 0 && item.eligibleJobs > 0)
      ) {
        localCriticality = 'attention';
      }

      return {
        region: item.ref.key,
        label: item.ref.label,
        cidade: item.ref.cidade,
        estado: item.ref.estado,
        specialty: dominantSpecialty,
        eligibleJobs: item.eligibleJobs,
        observedSupply,
        demandSupplyRatio,
        localCriticalJobs: item.localCriticalJobs,
        localCriticality,
        notes: notes.length > 0 ? notes : undefined,
        sample: buildSample(item.eligibleJobs, 5, 'Base local minima de 5 jobs elegiveis.'),
      };
    })
    .sort((a, b) => {
      if (a.localCriticality !== b.localCriticality) {
        const rank = { critical: 0, attention: 1, stable: 2 };
        return rank[a.localCriticality] - rank[b.localCriticality];
      }
      if (a.localCriticalJobs !== b.localCriticalJobs) {
        return b.localCriticalJobs - a.localCriticalJobs;
      }
      return b.eligibleJobs - a.eligibleJobs;
    })
    .slice(0, 20);

  const totalEligibleJobs = items.reduce((sum, item) => sum + item.eligibleJobs, 0);

  return {
    items,
    sample: buildSample(totalEligibleJobs, 20, 'Base minima de 20 jobs elegiveis para leitura local robusta.'),
    freshness: {
      ...firebaseFreshness,
      source: 'firebase',
    },
    observation: {
      supplyDefinition: 'Oferta observada = profissionais unicos associados a jobs elegiveis no periodo/filtro.',
      ratioPolicy: 'Razao demanda/oferta exibida somente quando oferta observada > 0.',
      limitations: [
        'Oferta observada nao representa disponibilidade em tempo real.',
        'Especialidade pode estar ausente em parte dos jobs.',
        'Sem modelagem de capacidade por turno neste ciclo.',
      ],
    },
  };
}

export async function calculateDashboardV3Metrics(
  windowDays: TimeWindow = 30,
  regionFilter?: string,
  specialtyFilter?: string
): Promise<DashboardV3Response> {
  let firebaseFreshness = buildFreshness('firebase', 'unavailable', 'Leitura ainda não executada');
  let stripeFreshness = buildFreshness('stripe', 'unavailable', 'Leitura ainda não executada');
  const ga4Freshness = buildFreshness(
    'ga4',
    'unavailable',
    'GA4 fora do escopo da home operacional neste ciclo (evita funil com confiança baixa)'
  );

  let jobs: Array<Record<string, any>> = [];
  let tickets: Array<Record<string, any>> = [];
  let charges: Array<Record<string, any>> = [];

  try {
    const firebaseData = await loadFirebaseData(windowDays);
    firebaseFreshness = buildFreshness('firebase', 'fresh', undefined, firebaseData.loadedAt);
    jobs = firebaseData.jobs;
    tickets = firebaseData.tickets;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Erro ao carregar Firebase';
    firebaseFreshness = buildFreshness('firebase', 'unavailable', reason);
  }

  try {
    const stripeData = await loadStripeData(windowDays);
    stripeFreshness = buildFreshness('stripe', 'fresh', undefined, stripeData.loadedAt);
    charges = stripeData.charges;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Erro ao carregar Stripe';
    stripeFreshness = buildFreshness('stripe', 'unavailable', reason);
  }

  const filteredJobs = regionFilter
    ? jobs.filter((job) => getRegionKey(job).key === regionFilter)
    : jobs;

  const cards = buildCards(
    filteredJobs,
    tickets,
    charges,
    stripeFreshness.status === 'fresh'
  );

  const criticalQueueData = buildCriticalQueue(filteredJobs);
  const activeAlertsData = buildActiveAlerts(
    filteredJobs,
    tickets,
    criticalQueueData.queue,
    firebaseFreshness,
    stripeFreshness
  );
  const localRankingData = buildLocalRanking(filteredJobs, firebaseFreshness, specialtyFilter);
  const agingExtreme = await buildAgingExtremeMetrics(windowDays, jobs);

  return {
    timestamp: new Date().toISOString(),
    window: windowDays,
    regionFilter,
    specialtyFilter,
    cached: false,
    freshness: {
      firebase: firebaseFreshness,
      stripe: stripeFreshness,
      ga4: ga4Freshness,
    },
    cards,
    criticalQueue: {
      total: criticalQueueData.queue.length,
      items: criticalQueueData.queue,
      sample: criticalQueueData.sample,
    },
    activeAlerts: {
      critical: activeAlertsData.alerts.filter((alert) => alert.severity === 'critical').length,
      high: activeAlertsData.alerts.filter((alert) => alert.severity === 'high').length,
      medium: activeAlertsData.alerts.filter((alert) => alert.severity === 'medium').length,
      low: activeAlertsData.alerts.filter((alert) => alert.severity === 'low').length,
      items: activeAlertsData.alerts,
      sample: activeAlertsData.sample,
    },
    localRanking: {
      items: localRankingData.items,
      freshness: localRankingData.freshness,
      observation: localRankingData.observation,
      sample: localRankingData.sample,
    },
    agingExtreme,
  };
}
