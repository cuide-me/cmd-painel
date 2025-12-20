/**
 * ═══════════════════════════════════════════════════════
 * CUIDADORES - INDEX
 * ═══════════════════════════════════════════════════════
 */

import { getDisponibilidadeCuidadores } from './disponibilidade';
import { getEspecialidadesCuidadores } from './especialidades';
import { getRetencaoCuidadores } from './retencao';
import { getTopPerformers } from './performance';
import type { CuidadoresData } from './types';

export async function getCuidadoresData(): Promise<CuidadoresData> {
  try {
    const [disponibilidade, especialidades, retencao, topPerformers] = await Promise.all([
      getDisponibilidadeCuidadores(),
      getEspecialidadesCuidadores(),
      getRetencaoCuidadores(),
      getTopPerformers()
    ]);

    return {
      disponibilidade,
      especialidades,
      retencao,
      topPerformers,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Cuidadores Data] Erro:', error);
    throw error;
  }
}

export * from './types';
export * from './disponibilidade';
export * from './especialidades';
export * from './retencao';
export * from './performance';
