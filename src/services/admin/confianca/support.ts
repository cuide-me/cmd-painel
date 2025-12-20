/**
 * ═══════════════════════════════════════════════════════
 * SUPPORT - Métricas de suporte
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { SupportMetrics } from './types';

export async function getSupportMetrics(): Promise<SupportMetrics> {
  const db = getFirestore();

  try {
    const ticketsSnap = await db.collection('tickets').get();

    let totalTickets = 0;
    let ticketsAbertos = 0;
    let ticketsEmAtendimento = 0;
    let ticketsConcluidos = 0;

    ticketsSnap.forEach(doc => {
      const data = doc.data();
      totalTickets++;

      const status = data.status || 'A_FAZER';
      if (status === 'A_FAZER') {
        ticketsAbertos++;
      } else if (status === 'EM_ATENDIMENTO') {
        ticketsEmAtendimento++;
      } else if (status === 'CONCLUIDO') {
        ticketsConcluidos++;
      }
    });

    return {
      totalTickets,
      ticketsAbertos,
      ticketsEmAtendimento,
      ticketsConcluidos,
      tempoMedioResposta: 0,
      tempoMedioResolucao: 0,
      satisfacaoSuporte: 0
    };

  } catch (error) {
    console.error('[Support] Erro:', error);
    return {
      totalTickets: 0,
      ticketsAbertos: 0,
      ticketsEmAtendimento: 0,
      ticketsConcluidos: 0,
      tempoMedioResposta: 0,
      tempoMedioResolucao: 0,
      satisfacaoSuporte: 0
    };
  }
}
