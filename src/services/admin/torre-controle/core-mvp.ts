/**
 * ═══════════════════════════════════════════════════════
 * CARD 3: CORE MVP (Marketplace)
 * ═══════════════════════════════════════════════════════
 * Fonte: Firebase jobs
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { CoreMvpCard } from './types';

export async function getCoreMvpCard(): Promise<CoreMvpCard> {
  const db = getFirestore();
  
  try {
    // Buscar todos os jobs
    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    let jobsAtivos = 0;
    let totalJobs = 0;
    let jobsComMatch = 0;
    let matchesCompletados = 0;
    let totalTempoMatch = 0;
    let matchComTempoCount = 0;

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const status = data.status;

      totalJobs++;

      // Jobs ativos (em aberto ou em andamento)
      if (status === 'pending' || status === 'open' || status === 'active' || status === 'matched') {
        jobsAtivos++;
      }

      // Jobs que tiveram match
      if (status === 'matched' || status === 'active' || status === 'completed') {
        jobsComMatch++;

        // Calcular tempo até match
        if (data.createdAt && data.matches && Array.isArray(data.matches)) {
          const jobCriadoEm = toDate(data.createdAt);
          
          // Encontrar primeiro match aceito
          const primeiroMatch = data.matches.find((m: any) => m.status === 'accepted');
          
          if (primeiroMatch && primeiroMatch.acceptedAt && jobCriadoEm) {
            const matchAceitoEm = toDate(primeiroMatch.acceptedAt);
            
            if (matchAceitoEm) {
              const diff = matchAceitoEm.getTime() - jobCriadoEm.getTime();
              if (diff > 0) {
                totalTempoMatch += diff;
                matchComTempoCount++;
              }
            }
          }
        }
      }

      // Matches completados
      if (status === 'completed') {
        matchesCompletados++;
      }
    });

    const taxaMatch = totalJobs > 0
      ? (jobsComMatch / totalJobs) * 100
      : 0;

    const tempoMedioMatch = matchComTempoCount > 0
      ? (totalTempoMatch / matchComTempoCount) / (1000 * 60 * 60) // horas
      : 0;

    const taxaConversao = jobsComMatch > 0
      ? (matchesCompletados / jobsComMatch) * 100
      : 0;

    // Determinar trend (simplificado)
    const trend = jobsAtivos > 0 ? 'up' : 'stable';

    return {
      jobsAtivos,
      taxaMatch: Math.round(taxaMatch * 10) / 10,
      tempoMedioMatch: Math.round(tempoMedioMatch * 10) / 10,
      taxaConversao: Math.round(taxaConversao * 10) / 10,
      trend
    };

  } catch (error) {
    console.error('[CoreMVP] Erro ao buscar dados:', error);
    return {
      jobsAtivos: 0,
      taxaMatch: 0,
      tempoMedioMatch: 0,
      taxaConversao: 0,
      trend: 'stable'
    };
  }
}
