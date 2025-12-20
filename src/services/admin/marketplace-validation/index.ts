/**
 * ═══════════════════════════════════════════════════════
 * MARKETPLACE VALIDATION - INDEX
 * ═══════════════════════════════════════════════════════
 */

import { getDemandaOfertaBalance } from './balance';
import { getEspecialidadesBalance } from './especialidades';
import { getCoberturaGeografica } from './geografico';
import { getQualidadeMatch } from './qualidade';
import type { MarketplaceValidationData } from './types';

export async function getMarketplaceValidation(): Promise<MarketplaceValidationData> {
  try {
    const [balance, especialidades, geografico, qualidade] = await Promise.all([
      getDemandaOfertaBalance(),
      getEspecialidadesBalance(),
      getCoberturaGeografica(),
      getQualidadeMatch()
    ]);

    return {
      balance,
      especialidades,
      geografico,
      qualidade,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Marketplace Validation] Erro:', error);
    throw error;
  }
}

export * from './types';
export * from './balance';
export * from './especialidades';
export * from './geografico';
export * from './qualidade';
