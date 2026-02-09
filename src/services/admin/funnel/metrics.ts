/**
 * Funnel metrics based on real data (Firebase + Stripe + GA4)
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getStripeClient } from '@/lib/server/stripe';
import { isJobCompleted, hasJobProfessional } from '../statusNormalizer';
import type { FunnelMetrics, FunnelStage } from './types';

function buildUnavailableStage(id: string, label: string, source: string, description: string, reason: string): FunnelStage {
  return {
    id,
    label,
    source,
    description,
    value: null,
    available: false,
    missingReason: reason,
  };
}

async function getGA4TotalUsers(windowDays: number): Promise<{ value: number | null; reason?: string }> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

  if (!propertyId) {
    return { value: null, reason: 'GA4_PROPERTY_ID nao configurado' };
  }
  if (!serviceAccountBase64) {
    return { value: null, reason: 'FIREBASE_ADMIN_SERVICE_ACCOUNT nao configurado' };
  }

  try {
    const credentials = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    );

    const client = new BetaAnalyticsDataClient({ credentials });

    const [report] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate: `${windowDays}daysAgo`, endDate: 'today' }],
      metrics: [{ name: 'totalUsers' }],
    });

    const value = report.rows?.[0]?.metricValues?.[0]?.value;
    return { value: value ? parseInt(value, 10) : 0 };
  } catch (error) {
    console.error('[Funnel] Erro ao buscar GA4:', error);
    return { value: null, reason: 'Erro ao consultar GA4' };
  }
}

export async function getFunnelMetrics(windowDays: number = 30): Promise<FunnelMetrics> {
  const app = getFirebaseAdmin();
  const db = getFirestore();

  const windowStart = Timestamp.fromDate(
    new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  );

  // Stage 1: Visitantes (GA4)
  const ga4 = await getGA4TotalUsers(windowDays);
  const stages: FunnelStage[] = [];

  if (ga4.value === null) {
    stages.push(buildUnavailableStage(
      'visitors',
      'Visitantes Unicos',
      'GA4:totalUsers',
      'Usuarios unicos no site',
      ga4.reason || 'GA4 nao disponivel'
    ));
  } else {
    stages.push({
      id: 'visitors',
      label: 'Visitantes Unicos',
      source: 'GA4:totalUsers',
      description: 'Usuarios unicos no site',
      value: ga4.value,
      available: true,
    });
  }

  // Stage 2: Cadastros iniciados (users)
  let usersCount: number | null = null;
  try {
    const usersSnap = await db
      .collection('users')
      .where('createdAt', '>=', windowStart)
      .get();
    usersCount = usersSnap.size;
    stages.push({
      id: 'signups',
      label: 'Cadastros Iniciados',
      source: 'Firebase:users',
      description: 'Usuarios que criaram conta',
      value: usersCount,
      available: true,
    });
  } catch (error) {
    console.error('[Funnel] Erro ao buscar users:', error);
    stages.push(buildUnavailableStage(
      'signups',
      'Cadastros Iniciados',
      'Firebase:users',
      'Usuarios que criaram conta',
      'Erro ao consultar Firestore'
    ));
  }

  // Stage 3: Familias cadastradas
  try {
    const familiasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .where('createdAt', '>=', windowStart)
      .get();
    stages.push({
      id: 'familias',
      label: 'Familias Cadastradas',
      source: 'Firebase:users',
      description: 'Usuarios com perfil cliente',
      value: familiasSnap.size,
      available: true,
    });
  } catch (error) {
    console.error('[Funnel] Erro ao buscar familias:', error);
    stages.push(buildUnavailableStage(
      'familias',
      'Familias Cadastradas',
      'Firebase:users',
      'Usuarios com perfil cliente',
      'Erro ao consultar Firestore'
    ));
  }

  // Stage 4: Jobs criados
  let jobs: Array<Record<string, any>> = [];
  try {
    const jobsSnap = await db
      .collection('jobs')
      .where('createdAt', '>=', windowStart)
      .get();
    jobs = jobsSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) })) as Array<Record<string, any>>;
    stages.push({
      id: 'jobs',
      label: 'Jobs Criados',
      source: 'Firebase:jobs',
      description: 'Jobs criados no periodo',
      value: jobsSnap.size,
      available: true,
    });
  } catch (error) {
    console.error('[Funnel] Erro ao buscar jobs:', error);
    stages.push(buildUnavailableStage(
      'jobs',
      'Jobs Criados',
      'Firebase:jobs',
      'Jobs criados no periodo',
      'Erro ao consultar Firestore'
    ));
  }

  // Stage 5: Match realizado
  if (jobs.length > 0) {
    const matches = jobs.filter((job) => hasJobProfessional(job));
    stages.push({
      id: 'matches',
      label: 'Match Realizado',
      source: 'Firebase:jobs',
      description: 'Jobs com profissional atribuido',
      value: matches.length,
      available: true,
    });
  } else {
    stages.push(buildUnavailableStage(
      'matches',
      'Match Realizado',
      'Firebase:jobs',
      'Jobs com profissional atribuido',
      'Nao disponivel (jobs vazios)'
    ));
  }

  // Stage 6: Pagamento confirmado (Stripe charges succeeded)
  try {
    const stripe = getStripeClient();
    const startUnix = Math.floor(
      (Date.now() - windowDays * 24 * 60 * 60 * 1000) / 1000
    );
    const charges = await stripe.charges.list({
      created: { gte: startUnix },
      limit: 100,
    });
    const confirmed = charges.data.filter((c) => c.status === 'succeeded');
    stages.push({
      id: 'payments',
      label: 'Pagamento Confirmado',
      source: 'Stripe:charges',
      description: 'Pagamentos com status succeeded',
      value: confirmed.length,
      available: true,
    });
  } catch (error) {
    console.error('[Funnel] Erro ao buscar Stripe charges:', error);
    stages.push(buildUnavailableStage(
      'payments',
      'Pagamento Confirmado',
      'Stripe:charges',
      'Pagamentos com status succeeded',
      'Stripe nao disponivel'
    ));
  }

  // Stage 7: Servico concluido
  if (jobs.length > 0) {
    const completed = jobs.filter((job) => isJobCompleted(job));
    stages.push({
      id: 'completed',
      label: 'Servico Concluido',
      source: 'Firebase:jobs',
      description: 'Jobs concluidos no periodo',
      value: completed.length,
      available: true,
    });
  } else {
    stages.push(buildUnavailableStage(
      'completed',
      'Servico Concluido',
      'Firebase:jobs',
      'Jobs concluidos no periodo',
      'Nao disponivel (jobs vazios)'
    ));
  }

  // Conversion rates
  for (let i = 1; i < stages.length; i += 1) {
    const prev = stages[i - 1];
    const curr = stages[i];
    if (prev.available && curr.available && prev.value !== null && curr.value !== null && prev.value > 0) {
      curr.conversionFromPrev = (curr.value / prev.value) * 100;
      curr.dropOff = prev.value - curr.value;
    } else {
      curr.conversionFromPrev = null;
      curr.dropOff = null;
    }
  }

  return {
    windowDays,
    stages,
    timestamp: new Date().toISOString(),
  };
}
