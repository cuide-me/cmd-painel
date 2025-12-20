/**
 * ═══════════════════════════════════════════════════════
 * FAMÍLIAS - INDEX
 * ═══════════════════════════════════════════════════════
 */

import { getJornadaFamilias } from './jornada';
import { getUrgenciasDemanda } from './urgencias';
import { getConversaoFamilias } from './conversao';
import { getAbandonoFamilias } from './abandono';
import { getSegmentacaoFamilias } from './segmentacao';
import type { FamiliasData } from './types';

export async function getFamiliasData(): Promise<FamiliasData> {
  try {
    const [jornada, urgencias, conversao, abandono, segmentacao] = await Promise.all([
      getJornadaFamilias(),
      getUrgenciasDemanda(),
      getConversaoFamilias(),
      getAbandonoFamilias(),
      getSegmentacaoFamilias()
    ]);

    return {
      jornada,
      urgencias,
      conversao,
      abandono,
      segmentacao,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Famílias Data] Erro:', error);
    throw error;
  }
}

export * from './types';
export * from './jornada';
export * from './urgencias';
export * from './conversao';
export * from './abandono';
export * from './segmentacao';
