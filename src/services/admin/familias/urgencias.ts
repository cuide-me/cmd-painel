/**
 * ═══════════════════════════════════════════════════════
 * URGÊNCIAS - Análise de demanda urgente
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { UrgenciasDemanda } from './types';

export async function getUrgenciasDemanda(): Promise<UrgenciasDemanda> {
  const db = getFirestore();

  try {
    // Buscar jobs em aberto
    const jobsSnap = await db
      .collection('jobs')
      .where('status', 'in', ['pending', 'open'])
      .get();

    const urgencias = {
      urgente: 0,
      alta: 0,
      media: 0,
      baixa: 0
    };

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const urgencia = (data.urgencia || 'media').toLowerCase();
      
      if (urgencia === 'urgente' || urgencia === 'imediato') {
        urgencias.urgente++;
      } else if (urgencia === 'alta') {
        urgencias.alta++;
      } else if (urgencia === 'baixa') {
        urgencias.baixa++;
      } else {
        urgencias.media++;
      }
    });

    return {
      ...urgencias,
      total: jobsSnap.size
    };

  } catch (error) {
    console.error('[Urgências] Erro:', error);
    return {
      urgente: 0,
      alta: 0,
      media: 0,
      baixa: 0,
      total: 0
    };
  }
}
