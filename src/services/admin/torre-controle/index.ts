/**
 * ═══════════════════════════════════════════════════════
 * TORRE DE CONTROLE - INDEX
 * ═══════════════════════════════════════════════════════
 * Orquestra todos os cards do dashboard
 */

import { getDemandaCard } from './demanda';
import { getOfertaCard } from './oferta';
import { getCoreMvpCard } from './core-mvp';
import { getFinanceiroCard } from './financeiro';
import { getConfiancaCard } from './confianca';
import { getTop5Problemas } from './problemas';
import type { TorreControleDashboard } from './types';

export async function getTorreControleDashboard(): Promise<TorreControleDashboard> {
  try {
    // Buscar todos os cards em paralelo
    const [demanda, oferta, coreMvp, financeiro, confianca, top5Problemas] = await Promise.all([
      getDemandaCard(),
      getOfertaCard(),
      getCoreMvpCard(),
      getFinanceiroCard(),
      getConfiancaCard(),
      getTop5Problemas(), // Quick Win #3
    ]);

    return {
      demanda,
      oferta,
      coreMvp,
      financeiro,
      confianca,
      top5Problemas,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Torre Controle] Erro ao buscar dashboard:', error);
    throw error;
  }
}

export * from './types';
export * from './demanda';
export * from './oferta';
export * from './core-mvp';
export * from './financeiro';
export * from './confianca';
