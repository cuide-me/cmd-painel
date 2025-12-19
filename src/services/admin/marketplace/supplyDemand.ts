/**
 * Marketplace Validation - Supply/Demand Analysis
 * Source: Firebase (jobs + users)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { SupplyDemandRatio } from './types';

export async function getSupplyDemandRatio(): Promise<SupplyDemandRatio> {
  const db = getFirestore();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Current open requests
  const openRequestsSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['pendente', 'em_andamento'])
    .get();

  const openRequests = openRequestsSnapshot.size;

  // Available professionals (active and not fully booked)
  const availableProfessionalsSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .get();

  const availableProfessionals = availableProfessionalsSnapshot.size;

  // Calculate ratio
  const currentRatio = openRequests > 0 ? availableProfessionals / openRequests : 999;

  // Determine status
  let status: 'oversupply' | 'balanced' | 'undersupply';
  if (currentRatio > 1.5) status = 'oversupply';
  else if (currentRatio >= 0.8) status = 'balanced';
  else status = 'undersupply';

  // Get previous week data for trend
  const prevOpenRequestsSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['pendente', 'em_andamento'])
    .where('createdAt', '>=', oneWeekAgo)
    .get();

  const prevOpenRequests = prevOpenRequestsSnapshot.size;
  const prevRatio = prevOpenRequests > 0 ? availableProfessionals / prevOpenRequests : 999;

  const ratioChange = prevRatio > 0 ? ((currentRatio - prevRatio) / prevRatio) * 100 : 0;

  return {
    currentRatio,
    status,
    openRequests,
    availableProfessionals,
    trend: {
      change: ratioChange,
      direction: ratioChange > 5 ? 'up' : ratioChange < -5 ? 'down' : 'stable'
    }
  };
}
