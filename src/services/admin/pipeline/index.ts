/**
 * PIPELINE SERVICE - STUB TEMPORÁRIO
 * TODO: Implementar pipeline completo conforme roadmap
 */

export interface PipelineData {
  success: boolean;
  message: string;
  data: {
    pipeline: any[];
    metrics: {
      total: number;
      emAndamento: number;
      concluidos: number;
    };
  };
  stages: Array<{
    id: string;
    name: string;
    count: number;
    percentage: number;
    conversionRate: number;
    avgTimeInStage: number;
  }>;
  timeline: any[];
  totalRequests: number;
  negativePipeline: any[];
  negativeFunnel: any[];
  overallConversionRate: number;
  avgDaysInPipeline: number;
  bottlenecks: any[];
}

export async function getPipelineData(): Promise<PipelineData> {
  return {
    success: true,
    message: 'Pipeline será implementado nas próximas fases',
    data: {
      pipeline: [],
      metrics: {
        total: 0,
        emAndamento: 0,
        concluidos: 0
      }
    },
    stages: [],
    timeline: [],
    totalRequests: 0,
    negativePipeline: [],
    negativeFunnel: [],
    overallConversionRate: 0,
    avgDaysInPipeline: 0,
    bottlenecks: []
  };
}
