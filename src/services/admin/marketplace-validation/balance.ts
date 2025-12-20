/**
 * ═══════════════════════════════════════════════════════
 * BALANCE - Demanda vs Oferta
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { DemandaOfertaBalance } from './types';

export async function getDemandaOfertaBalance(): Promise<DemandaOfertaBalance> {
  const db = getFirestore();

  try {
    // Demanda: jobs em aberto (pending, open)
    const jobsSnap = await db
      .collection('jobs')
      .where('status', 'in', ['pending', 'open'])
      .get();

    const demandaAberta = jobsSnap.size;

    // Oferta: cuidadores disponíveis (ativo = true ou não explicitamente false)
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    let ofertaDisponivel = 0;
    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      if (data.ativo !== false) {
        ofertaDisponivel++;
      }
    });

    // Ratio (ideal: > 1.2)
    const ratio = demandaAberta > 0 ? ofertaDisponivel / demandaAberta : 0;

    // Status
    let status: 'saudavel' | 'atencao' | 'critico';
    if (ratio >= 1.2) {
      status = 'saudavel';
    } else if (ratio >= 0.8) {
      status = 'atencao';
    } else {
      status = 'critico';
    }

    // Trend (simplificado: se ratio > 1, trend up)
    const trend = ratio > 1 ? 'up' : ratio < 0.8 ? 'down' : 'stable';

    return {
      demandaAberta,
      ofertaDisponivel,
      ratio: Math.round(ratio * 100) / 100,
      status,
      trend
    };

  } catch (error) {
    console.error('[Balance] Erro:', error);
    return {
      demandaAberta: 0,
      ofertaDisponivel: 0,
      ratio: 0,
      status: 'critico',
      trend: 'stable'
    };
  }
}
