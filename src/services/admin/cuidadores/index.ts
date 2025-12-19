/**
 * Cuidadores - Main Index
 * Aggregates all caregiver/supply metrics
 */

import { getCuidadoresOverview } from './overview';
import { getPerformanceCuidadores } from './performance';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { 
  CuidadoresData, 
  DistribuicaoCuidadores,
  EngajamentoCuidadores,
  ProblemasCuidadores,
  AlertaCuidador
} from './types';

export async function getCuidadoresData(): Promise<CuidadoresData> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [overview, performance] = await Promise.all([
    getCuidadoresOverview(),
    getPerformanceCuidadores()
  ]);

  // Distribuição
  const cuidadoresSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .get();

  const especialidadesMap = new Map();
  const cidadesMap = new Map();

  cuidadoresSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const esp = data.especialidade || 'Não especificada';
    const cidade = data.cidade || 'N/A';
    const estado = data.estado || 'XX';

    // Especialidades
    if (!especialidadesMap.has(esp)) {
      especialidadesMap.set(esp, { quantidade: 0, ativos: 0 });
    }
    const espData = especialidadesMap.get(esp);
    espData.quantidade++;
    if (data.ativo) espData.ativos++;

    // Cidades
    const cidadeKey = `${cidade}-${estado}`;
    if (!cidadesMap.has(cidadeKey)) {
      cidadesMap.set(cidadeKey, { cidade, estado, quantidade: 0 });
    }
    cidadesMap.get(cidadeKey).quantidade++;
  });

  const distribuicao: DistribuicaoCuidadores = {
    porEspecialidade: Array.from(especialidadesMap.entries()).map(([esp, data]) => ({
      especialidade: esp,
      quantidade: data.quantidade,
      ativos: data.ativos,
      comAtendimentoAtivo: 0,
      percentualDoTotal: (data.quantidade / cuidadoresSnapshot.size) * 100
    })),
    porCidade: Array.from(cidadesMap.entries())
      .map(([_, data]) => ({
        cidade: data.cidade,
        estado: data.estado,
        quantidade: data.quantidade,
        demandaLocal: 0,
        ratio: 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10),
    porExperiencia: [] // TODO: implementar quando tivermos dados de experiência
  };

  // Engajamento
  const engajamento: EngajamentoCuidadores = {
    ultimaSemana: {
      loginsUnicos: 0,
      solicitacoesVisualizadas: 0,
      solicitacoesAceitas: 0,
      taxaConversao: 0
    },
    ultimoMes: {
      loginsUnicos: 0,
      solicitacoesVisualizadas: 0,
      solicitacoesAceitas: 0,
      taxaConversao: 0
    },
    churnRisk: 0
  };

  // Problemas
  const abandonosSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'cancelado')
    .where('specialistId', '!=', null)
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  const problemas: ProblemasCuidadores = {
    abandono: {
      totalAbandonos: abandonosSnapshot.size,
      abandonoPosAceite: abandonosSnapshot.size,
      abandonoPosInicio: 0,
      taxaAbandonoGeral: 0
    },
    baixaPerformance: {
      cuidadoresComNpsBaixo: 0,
      cuidadoresComBaixaAceitacao: 0,
      cuidadoresComBaixaConclusao: 0
    },
    inativos: {
      inativos7d: 0,
      inativos30d: 0,
      inativos90d: 0
    },
    alertas: []
  };

  return {
    overview,
    distribuicao,
    performance,
    engajamento,
    problemas,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
