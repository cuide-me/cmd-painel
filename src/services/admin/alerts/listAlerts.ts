/**
 * Alertas baseados em dados reais (Firebase + Stripe)
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore, getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { normalizeJobStatus, isJobCancelled, hasJobProfessional } from '../statusNormalizer';
import { hoursSince, toDate } from '@/lib/admin/dateHelpers';
import type { AlertGroup, AlertsResponse } from './types';

function clampItems<T>(items: T[], limit: number = 5): T[] {
  return items.slice(0, limit);
}

export async function listAlerts(windowDays: number = 30): Promise<AlertsResponse> {
  const db = getFirestore();

  const alerts: AlertGroup[] = [];
  const windowStart = Timestamp.fromDate(
    new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  );

  // ===== Jobs =====
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
  } catch (error) {
    console.error('[Alerts] Erro ao buscar jobs:', error);
  }

  // Alert 1: Jobs sem match > 48h
  const jobsSemMatch = jobs.filter((job) => {
    const status = normalizeJobStatus(job.status || 'pending');
    const semProfissional = !hasJobProfessional(job);
    const horas = hoursSince(job.createdAt);
    return status === 'pending' && semProfissional && horas >= 48;
  });

  if (jobsSemMatch.length > 0) {
    alerts.push({
      id: 'jobs-sem-match',
      title: 'Jobs sem match > 48h',
      severity: jobsSemMatch.length > 5 ? 'critical' : 'warning',
      source: 'Firebase:jobs',
      description: 'Jobs pendentes sem profissional atribuido',
      count: jobsSemMatch.length,
      items: clampItems(jobsSemMatch.map((job) => ({
        id: job.id,
        label: `Job ${job.id}`,
        description: `${job.cidade || 'Nao informado'}/${job.estado || 'N/A'}`,
        metadata: {
          horas: Math.floor(hoursSince(job.createdAt)),
        },
      }))),
    });
  }

  // Alert 2: Match sem pagamento (jobs com profissional mas sem paymentId)
  const matchSemPagamento = jobs.filter((job) => {
    const status = normalizeJobStatus(job.status || 'pending');
    return (status === 'matched' || status === 'active') && hasJobProfessional(job) && !job.paymentId;
  });

  if (matchSemPagamento.length > 0) {
    alerts.push({
      id: 'match-sem-pagamento',
      title: 'Match sem pagamento',
      severity: 'warning',
      source: 'Firebase:jobs',
      description: 'Jobs com profissional atribuido e sem paymentId',
      count: matchSemPagamento.length,
      items: clampItems(matchSemPagamento.map((job) => ({
        id: job.id,
        label: `Job ${job.id}`,
        description: `${job.cidade || 'Nao informado'}/${job.estado || 'N/A'}`,
      }))),
    });
  }

  // Alert 3: Profissionais inativos com jobs ativos
  let usersMap = new Map<string, Record<string, any>>();
  try {
    const usersSnap = await db.collection('users').get();
    usersSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
      usersMap.set(doc.id, doc.data() as Record<string, any>);
    });
  } catch (error) {
    console.error('[Alerts] Erro ao buscar users:', error);
  }

  const profissionaisInativos = jobs
    .filter((job) => {
      const status = normalizeJobStatus(job.status || 'pending');
      return (status === 'active' || status === 'matched') && hasJobProfessional(job);
    })
    .map((job) => {
      const profissionalId = job.professionalId || job.specialistId || job.profissionalId;
      const profissional = profissionalId ? usersMap.get(profissionalId) : undefined;
      return { job, profissionalId, profissional };
    })
    .filter(({ profissional }) => profissional && profissional.ativo === false);

  if (profissionaisInativos.length > 0) {
    alerts.push({
      id: 'profissionais-inativos',
      title: 'Profissionais inativos com jobs ativos',
      severity: 'critical',
      source: 'Firebase:users + jobs',
      description: 'Profissionais inativos ainda associados a jobs ativos',
      count: profissionaisInativos.length,
      items: clampItems(profissionaisInativos.map(({ job, profissionalId, profissional }) => ({
        id: `${job.id}:${profissionalId || 'na'}`,
        label: profissional?.nome || profissional?.displayName || 'Profissional',
        description: `Job ${job.id}`,
      }))),
    });
  }

  // Alert 4: Cancelamentos recorrentes (profissionais com taxa > 25%)
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
    alerts.push({
      id: 'cancelamentos-recorrentes',
      title: 'Cancelamentos recorrentes',
      severity: 'warning',
      source: 'Firebase:jobs',
      description: 'Profissionais com taxa de cancelamento > 25% (min 4 jobs)',
      count: cancelamentosRecorrentes.length,
      items: clampItems(cancelamentosRecorrentes.map((item) => ({
        id: item.profissionalId,
        label: usersMap.get(item.profissionalId)?.nome || 'Profissional',
        description: `Cancelamentos: ${item.cancelled}/${item.total}`,
      }))),
    });
  }

  // ===== Tickets =====
  try {
    const ticketsSnap = await db
      .collection('tickets')
      .where('createdAt', '>=', windowStart)
      .get();

    const tickets = ticketsSnap.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;

    const ticketsCriticos = tickets.filter((t) => {
      const tipo = (t.tipo || '').toString().toUpperCase();
      const status = (t.status || '').toString().toUpperCase();
      return tipo === 'RECLAMAÇÃO' && status !== 'CONCLUIDO' && status !== 'CLOSED';
    });

    if (ticketsCriticos.length > 0) {
      alerts.push({
        id: 'tickets-criticos',
        title: 'Tickets criticos em aberto',
        severity: 'critical',
        source: 'Firebase:tickets',
        description: 'Reclamacoes pendentes',
        count: ticketsCriticos.length,
        items: clampItems(ticketsCriticos.map((t) => ({
          id: t.id,
          label: t.titulo || 'Ticket',
          description: t.usuarioNome || t.usuarioId || 'Usuario',
        }))),
      });
    }
  } catch (error) {
    console.error('[Alerts] Erro ao buscar tickets:', error);
  }

  // ===== Stripe =====
  try {
    const stripe = getStripeClient();
    const startUnix = Math.floor(
      (Date.now() - windowDays * 24 * 60 * 60 * 1000) / 1000
    );

    const charges = await stripe.charges.list({
      created: { gte: startUnix },
      limit: 100,
    });

    const pendentes = charges.data.filter((c) => c.status === 'pending' && hoursSince(new Date(c.created * 1000)) >= 72);
    const falhos = charges.data.filter((c) => c.status === 'failed');

    if (pendentes.length > 0) {
      alerts.push({
        id: 'pagamentos-pendentes',
        title: 'Pagamentos pendentes > 72h',
        severity: 'critical',
        source: 'Stripe:charges',
        description: 'Pagamentos pendentes por mais de 72 horas',
        count: pendentes.length,
        items: clampItems(pendentes.map((c) => ({
          id: c.id,
          label: `Charge ${c.id}`,
          description: `R$ ${(c.amount || 0) / 100}`,
        }))),
      });
    }

    if (falhos.length > 0) {
      alerts.push({
        id: 'pagamentos-falhos',
        title: 'Pagamentos falhos',
        severity: 'warning',
        source: 'Stripe:charges',
        description: 'Charges com status failed',
        count: falhos.length,
        items: clampItems(falhos.map((c) => ({
          id: c.id,
          label: `Charge ${c.id}`,
          description: `R$ ${(c.amount || 0) / 100}`,
        }))),
      });
    }
  } catch (error) {
    console.error('[Alerts] Erro ao buscar Stripe charges:', error);
  }

  return {
    windowDays,
    alerts,
    timestamp: new Date().toISOString(),
  };
}
