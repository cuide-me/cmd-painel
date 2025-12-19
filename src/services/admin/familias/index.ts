/**
 * Famílias - Main Index
 * Aggregates all family/demand metrics
 */

import { getFamiliasOverview } from './overview';
import { getJornadaFamilias } from './jornada';
import { getUrgencias } from './urgencias';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { FamiliasData, SolicitacoesPorEstado, SolicitacoesPorEspecialidade } from './types';

export async function getFamiliasData(): Promise<FamiliasData> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Executar queries principais em paralelo
  const [overview, jornada, urgencias] = await Promise.all([
    getFamiliasOverview(),
    getJornadaFamilias(),
    getUrgencias()
  ]);

  // Solicitações por estado
  const jobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const estadosCount = {
    pendente: 0,
    em_andamento: 0,
    concluido: 0,
    cancelado: 0
  };

  const temposPorEstado = {
    pendente: [] as number[],
    em_andamento: [] as number[],
    concluido: [] as number[],
    cancelado: [] as number[]
  };

  jobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const status = data.status as keyof typeof estadosCount;
    
    if (status in estadosCount) {
      estadosCount[status]++;

      // Calcular tempo no estado atual (simplificado)
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      const updatedAt = data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now());
      const tempoHoras = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      temposPorEstado[status].push(tempoHoras);
    }
  });

  const total = jobsSnapshot.size;

  const solicitacoesPorEstado: SolicitacoesPorEstado[] = Object.entries(estadosCount).map(([estado, count]) => ({
    estado: estado as any,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
    tempoMedioNesseEstado: temposPorEstado[estado as keyof typeof temposPorEstado].length > 0
      ? temposPorEstado[estado as keyof typeof temposPorEstado].reduce((a, b) => a + b, 0) / 
        temposPorEstado[estado as keyof typeof temposPorEstado].length
      : 0
  }));

  // Solicitações por especialidade
  const especialidadesMap = new Map<string, {
    abertas: number;
    concluidas: number;
    tempos: number[];
  }>();

  jobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const esp = data.especialidade || 'Não especificada';

    if (!especialidadesMap.has(esp)) {
      especialidadesMap.set(esp, { abertas: 0, concluidas: 0, tempos: [] });
    }

    const espData = especialidadesMap.get(esp)!;

    if (data.status === 'pendente' || data.status === 'em_andamento') {
      espData.abertas++;
    } else if (data.status === 'concluido') {
      espData.concluidas++;
    }

    if (data.firstMatchAt && data.createdAt) {
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      const matchAt = data.firstMatchAt?.toDate?.() || new Date(data.firstMatchAt);
      const tempoHoras = (matchAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      espData.tempos.push(tempoHoras);
    }
  });

  const solicitacoesPorEspecialidade: SolicitacoesPorEspecialidade[] = Array.from(especialidadesMap.entries())
    .map(([especialidade, data]) => ({
      especialidade,
      solicitacoesAbertas: data.abertas,
      solicitacoesConcluidas: data.concluidas,
      tempoMedioMatch: data.tempos.length > 0 
        ? data.tempos.reduce((a, b) => a + b, 0) / data.tempos.length 
        : 0,
      taxaSucesso: (data.abertas + data.concluidas) > 0
        ? (data.concluidas / (data.abertas + data.concluidas)) * 100
        : 0
    }))
    .sort((a, b) => b.solicitacoesAbertas - a.solicitacoesAbertas);

  return {
    overview,
    solicitacoesPorEstado,
    solicitacoesPorEspecialidade,
    jornada,
    urgencias,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
