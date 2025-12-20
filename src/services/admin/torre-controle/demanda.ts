/**
 * ═══════════════════════════════════════════════════════
 * CARD 1: DEMANDA (Famílias)
 * ═══════════════════════════════════════════════════════
 * Fonte: Firebase users (perfil: cliente)
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { DemandaCard } from './types';

export async function getDemandaCard(): Promise<DemandaCard> {
  const db = getFirestore();
  
  try {
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

    // Buscar todas as famílias (perfil: cliente)
    const familiasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();

    const totalFamilias = familiasSnap.size;

    // Contar novas famílias (últimos 30 dias)
    let novasFamilias30d = 0;
    const familiaIds: string[] = [];

    familiasSnap.forEach(doc => {
      const data = doc.data();
      familiaIds.push(doc.id);

      if (data.createdAt) {
        const createdDate = toDate(data.createdAt);
        if (createdDate && createdDate.getTime() >= thirtyDaysAgoTimestamp) {
          novasFamilias30d++;
        }
      }
    });

    // Buscar jobs criados pelas famílias para calcular taxa de conversão
    const jobsSnap = await db
      .collection('jobs')
      .get();

    const familiasComJobs = new Set<string>();
    let totalTempoAteJob = 0;
    let familiaComTempoCount = 0;

    jobsSnap.forEach(jobDoc => {
      const jobData = jobDoc.data();
      const clienteId = jobData.clienteId;

      if (clienteId && familiaIds.includes(clienteId)) {
        familiasComJobs.add(clienteId);

        // Calcular tempo médio até primeiro job
        const familiaDoc = familiasSnap.docs.find(d => d.id === clienteId);
        if (familiaDoc) {
          const familiaData = familiaDoc.data();
          if (familiaData.createdAt && jobData.createdAt) {
            const familiaCriadaEm = toDate(familiaData.createdAt);
            const jobCriadoEm = toDate(jobData.createdAt);

            if (familiaCriadaEm && jobCriadoEm) {
              const diff = jobCriadoEm.getTime() - familiaCriadaEm.getTime();
              if (diff > 0) {
                totalTempoAteJob += diff;
                familiaComTempoCount++;
              }
            }
          }
        }
      }
    });

    const taxaConversao = totalFamilias > 0 
      ? (familiasComJobs.size / totalFamilias) * 100 
      : 0;

    const tempoMedioPrimeiroJob = familiaComTempoCount > 0
      ? (totalTempoAteJob / familiaComTempoCount) / (1000 * 60 * 60) // converter para horas
      : 0;

    // Determinar trend (simplificado: se novas famílias > 0, trend up)
    const trend = novasFamilias30d > 0 ? 'up' : 'stable';

    return {
      totalFamilias,
      novasFamilias30d,
      taxaConversao: Math.round(taxaConversao * 10) / 10,
      tempoMedioPrimeiroJob: Math.round(tempoMedioPrimeiroJob * 10) / 10,
      trend
    };

  } catch (error) {
    console.error('[Demanda] Erro ao buscar dados:', error);
    return {
      totalFamilias: 0,
      novasFamilias30d: 0,
      taxaConversao: 0,
      tempoMedioPrimeiroJob: 0,
      trend: 'stable'
    };
  }
}
