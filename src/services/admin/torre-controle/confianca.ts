/**
 * ═══════════════════════════════════════════════════════
 * CARD 5: CONFIANÇA
 * ═══════════════════════════════════════════════════════
 * Fonte: Firebase tickets, feedbacks, ratings
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { ConfiancaCard } from './types';

export async function getConfiancaCard(): Promise<ConfiancaCard> {
  const db = getFirestore();
  
  try {
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

    // 1. Buscar tickets abertos (críticos)
    const ticketsSnap = await db
      .collection('tickets')
      .get();

    let ticketsAbertos = 0;
    let alertasCriticos = 0;

    ticketsSnap.forEach(doc => {
      const data = doc.data();
      const status = data.status;

      // Tickets abertos
      if (status === 'A_FAZER' || status === 'EM_ATENDIMENTO' || status === 'open') {
        ticketsAbertos++;

        // Alertas críticos (tipo RECLAMAÇÃO)
        if (data.tipo === 'RECLAMAÇÃO' || data.tipo === 'PROBLEMA') {
          alertasCriticos++;
        }
      }
    });

    // 2. Calcular rating médio (últimos 30 dias)
    const feedbacksSnap = await db
      .collection('feedbacks')
      .get();

    let totalRating = 0;
    let ratingCount = 0;

    feedbacksSnap.forEach(doc => {
      const data = doc.data();
      
      if (data.rating && typeof data.rating === 'number') {
        // Filtrar últimos 30 dias
        if (data.createdAt) {
          const createdDate = toDate(data.createdAt);
          if (createdDate && createdDate.getTime() >= thirtyDaysAgoTimestamp) {
            totalRating += data.rating;
            ratingCount++;
          }
        }
      }
    });

    // Buscar ratings collection também
    const ratingsSnap = await db
      .collection('ratings')
      .get();

    ratingsSnap.forEach(doc => {
      const data = doc.data();
      
      if (data.rating && typeof data.rating === 'number') {
        if (data.createdAt) {
          const createdDate = toDate(data.createdAt);
          if (createdDate && createdDate.getTime() >= thirtyDaysAgoTimestamp) {
            totalRating += data.rating;
            ratingCount++;
          }
        }
      }
    });

    const ratingMedio = ratingCount > 0
      ? totalRating / ratingCount
      : 0;

    // NPS: não implementado ainda
    const nps = null;

    // Determinar trend (se rating >= 4, trend up, se < 3, down)
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (ratingMedio >= 4) {
      trend = 'up';
    } else if (ratingMedio < 3) {
      trend = 'down';
    }

    return {
      ticketsAbertos,
      ratingMedio: Math.round(ratingMedio * 10) / 10,
      nps,
      alertasCriticos,
      trend
    };

  } catch (error) {
    console.error('[Confiança] Erro ao buscar dados:', error);
    return {
      ticketsAbertos: 0,
      ratingMedio: 0,
      nps: null,
      alertasCriticos: 0,
      trend: 'stable'
    };
  }
}
