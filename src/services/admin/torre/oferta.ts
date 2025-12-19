/**
 * Torre - Oferta Block
 * Source: Firebase Firestore (users collection)
 * Read-only, no writes
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { OfertaBlock } from './types';

export async function getOfertaBlock(): Promise<OfertaBlock> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Profissionais disponíveis (perfil: profissional, ativo: true)
  const availableProfessionalsSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .get();

  const totalAvailable = availableProfessionalsSnapshot.size;

  // Calcular mudança vs período anterior
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const prevAvailableSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const prevAvailableCount = prevAvailableSnapshot.size;
  const availableChange = prevAvailableCount > 0
    ? ((totalAvailable - prevAvailableCount) / prevAvailableCount) * 100
    : 0;

  // Taxa de conversão de aceite
  // jobs onde specialistId não é null / total de jobs oferecidos a profissionais
  const jobsWithSpecialistSnapshot = await db
    .collection('jobs')
    .where('specialistId', '!=', null)
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const acceptedJobs = jobsWithSpecialistSnapshot.size;

  const allJobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const totalJobs = allJobsSnapshot.size;
  const acceptanceRate = totalJobs > 0 ? (acceptedJobs / totalJobs) * 100 : 0;

  // Calcular mudança vs período anterior
  const prevJobsWithSpecialistSnapshot = await db
    .collection('jobs')
    .where('specialistId', '!=', null)
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const prevAcceptedJobs = prevJobsWithSpecialistSnapshot.size;

  const prevAllJobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', sixtyDaysAgo)
    .where('createdAt', '<', thirtyDaysAgo)
    .get();

  const prevTotalJobs = prevAllJobsSnapshot.size;
  const prevAcceptanceRate = prevTotalJobs > 0 ? (prevAcceptedJobs / prevTotalJobs) * 100 : 0;

  const acceptanceRateChange = prevAcceptanceRate > 0
    ? ((acceptanceRate - prevAcceptanceRate) / prevAcceptanceRate) * 100
    : 0;

  // Abandono pós-aceite
  // jobs com specialistId mas status = cancelado ou abandonado
  const abandonedJobsSnapshot = await db
    .collection('jobs')
    .where('specialistId', '!=', null)
    .where('status', 'in', ['cancelado', 'abandonado'])
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const abandonedCount = abandonedJobsSnapshot.size;
  const abandonmentRate = acceptedJobs > 0 ? (abandonedCount / acceptedJobs) * 100 : 0;

  // Profissionais inativos (sem atividade nos últimos 30 dias)
  const allProfessionalsSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .get();

  let inactiveProfessionals = 0;

  // Verificar última atividade (simplificado: createdAt < 30 dias e sem jobs recentes)
  for (const profDoc of allProfessionalsSnapshot.docs) {
    const profData = profDoc.data();
    const profId = profDoc.id;

    // Buscar jobs do profissional nos últimos 30 dias
    const recentJobsSnapshot = await db
      .collection('jobs')
      .where('specialistId', '==', profId)
      .where('createdAt', '>=', thirtyDaysAgo)
      .limit(1)
      .get();

    if (recentJobsSnapshot.empty) {
      const createdAt = toDate(profData.createdAt);
      if (createdAt && createdAt < thirtyDaysAgo) {
        inactiveProfessionals++;
      }
    }
  }

  const totalProfessionals = allProfessionalsSnapshot.size;
  const inactivePercentage = totalProfessionals > 0 
    ? (inactiveProfessionals / totalProfessionals) * 100 
    : 0;

  return {
    profissionaisDisponiveis: {
      total: totalAvailable,
      change: availableChange,
      trend: availableChange > 5 ? 'up' : availableChange < -5 ? 'down' : 'stable'
    },
    taxaConversaoAceite: {
      percentage: acceptanceRate,
      change: acceptanceRateChange,
      trend: acceptanceRateChange > 5 ? 'up' : acceptanceRateChange < -5 ? 'down' : 'stable'
    },
    abandonoPosAceite: {
      percentage: abandonmentRate,
      count: abandonedCount
    },
    profissionaisInativos30d: {
      count: inactiveProfessionals,
      percentage: inactivePercentage
    }
  };
}
