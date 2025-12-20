/**
 * ═══════════════════════════════════════════════════════
 * QUALIDADE - Match Quality Metrics
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { QualidadeMatch } from './types';

export async function getQualidadeMatch(): Promise<QualidadeMatch> {
  const db = getFirestore();

  try {
    // Buscar últimos 100 jobs para análise
    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    let totalJobs = 0;
    let jobsComMatch = 0;
    let totalTempoMatch = 0;
    let matchComTempoCount = 0;
    let matchesAbandonados = 0;
    let totalMatches = 0;

    jobsSnap.forEach(doc => {
      const data = doc.data();
      totalJobs++;

      // Jobs que tiveram match
      if (data.status === 'matched' || data.status === 'active' || data.status === 'completed') {
        jobsComMatch++;

        // Calcular tempo até match
        if (data.createdAt && data.matches && Array.isArray(data.matches)) {
          const jobCriadoEm = toDate(data.createdAt);
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

          // Contar matches abandonados
          data.matches.forEach((match: any) => {
            totalMatches++;
            if (match.status === 'declined' || match.status === 'cancelled') {
              matchesAbandonados++;
            }
          });
        }
      }
    });

    // Buscar ratings para satisfação média
    const ratingsSnap = await db
      .collection('ratings')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    let totalRating = 0;
    let ratingCount = 0;

    ratingsSnap.forEach(doc => {
      const data = doc.data();
      if (data.rating && typeof data.rating === 'number') {
        totalRating += data.rating;
        ratingCount++;
      }
    });

    // Calcular métricas
    const taxaMatchSucesso = totalJobs > 0 ? (jobsComMatch / totalJobs) * 100 : 0;
    const tempoMedioMatch = matchComTempoCount > 0 
      ? (totalTempoMatch / matchComTempoCount) / (1000 * 60 * 60) // horas
      : 0;
    const taxaAbandonoPosMatch = totalMatches > 0 
      ? (matchesAbandonados / totalMatches) * 100 
      : 0;
    const satisfacaoMedia = ratingCount > 0 ? totalRating / ratingCount : 0;

    return {
      taxaMatchSucesso: Math.round(taxaMatchSucesso * 10) / 10,
      tempoMedioMatch: Math.round(tempoMedioMatch * 10) / 10,
      taxaAbandonoPosMatch: Math.round(taxaAbandonoPosMatch * 10) / 10,
      satisfacaoMedia: Math.round(satisfacaoMedia * 10) / 10
    };

  } catch (error) {
    console.error('[Qualidade Match] Erro:', error);
    return {
      taxaMatchSucesso: 0,
      tempoMedioMatch: 0,
      taxaAbandonoPosMatch: 0,
      satisfacaoMedia: 0
    };
  }
}
