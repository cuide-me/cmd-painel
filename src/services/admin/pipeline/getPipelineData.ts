import { getFirestore } from 'firebase-admin/firestore';
import type { PipelineData, PipelineStage, PipelineRequest, PipelineStatusBreakdown } from './types';
import { PIPELINE_STAGES, STAGE_NAMES } from './types';

/**
 * Mapeia status do Firestore para estágios do pipeline
 */
function mapStatusToStage(status: string): string {
  const statusMap: Record<string, string> = {
    pending: PIPELINE_STAGES.NEW_REQUEST,
    aguardando_proposta: PIPELINE_STAGES.NEW_REQUEST,
    contacted: PIPELINE_STAGES.FIRST_CONTACT,
    contact_made: PIPELINE_STAGES.FIRST_CONTACT,
    pain_understood: PIPELINE_STAGES.NEEDS_MAPPED,
    needs_mapped: PIPELINE_STAGES.NEEDS_MAPPED,
    match_started: PIPELINE_STAGES.MATCH_IN_PROGRESS,
    match_in_progress: PIPELINE_STAGES.MATCH_IN_PROGRESS,
    proposal_sent: PIPELINE_STAGES.PROPOSAL_SENT,
    proposta_enviada: PIPELINE_STAGES.PROPOSAL_SENT,
    proposal_accepted: PIPELINE_STAGES.PROPOSAL_ACCEPTED,
    proposta_aceita: PIPELINE_STAGES.PROPOSAL_ACCEPTED,
    accepted: PIPELINE_STAGES.PROPOSAL_ACCEPTED,
    paid: PIPELINE_STAGES.PAYMENT_CONFIRMED,
    payment_confirmed: PIPELINE_STAGES.PAYMENT_CONFIRMED,
    pagamento_confirmado: PIPELINE_STAGES.PAYMENT_CONFIRMED,
    in_service: PIPELINE_STAGES.SERVICE_STARTED,
    started: PIPELINE_STAGES.SERVICE_STARTED,
    em_andamento: PIPELINE_STAGES.SERVICE_STARTED,
  };

  return statusMap[status] || PIPELINE_STAGES.NEW_REQUEST;
}

/**
 * Verifica se o status é "negativo" (não avança no funil)
 */
function isNegativeStatus(status: string): boolean {
  const negativeStatuses = [
    'proposta_recusada',
    'proposal_rejected',
    'rejected',
    'cancelado',
    'cancelled',
    'canceled',
    'recusado',
    'declined',
    'proposta_expirada',
    'expired',
  ];
  return negativeStatuses.includes(status);
}

/**
 * Categoriza status negativo
 */
function getNegativeCategory(status: string): 'rejected' | 'cancelled' | 'declined' | 'expired' | null {
  if (status.includes('recusada') || status.includes('rejected')) return 'rejected';
  if (status.includes('cancelado') || status.includes('cancelled') || status.includes('canceled')) return 'cancelled';
  if (status.includes('recusado') || status.includes('declined')) return 'declined';
  if (status.includes('expirada') || status.includes('expired')) return 'expired';
  return null;
}

/**
 * Calcula tempo em horas entre duas datas
 */
function calculateHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

/**
 * Busca dados do pipeline de contratação
 */
export async function getPipelineData(): Promise<PipelineData> {
  const db = getFirestore();

  try {
    // Buscar todas as solicitações (requests + jobs)
    const requestsSnap = await db
      .collection('requests')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const now = new Date();
    const allRequests: PipelineRequest[] = [];
    const stageGroups: Record<string, PipelineRequest[]> = {};
    const negativeRequests: PipelineRequest[] = [];
    
    const statusBreakdown: PipelineStatusBreakdown = {
      rejected: 0,
      cancelled: 0,
      declined: 0,
      expired: 0,
    };

    // Inicializar grupos
    Object.values(PIPELINE_STAGES).forEach(stage => {
      stageGroups[stage] = [];
    });

    // Processar requests
    requestsSnap.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date();
      const updatedAt = data.updatedAt?.toDate() || createdAt;
      const originalStatus = data.status || 'pending';

      const request: PipelineRequest = {
        id: doc.id,
        familyName: data.familyName || data.userName || 'Sem nome',
        stage: '',
        createdAt,
        updatedAt,
        timeInStage: calculateHours(updatedAt, now),
        city: data.city || data.location,
        careType: data.careType || data.serviceType,
        status: originalStatus,
      };

      // Separar negativos
      if (isNegativeStatus(originalStatus)) {
        negativeRequests.push(request);
        const category = getNegativeCategory(originalStatus);
        if (category) {
          statusBreakdown[category]++;
        }
      } else {
        const stage = mapStatusToStage(originalStatus);
        request.stage = stage;
        allRequests.push(request);
        stageGroups[stage].push(request);
      }
    });

    // Processar jobs
    jobsSnap.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date();
      const updatedAt = data.updatedAt?.toDate() || createdAt;
      const originalStatus = data.status || 'aguardando_proposta';

      const request: PipelineRequest = {
        id: doc.id,
        familyName: data.clientName || data.title || 'Sem nome',
        stage: '',
        createdAt,
        updatedAt,
        timeInStage: calculateHours(updatedAt, now),
        city: data.location || data.city,
        careType: data.serviceType || data.type,
        status: originalStatus,
      };

      // Separar negativos
      if (isNegativeStatus(originalStatus)) {
        negativeRequests.push(request);
        const category = getNegativeCategory(originalStatus);
        if (category) {
          statusBreakdown[category]++;
        }
      } else {
        const stage = mapStatusToStage(originalStatus);
        request.stage = stage;
        allRequests.push(request);
        stageGroups[stage].push(request);
      }
    });

    // Calcular estatísticas por estágio
    const stages: PipelineStage[] = Object.entries(STAGE_NAMES).map(
      ([stageId, stageName], index) => {
        const requests = stageGroups[stageId] || [];
        const count = requests.length;

        // Calcular tempo médio no estágio
        const avgTime = count > 0 ? requests.reduce((sum, r) => sum + r.timeInStage, 0) / count : 0;

        // Calcular taxa de conversão (comparado com estágio anterior)
        const previousStageCount =
          index > 0
            ? stageGroups[Object.keys(STAGE_NAMES)[index - 1]]?.length || 1
            : allRequests.length || 1;

        const percentage = (count / previousStageCount) * 100;

        return {
          id: stageId,
          name: stageName,
          count,
          percentage: Math.min(percentage, 100),
          avgTimeInStage: avgTime,
          requests: requests.slice(0, 20), // Limitar para performance
        };
      }
    );

    // Criar funil negativo
    const negativeFunnel = [
      {
        id: 'rejected',
        name: '❌ Propostas Rejeitadas',
        count: statusBreakdown.rejected,
        percentage: (statusBreakdown.rejected / (allRequests.length + negativeRequests.length)) * 100,
        requests: negativeRequests.filter(r => getNegativeCategory(r.status!) === 'rejected').slice(0, 20),
      },
      {
        id: 'cancelled',
        name: '🚫 Jobs Cancelados',
        count: statusBreakdown.cancelled,
        percentage: (statusBreakdown.cancelled / (allRequests.length + negativeRequests.length)) * 100,
        requests: negativeRequests.filter(r => getNegativeCategory(r.status!) === 'cancelled').slice(0, 20),
      },
      {
        id: 'declined',
        name: '👎 Recusados pelo Profissional',
        count: statusBreakdown.declined,
        percentage: (statusBreakdown.declined / (allRequests.length + negativeRequests.length)) * 100,
        requests: negativeRequests.filter(r => getNegativeCategory(r.status!) === 'declined').slice(0, 20),
      },
      {
        id: 'expired',
        name: '⏰ Propostas Expiradas',
        count: statusBreakdown.expired,
        percentage: (statusBreakdown.expired / (allRequests.length + negativeRequests.length)) * 100,
        requests: negativeRequests.filter(r => getNegativeCategory(r.status!) === 'expired').slice(0, 20),
      },
    ].filter(item => item.count > 0); // Mostrar apenas categorias com dados

    // Análise de ciclo (tempo acumulado e conversão)
    const cycleAnalysis = stages.map((stage, index) => {
      // Tempo acumulado até chegar nesta etapa
      const avgTimeToReach = stages
        .slice(0, index + 1)
        .reduce((sum, s) => sum + s.avgTimeInStage, 0);

      // Taxa de conversão para próxima etapa
      const nextStage = stages[index + 1];
      const conversionRate = nextStage 
        ? (nextStage.count / (stage.count || 1)) * 100 
        : 100;
      
      const dropoffRate = 100 - conversionRate;

      return {
        stageName: stage.name,
        avgTimeInStage: stage.avgTimeInStage,
        avgTimeToReach,
        conversionRate,
        dropoffRate,
      };
    });

    // Identificar gargalos (estágios com > 48h de média)
    const bottlenecks = stages
      .filter(s => s.avgTimeInStage > 48 && s.count > 0)
      .map(s => ({
        stage: s.name,
        count: s.count,
        avgTime: s.avgTimeInStage,
      }))
      .sort((a, b) => b.avgTime - a.avgTime);

    // Taxa de conversão geral (do início ao fim)
    const totalRequests = stages[0]?.count || 1;
    const completedRequests = stages[stages.length - 1]?.count || 0;
    const overallConversionRate = (completedRequests / totalRequests) * 100;

    return {
      stages,
      totalRequests: allRequests.length + negativeRequests.length,
      overallConversionRate,
      bottlenecks,
      statusBreakdown,
      negativeFunnel,
      cycleAnalysis,
    };
  } catch (error) {
    console.error('[Pipeline] Erro ao buscar dados:', error);

    // Retornar dados vazios em caso de erro
    return {
      stages: Object.entries(STAGE_NAMES).map(([id, name]) => ({
        id,
        name,
        count: 0,
        percentage: 0,
        avgTimeInStage: 0,
        requests: [],
      })),
      totalRequests: 0,
      overallConversionRate: 0,
      bottlenecks: [],
      statusBreakdown: {
        rejected: 0,
        cancelled: 0,
        declined: 0,
        expired: 0,
      },
      negativeFunnel: [],
      cycleAnalysis: [],
    };
  }
}
