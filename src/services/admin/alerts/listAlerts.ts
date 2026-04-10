/**
 * Alertas baseados em dados reais (Firebase + Stripe)
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore, getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { normalizeJobStatus, isJobCancelled, hasJobProfessional } from '../statusNormalizer';
import { hoursSince, toDate } from '@/lib/admin/dateHelpers';
import type {
  AlertSeverity,
  AlertType,
  AlertsFreshness,
  AlertsFilters,
  AlertsResponse,
  ListAlertsParams,
  OperationalAlert,
} from './types';

function clampItems<T>(items: T[], limit: number = 8): T[] {
  return items.slice(0, limit);
}

const severityRank: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function nowIso(): string {
  return new Date().toISOString();
}

function freshnessFromLatest(
  source: AlertsFreshness['source'],
  latestDate: Date | null,
  reason?: string,
): AlertsFreshness {
  if (!latestDate) {
    return {
      source,
      status: 'stale',
      reason: reason || 'Sem registros recentes',
      lastSuccessAt: nowIso(),
    };
  }

  const delayMinutes = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60));
  const status = delayMinutes <= 120 ? 'fresh' : 'stale';

  return {
    source,
    status,
    delayMinutes,
    lastSuccessAt: latestDate.toISOString(),
    reason,
  };
}

function computeRecency(alert: OperationalAlert): Date {
  const dates = alert.affectedItems
    .map((item) => (item.occurredAt ? toDate(item.occurredAt) : null))
    .filter((value): value is Date => !!value);

  if (dates.length === 0) {
    return new Date(alert.lastDetectedAt);
  }

  dates.sort((a, b) => b.getTime() - a.getTime());
  return dates[0];
}

function sortBySeverityAndRecency(items: OperationalAlert[]): OperationalAlert[] {
  return [...items].sort((a, b) => {
    const severityDiff = severityRank[a.severity] - severityRank[b.severity];
    if (severityDiff !== 0) return severityDiff;

    const recencyDiff = computeRecency(b).getTime() - computeRecency(a).getTime();
    if (recencyDiff !== 0) return recencyDiff;

    return b.count - a.count;
  });
}

function buildSummary(items: OperationalAlert[]): AlertsResponse['summary'] {
  const bySeverity: AlertsResponse['summary']['bySeverity'] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const byType: AlertsResponse['summary']['byType'] = {
    liquidity: 0,
    quality: 0,
    support: 0,
    financial: 0,
    data: 0,
    other: 0,
  };

  items.forEach((alert) => {
    bySeverity[alert.severity] += 1;
    byType[alert.type] += 1;
  });

  return {
    total: items.length,
    open: items.filter((alert) => alert.status === 'open').length,
    bySeverity,
    byType,
  };
}

function applyFilters(items: OperationalAlert[], filters: AlertsFilters): OperationalAlert[] {
  let filtered = [...items];

  if (filters.severityFilter !== 'all') {
    filtered = filtered.filter((item) => item.severity === filters.severityFilter);
  }

  if (filters.typeFilter !== 'all') {
    filtered = filtered.filter((item) => item.type === filters.typeFilter);
  }

  if (filters.statusFilter !== 'all') {
    filtered = filtered.filter((item) => item.status === filters.statusFilter);
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter((item) => {
      const inHeader = [item.title, item.description, item.actionHint]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));

      if (inHeader) return true;

      return item.affectedItems.some((affected) =>
        [affected.label, affected.context, affected.region]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term))
      );
    });
  }

  return sortBySeverityAndRecency(filtered);
}

function pushAlert(
  list: OperationalAlert[],
  params: {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    source: OperationalAlert['source'];
    description?: string;
    count: number;
    affectedItems: OperationalAlert['affectedItems'];
    actionHint?: string;
  },
) {
  const updatedAt = nowIso();
  const datedItems = params.affectedItems
    .map((item) => (item.occurredAt ? toDate(item.occurredAt) : null))
    .filter((value): value is Date => !!value)
    .sort((a, b) => a.getTime() - b.getTime());

  const firstDetectedAt = datedItems.length > 0 ? datedItems[0].toISOString() : updatedAt;
  const lastDetectedAt = datedItems.length > 0 ? datedItems[datedItems.length - 1].toISOString() : updatedAt;

  list.push({
    id: params.id,
    type: params.type,
    status: 'open',
    title: params.title,
    severity: params.severity,
    source: params.source,
    description: params.description,
    count: params.count,
    affectedItems: params.affectedItems,
    firstDetectedAt,
    lastDetectedAt,
    updatedAt,
    actionHint: params.actionHint,
  });
}

export async function listAlerts(params?: ListAlertsParams): Promise<AlertsResponse> {
  getFirebaseAdmin();
  const db = getFirestore();

  const windowDays = params?.windowDays && params.windowDays > 0 ? params.windowDays : 30;

  const filtersApplied: AlertsFilters = {
    severityFilter: params?.severityFilter || 'all',
    typeFilter: params?.typeFilter || 'all',
    statusFilter: params?.statusFilter || 'all',
    searchTerm: params?.searchTerm?.trim() || undefined,
  };

  const alerts: OperationalAlert[] = [];
  const windowStart = Timestamp.fromDate(
    new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  );

  const freshness: AlertsResponse['freshness'] = {
    jobs: { source: 'jobs', status: 'unavailable', reason: 'Nao processado' },
    tickets: { source: 'tickets', status: 'unavailable', reason: 'Nao processado' },
    stripe: { source: 'stripe', status: 'unavailable', reason: 'Nao processado' },
  };

  let jobs: Array<Record<string, any>> = [];
  try {
    const jobsSnap = await db
      .collection('jobs')
      .where('createdAt', '>=', windowStart)
      .get();

    jobs = jobsSnap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;

    const latestJobDate = jobs
      .map((job) => toDate(job.updatedAt || job.createdAt || null))
      .filter((value): value is Date => !!value)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    freshness.jobs = freshnessFromLatest('jobs', latestJobDate);
  } catch (error) {
    console.error('[Alerts] Erro ao buscar jobs:', error);
    freshness.jobs = {
      source: 'jobs',
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'Falha ao carregar jobs',
    };
  }

  const jobsSemMatch = jobs.filter((job) => {
    const status = normalizeJobStatus(job.status || 'pending');
    const semProfissional = !hasJobProfessional(job);
    const horas = hoursSince(job.createdAt);
    return status === 'pending' && semProfissional && horas >= 48;
  });

  if (jobsSemMatch.length > 0) {
    pushAlert(alerts, {
      id: 'jobs-sem-match',
      type: 'liquidity',
      title: 'Jobs sem match > 48h',
      severity: jobsSemMatch.length >= 10 ? 'critical' : 'high',
      source: 'jobs',
      description: 'Jobs pendentes sem profissional atribuido',
      count: jobsSemMatch.length,
      affectedItems: clampItems(jobsSemMatch.map((job) => {
        const location = job.location || {};
        const cidade = location.cidade || 'Nao informado';
        const estado = location.estado || 'N/A';
        return {
          id: job.id,
          label: `Job ${job.id}`,
          region: `${cidade}/${estado}`,
          occurredAt: toDate(job.createdAt)?.toISOString(),
          context: `Aguardando profissional ha ${Math.floor(hoursSince(job.createdAt))}h`,
          metadata: {
            horas: Math.floor(hoursSince(job.createdAt)),
          },
        };
      })),
      actionHint: 'Priorizar matching manual para fila critica.',
    });
  }

  const matchSemPagamento = jobs.filter((job) => {
    const status = normalizeJobStatus(job.status || 'pending');
    return (status === 'matched' || status === 'active') && hasJobProfessional(job) && !job.paymentId;
  });

  if (matchSemPagamento.length > 0) {
    pushAlert(alerts, {
      id: 'match-sem-pagamento',
      type: 'financial',
      title: 'Match sem pagamento',
      severity: 'medium',
      source: 'jobs',
      description: 'Jobs com profissional atribuido e sem paymentId',
      count: matchSemPagamento.length,
      affectedItems: clampItems(matchSemPagamento.map((job) => {
        const location = job.location || {};
        const cidade = location.cidade || 'Nao informado';
        const estado = location.estado || 'N/A';
        return {
          id: job.id,
          label: `Job ${job.id}`,
          region: `${cidade}/${estado}`,
          occurredAt: toDate(job.createdAt)?.toISOString(),
          context: 'Profissional atribuido sem pagamento associado',
        };
      })),
      actionHint: 'Verificar reconciliacao de pagamento para jobs com match.',
    });
  }

  const cancelamentoStats = new Map<string, { total: number; cancelled: number }>();
  jobs.forEach((job) => {
    const profissionalId = job.professionalId || job.specialistId || job.profissionalId;
    if (!profissionalId) return;
    if (!cancelamentoStats.has(profissionalId)) {
      cancelamentoStats.set(profissionalId, { total: 0, cancelled: 0 });
    }
    const stats = cancelamentoStats.get(profissionalId)!;
    stats.total += 1;
    if (isJobCancelled(job)) {
      stats.cancelled += 1;
    }
  });

  const cancelamentosRecorrentes = Array.from(cancelamentoStats.entries())
    .map(([profissionalId, stats]) => ({ profissionalId, ...stats }))
    .filter((s) => s.total >= 4 && (s.cancelled / s.total) * 100 > 25);

  if (cancelamentosRecorrentes.length > 0) {
    pushAlert(alerts, {
      id: 'cancelamentos-recorrentes',
      type: 'quality',
      title: 'Cancelamentos recorrentes',
      severity: 'medium',
      source: 'jobs',
      description: 'Profissionais com taxa de cancelamento > 25% (min 4 jobs)',
      count: cancelamentosRecorrentes.length,
      affectedItems: clampItems(cancelamentosRecorrentes.map((item) => ({
        id: item.profissionalId,
        label: `Profissional ${item.profissionalId}`,
        context: `Cancelamentos: ${item.cancelled}/${item.total}`,
      }))),
      actionHint: 'Revisar profissionais com tendencia alta de cancelamento.',
    });
  }

  let tickets: Array<Record<string, any>> = [];
  try {
    const ticketsSnap = await db
      .collection('tickets')
      .where('createdAt', '>=', windowStart)
      .get();

    tickets = ticketsSnap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;

    const latestTicketDate = tickets
      .map((ticket) => toDate(ticket.updatedAt || ticket.createdAt || null))
      .filter((value): value is Date => !!value)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    freshness.tickets = freshnessFromLatest('tickets', latestTicketDate);

    const ticketsCriticos = tickets.filter((t) => {
      const tipo = (t.tipo || '').toString().toUpperCase();
      const status = (t.status || '').toString().toUpperCase();
      return tipo === 'RECLAMAÇÃO' && status !== 'CONCLUIDO' && status !== 'CLOSED';
    });

    if (ticketsCriticos.length > 0) {
      pushAlert(alerts, {
        id: 'tickets-criticos',
        type: 'support',
        title: 'Tickets criticos em aberto',
        severity: 'critical',
        source: 'tickets',
        description: 'Reclamacoes pendentes',
        count: ticketsCriticos.length,
        affectedItems: clampItems(ticketsCriticos.map((t) => ({
          id: t.id,
          label: t.titulo || 'Ticket',
          context: t.usuarioNome || t.usuarioId || 'Usuario',
          occurredAt: toDate(t.createdAt)?.toISOString(),
        }))),
        actionHint: 'Priorizar tratativa no Service Desk.',
      });
    }
  } catch (error) {
    console.error('[Alerts] Erro ao buscar tickets:', error);
    freshness.tickets = {
      source: 'tickets',
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'Falha ao carregar tickets',
    };
  }

  try {
    const stripe = getStripeClient();
    const startUnix = Math.floor(
      (Date.now() - windowDays * 24 * 60 * 60 * 1000) / 1000
    );

    const charges = await stripe.charges.list({
      created: { gte: startUnix },
      limit: 100,
    });

    const latestChargeDate = charges.data
      .map((charge) => new Date(charge.created * 1000))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    freshness.stripe = freshnessFromLatest('stripe', latestChargeDate);

    const pendentes = charges.data.filter((c) => c.status === 'pending' && hoursSince(new Date(c.created * 1000)) >= 72);
    const falhos = charges.data.filter((c) => c.status === 'failed');

    if (pendentes.length > 0) {
      pushAlert(alerts, {
        id: 'pagamentos-pendentes',
        type: 'financial',
        title: 'Pagamentos pendentes > 72h',
        severity: 'high',
        source: 'stripe',
        description: 'Pagamentos pendentes por mais de 72 horas',
        count: pendentes.length,
        affectedItems: clampItems(pendentes.map((c) => ({
          id: c.id,
          label: `Charge ${c.id}`,
          context: `Valor: R$ ${(c.amount || 0) / 100}`,
          occurredAt: new Date(c.created * 1000).toISOString(),
        }))),
        actionHint: 'Escalar reconciliacao financeira para pendencias antigas.',
      });
    }

    if (falhos.length > 0) {
      pushAlert(alerts, {
        id: 'pagamentos-falhos',
        type: 'financial',
        title: 'Pagamentos falhos',
        severity: 'medium',
        source: 'stripe',
        description: 'Charges com status failed',
        count: falhos.length,
        affectedItems: clampItems(falhos.map((c) => ({
          id: c.id,
          label: `Charge ${c.id}`,
          context: `Valor: R$ ${(c.amount || 0) / 100}`,
          occurredAt: new Date(c.created * 1000).toISOString(),
        }))),
        actionHint: 'Revisar motivo de falha e acionar reprocessamento.',
      });
    }
  } catch (error) {
    console.error('[Alerts] Erro ao buscar Stripe charges:', error);
    freshness.stripe = {
      source: 'stripe',
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'Falha ao carregar charges',
    };
  }

  const sortedAlerts = sortBySeverityAndRecency(alerts);
  const filteredAlerts = applyFilters(sortedAlerts, filtersApplied);

  return {
    windowDays,
    timestamp: nowIso(),
    freshness,
    filtersApplied,
    summary: buildSummary(filteredAlerts),
    items: filteredAlerts,
  };
}
