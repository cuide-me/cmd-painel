export * from './types';
export * from './getPipelineData';

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

/**
 * Retorna overview do pipeline de conversão
 * - Total de requests
 * - Requests abertas (status open/pending)
 * - Propostas enviadas
 * - Propostas aceitas
 * - Contratações dos últimos 7 e 30 dias
 */
export async function getPipelineOverview() {
  try {
    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total de requests
    const totalRequestsSnap = await db.collection('requests').get();
    const totalRequests = totalRequestsSnap.size;

    // Requests abertas
    const openRequestsSnap = await db
      .collection('requests')
      .where('status', 'in', ['open', 'pending'])
      .get();
    const openRequests = openRequestsSnap.size;

    // Propostas enviadas (todas)
    const proposalsSnap = await db.collection('proposals').get();
    const proposalsSent = proposalsSnap.size;

    // Propostas aceitas
    const acceptedProposalsSnap = await db
      .collection('proposals')
      .where('status', 'in', ['accepted', 'active'])
      .get();
    const acceptedProposals = acceptedProposalsSnap.size;

    // Contratações (contracts) últimos 7 dias
    const hires7dSnap = await db
      .collection('contracts')
      .where('createdAt', '>=', sevenDaysAgo)
      .get();
    const hires7d = hires7dSnap.size;

    // Contratações últimos 30 dias
    const hires30dSnap = await db
      .collection('contracts')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    const hires30d = hires30dSnap.size;

    return {
      totalRequests,
      openRequests,
      proposalsSent,
      acceptedProposals,
      hires7d,
      hires30d,
    };
  } catch (error) {
    console.error('[getPipelineOverview] Error:', error);
    return {
      totalRequests: 0,
      openRequests: 0,
      proposalsSent: 0,
      acceptedProposals: 0,
      hires7d: 0,
      hires30d: 0,
    };
  }
}
