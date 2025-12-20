/**
 * ═══════════════════════════════════════════════════════
 * CONFIANÇA & QUALIDADE - INDEX
 * ═══════════════════════════════════════════════════════
 */

import { getNPSData } from './nps';
import { getRatingTrends } from './ratings';
import { getSupportMetrics } from './support';
import type { ConfiancaQualidadeData } from './types';

export async function getConfiancaQualidadeData(): Promise<ConfiancaQualidadeData> {
  try {
    const [nps, ratings, support] = await Promise.all([
      getNPSData(),
      getRatingTrends(),
      getSupportMetrics()
    ]);

    return {
      nps,
      ratings,
      support,
      qualidade: {
        taxaResolucaoPrimeiroContato: 0,
        taxaReabertura: 0,
        incidentesCriticos: 0,
        alertasAtivos: 0
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Confiança Qualidade] Erro:', error);
    throw error;
  }
}

export * from './types';
export * from './nps';
export * from './ratings';
export * from './support';
