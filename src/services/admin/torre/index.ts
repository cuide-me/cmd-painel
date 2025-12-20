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
    
    // Helper para criar bloco vazio em caso de erro
    const safeGetBlock = async <T>(
      name: string,
      fn: () => Promise<T>,
      fallback: T
    ): Promise<T> => {
      try {
        console.log(`[Torre Home] Loading ${name}...`);
        const result = await fn();
        console.log(`[Torre Home] ✅ ${name} loaded`);
        return result;
      } catch (err: any) {
        console.error(`[Torre Home] ❌ ${name} error:`, err.message);
        console.error(`[Torre Home] ${name} stack:`, err.stack);
        return fallback;
      }
    };

    // Executar todas as queries em paralelo com fallbacks
    const [demanda, oferta, coreMVP, financeiro, confianca] = await Promise.all([
      safeGetBlock('Demanda', getDemandaBlock, getEmptyDemandaBlock()),
      safeGetBlock('Oferta', getOfertaBlock, getEmptyOfertaBlock()),
      safeGetBlock('Core MVP', getCoreMVPBlock, getEmptyCoreMVPBlock()),
      safeGetBlock('Financeiro', getFinanceiroBlock, getEmptyFinanceiroBlock()),
      safeGetBlock('Confianca', getConfiancaBlock, getEmptyConfiancaBlock())
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
    try {
      data.urgentActions = generateUrgentActions(data);
    } catch (err: any) {
      console.error('[Torre Home] Error generating urgent actions:', err);
      data.urgentActions = [];
    }

    console.log('[Torre Home] Data collection complete');
    return data;
  } catch (error: any) {
    console.error('[Torre Home] Fatal error:', error);
    throw error;
  }
}

// Funções helper para blocos vazios
function getEmptyDemandaBlock(): any {
  return {
    solicitacoesAbertas: { total: 0, change: 0, trend: 'stable' },
    tempoMedioMatch: { hours: 0, change: 0, trend: 'stable' },
    slaRisco: { count: 0, percentage: 0 }
  };
}

function getEmptyOfertaBlock(): any {
  return {
    profissionaisDisponiveis: { total: 0, change: 0, trend: 'stable' },
    taxaConversaoAceite: { percentage: 0, change: 0, trend: 'stable' },
    abandonoPosAceite: { percentage: 0, count: 0 },
    profissionaisInativos30d: { count: 0, percentage: 0 }
  };
}

function getEmptyCoreMVPBlock(): any {
  return {
    matchesConcluidos: { total: 0, change: 0, trend: 'stable' },
    taxaSucesso: { percentage: 0, change: 0, trend: 'stable' },
    cancelamentos: { total: 0, percentage: 0 },
    retrabalho: { count: 0, percentage: 0 }
  };
}

function getEmptyFinanceiroBlock(): any {
  return {
    receitaMensal: { value: 0, change: 0, trend: 'stable' },
    ticketMedio: { value: 0, change: 0, trend: 'stable' },
    churn: { percentage: 0, count: 0 },
    assinaturasAtivas: { total: 0, change: 0, trend: 'stable' }
  };
}

function getEmptyConfiancaBlock(): any {
  return {
    ticketsAbertos: { total: 0, change: 0, trend: 'stable' },
    tempoMedioResposta: { hours: 0, change: 0, trend: 'stable' },
    satisfacaoGeral: { score: 0, change: 0, trend: 'stable' },
    incidentesCriticos: { count: 0, resolvidos: 0 }
  };
}

export * from './types';
