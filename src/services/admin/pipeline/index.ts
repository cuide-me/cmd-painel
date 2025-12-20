/**
 * ═══════════════════════════════════════════════════════
 * PIPELINE - Funil Completo de Jobs
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  conversionRate: number;
  avgTimeInStage: number;
}

export interface BottleneckData {
  stage: string;
  dropRate: number;
  avgTime: number;
  count: number;
}

export interface PipelineData {
  stages: PipelineStage[];
  timeline: Array<{ date: string; jobs: number }>;
  totalRequests: number;
  negativePipeline: Array<{ stage: string; count: number }>;
  negativeFunnel: Array<{ from: string; to: string; count: number }>;
  overallConversionRate: number;
  avgDaysInPipeline: number;
  bottlenecks: BottleneckData[];
}

export async function getPipelineData(): Promise<PipelineData> {
  const db = getFirestore();

  try {
    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const statusCount = {
      pending: 0,
      open: 0,
      matched: 0,
      active: 0,
      completed: 0,
      cancelled: 0
    };

    let totalJobs = 0;
    const timeline: { [key: string]: number } = {};

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const status = data.status || 'pending';
      
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status as keyof typeof statusCount]++;
      }
      totalJobs++;

      // Timeline (últimos 30 dias)
      if (data.createdAt) {
        const createdAt = toDate(data.createdAt);
        if (createdAt) {
          const dateKey = createdAt.toISOString().split('T')[0];
          timeline[dateKey] = (timeline[dateKey] || 0) + 1;
        }
      }
    });

    // Construir stages
    const stages: PipelineStage[] = [
      {
        id: 'created',
        name: 'Criado',
        count: totalJobs,
        percentage: 100,
        conversionRate: 100,
        avgTimeInStage: 0
      },
      {
        id: 'open',
        name: 'Aberto',
        count: statusCount.open + statusCount.matched + statusCount.active + statusCount.completed,
        percentage: totalJobs > 0 ? ((statusCount.open + statusCount.matched + statusCount.active + statusCount.completed) / totalJobs) * 100 : 0,
        conversionRate: totalJobs > 0 ? ((statusCount.open + statusCount.matched + statusCount.active + statusCount.completed) / totalJobs) * 100 : 0,
        avgTimeInStage: 0
      },
      {
        id: 'matched',
        name: 'Match Realizado',
        count: statusCount.matched + statusCount.active + statusCount.completed,
        percentage: totalJobs > 0 ? ((statusCount.matched + statusCount.active + statusCount.completed) / totalJobs) * 100 : 0,
        conversionRate: totalJobs > 0 ? ((statusCount.matched + statusCount.active + statusCount.completed) / totalJobs) * 100 : 0,
        avgTimeInStage: 0
      },
      {
        id: 'active',
        name: 'Ativo',
        count: statusCount.active + statusCount.completed,
        percentage: totalJobs > 0 ? ((statusCount.active + statusCount.completed) / totalJobs) * 100 : 0,
        conversionRate: totalJobs > 0 ? ((statusCount.active + statusCount.completed) / totalJobs) * 100 : 0,
        avgTimeInStage: 0
      },
      {
        id: 'completed',
        name: 'Completado',
        count: statusCount.completed,
        percentage: totalJobs > 0 ? (statusCount.completed / totalJobs) * 100 : 0,
        conversionRate: totalJobs > 0 ? (statusCount.completed / totalJobs) * 100 : 0,
        avgTimeInStage: 0
      }
    ];

    // Negative pipeline (cancelados)
    const negativePipeline = [
      { stage: 'Cancelados', count: statusCount.cancelled }
    ];

    // Bottlenecks (etapas com maior drop rate)
    const bottlenecks: BottleneckData[] = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      const dropRate = current.count > 0 ? ((current.count - next.count) / current.count) * 100 : 0;

      if (dropRate > 20) {
        bottlenecks.push({
          stage: `${current.name} → ${next.name}`,
          dropRate: Math.round(dropRate * 10) / 10,
          avgTime: 0,
          count: current.count - next.count
        });
      }
    }

    // Timeline array
    const timelineArray = Object.entries(timeline)
      .map(([date, jobs]) => ({ date, jobs }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    const overallConversionRate = totalJobs > 0 ? (statusCount.completed / totalJobs) * 100 : 0;

    return {
      stages: stages.map(s => ({
        ...s,
        percentage: Math.round(s.percentage * 10) / 10,
        conversionRate: Math.round(s.conversionRate * 10) / 10
      })),
      timeline: timelineArray,
      totalRequests: totalJobs,
      negativePipeline,
      negativeFunnel: [],
      overallConversionRate: Math.round(overallConversionRate * 10) / 10,
      avgDaysInPipeline: 0,
      bottlenecks: bottlenecks.sort((a, b) => b.dropRate - a.dropRate)
    };

  } catch (error) {
    console.error('[Pipeline Data] Erro:', error);
    return {
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
}
