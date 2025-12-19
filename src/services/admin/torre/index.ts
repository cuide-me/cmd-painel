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
  // Executar todas as queries em paralelo para otimizar performance
  const [demanda, oferta, coreMVP, financeiro, confianca] = await Promise.all([
    getDemandaBlock(),
    getOfertaBlock(),
    getCoreMVPBlock(),
    getFinanceiroBlock(),
    getConfiancaBlock()
  ]);

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

  return data;
}

export * from './types';
