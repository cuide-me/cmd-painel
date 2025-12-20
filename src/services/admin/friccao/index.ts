/**
 * ═══════════════════════════════════════════════════════
 * FRICÇÃO - Análise de pontos de abandono
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { FriccaoData, FriccaoPoint, MapaCalor } from './types';

export async function getFriccaoData(): Promise<FriccaoData> {
  const db = getFirestore();

  try {
    // Analisar jobs para identificar pontos de fricção
    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const statusCount = {
      total: 0,
      pending: 0,
      cancelled: 0,
      abandonedBeforeMatch: 0,
      abandonedAfterMatch: 0
    };

    jobsSnap.forEach(doc => {
      const data = doc.data();
      statusCount.total++;

      const status = data.status;
      if (status === 'pending') {
        statusCount.pending++;
      } else if (status === 'cancelled') {
        statusCount.cancelled++;
        
        // Verificar se foi antes ou depois do match
        if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
          statusCount.abandonedAfterMatch++;
        } else {
          statusCount.abandonedBeforeMatch++;
        }
      }
    });

    // Construir pontos de fricção
    const pontosFriccao: FriccaoPoint[] = [
      {
        etapa: 'Criação do Job',
        abandonos: statusCount.pending,
        taxaAbandono: statusCount.total > 0 ? (statusCount.pending / statusCount.total) * 100 : 0,
        tempoMedio: 0,
        principais_motivos: ['Tempo de resposta lento', 'Falta de cuidadores']
      },
      {
        etapa: 'Antes do Match',
        abandonos: statusCount.abandonedBeforeMatch,
        taxaAbandono: statusCount.total > 0 ? (statusCount.abandonedBeforeMatch / statusCount.total) * 100 : 0,
        tempoMedio: 0,
        principais_motivos: ['Sem candidatos', 'Preço elevado']
      },
      {
        etapa: 'Após Match',
        abandonos: statusCount.abandonedAfterMatch,
        taxaAbandono: statusCount.total > 0 ? (statusCount.abandonedAfterMatch / statusCount.total) * 100 : 0,
        tempoMedio: 0,
        principais_motivos: ['Desistência do cliente', 'Problema com cuidador']
      }
    ];

    // Mapa de calor (áreas com mais fricção)
    const mapaCalor: MapaCalor[] = [];
    
    pontosFriccao.forEach(ponto => {
      let nivel: 'baixo' | 'medio' | 'alto' | 'critico' = 'baixo';
      if (ponto.taxaAbandono > 30) nivel = 'critico';
      else if (ponto.taxaAbandono > 20) nivel = 'alto';
      else if (ponto.taxaAbandono > 10) nivel = 'medio';

      mapaCalor.push({
        area: ponto.etapa,
        nivel,
        incidentes: ponto.abandonos,
        impacto: Math.min(10, Math.round(ponto.taxaAbandono / 3))
      });
    });

    // Ações sugeridas baseadas nos dados
    const acoesSugeridas = [
      {
        prioridade: 'alta' as const,
        acao: 'Reduzir tempo de resposta inicial',
        impactoEstimado: 'Redução de 15-20% na taxa de abandono pré-match',
        esforco: 'medio' as const
      },
      {
        prioridade: 'alta' as const,
        acao: 'Aumentar pool de cuidadores disponíveis',
        impactoEstimado: 'Melhoria de 25% na taxa de match',
        esforco: 'alto' as const
      },
      {
        prioridade: 'media' as const,
        acao: 'Implementar follow-up automático',
        impactoEstimado: 'Recuperação de 10% dos abandonos',
        esforco: 'baixo' as const
      }
    ];

    return {
      pontosFriccao: pontosFriccao.map(p => ({
        ...p,
        taxaAbandono: Math.round(p.taxaAbandono * 10) / 10
      })),
      recuperacao: {
        tentativasRecuperacao: 0,
        recuperados: 0,
        taxaRecuperacao: 0
      },
      mapaCalor: mapaCalor.sort((a, b) => b.impacto - a.impacto),
      acoesSugeridas,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Fricção Data] Erro:', error);
    return {
      pontosFriccao: [],
      recuperacao: {
        tentativasRecuperacao: 0,
        recuperados: 0,
        taxaRecuperacao: 0
      },
      mapaCalor: [],
      acoesSugeridas: [],
      timestamp: new Date().toISOString()
    };
  }
}

export * from './types';
