/**
 * Torre - Main Index
 * Aggregates all blocks and generates complete dashboard
 */

import { getDemandaBlock } from './demanda';
import { getOfertaBlock } from './oferta';
import { getCoreMVPBlock } from './core';
import { getFinanceiroBlock } from './financeiro';
import { getConfiancaBlock } from './confianca';
import { generateUrgentActions } from './actions';
import type { TorreHomeData } from './types';

export async function getTorreHomeData(): Promise<TorreHomeData> {
  try {
    console.log('[Torre Home] Starting data collection...');
    
    // Executar todas as queries em paralelo para otimizar performance
    const [demanda, oferta, coreMVP, financeiro, confianca] = await Promise.all([
      getDemandaBlock().catch(err => {
        console.error('[Torre Home] Demanda block error:', err.message);
        throw new Error(`Demanda block failed: ${err.message}`);
      }),
      getOfertaBlock().catch(err => {
        console.error('[Torre Home] Oferta block error:', err.message);
        throw new Error(`Oferta block failed: ${err.message}`);
      }),
      getCoreMVPBlock().catch(err => {
        console.error('[Torre Home] Core MVP block error:', err.message);
        throw new Error(`Core MVP block failed: ${err.message}`);
      }),
      getFinanceiroBlock().catch(err => {
        console.error('[Torre Home] Financeiro block error:', err.message);
        throw new Error(`Financeiro block failed: ${err.message}`);
      }),
      getConfiancaBlock().catch(err => {
        console.error('[Torre Home] Confianca block error:', err.message);
        throw new Error(`Confianca block failed: ${err.message}`);
      })
    ]);

    console.log('[Torre Home] All blocks loaded successfully');

    const data: TorreHomeData = {
      demanda,
      oferta,
      coreMVP,
      financeiro,
      confianca,
      urgentActions: [],
      timestamp: new Date().toISOString()
    };

    // Gerar ações urgentes baseado nos dados coletados
    data.urgentActions = generateUrgentActions(data);

    console.log('[Torre Home] Data collection complete');
    return data;
  } catch (error: any) {
    console.error('[Torre Home] Fatal error:', error);
    throw error;
  }
}

export * from './types';
