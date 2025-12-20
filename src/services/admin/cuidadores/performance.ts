/**
 * ═══════════════════════════════════════════════════════
 * TOP PERFORMERS - Melhores cuidadores
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { PerformanceCuidador, TopPerformers } from './types';

export async function getTopPerformers(): Promise<TopPerformers> {
  const db = getFirestore();

  try {
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const performances: PerformanceCuidador[] = [];
    const cuidadorIds: string[] = [];
    const cuidadoresMap = new Map<string, { nome: string }>();

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      cuidadorIds.push(doc.id);
      cuidadoresMap.set(doc.id, { nome: data.nome || 'Sem nome' });
    });

    // Buscar jobs por cuidador
    if (cuidadorIds.length > 0) {
      const batchSize = 10;
      const jobsMap = new Map<string, { total: number; completados: number }>();

      for (let i = 0; i < cuidadorIds.length; i += batchSize) {
        const batch = cuidadorIds.slice(i, i + batchSize);
        const jobsSnap = await db
          .collection('jobs')
          .where('profissionalId', 'in', batch)
          .get();

        jobsSnap.forEach(doc => {
          const data = doc.data();
          const profId = data.profissionalId;

          if (!jobsMap.has(profId)) {
            jobsMap.set(profId, { total: 0, completados: 0 });
          }

          const entry = jobsMap.get(profId)!;
          entry.total++;

          if (data.status === 'completed') {
            entry.completados++;
          }
        });
      }

      // Buscar ratings
      const ratingsSnap = await db.collection('ratings').get();
      const ratingsMap = new Map<string, { sum: number; count: number }>();

      ratingsSnap.forEach(doc => {
        const data = doc.data();
        const profId = data.profissionalId;

        if (profId && data.rating) {
          if (!ratingsMap.has(profId)) {
            ratingsMap.set(profId, { sum: 0, count: 0 });
          }
          const entry = ratingsMap.get(profId)!;
          entry.sum += data.rating;
          entry.count++;
        }
      });

      // Montar lista de performance
      jobsMap.forEach((jobs, cuidadorId) => {
        const cuidador = cuidadoresMap.get(cuidadorId);
        if (!cuidador || jobs.total === 0) return;

        const rating = ratingsMap.get(cuidadorId);
        const ratingMedio = rating ? rating.sum / rating.count : 0;
        const taxaSucesso = (jobs.completados / jobs.total) * 100;

        performances.push({
          cuidadorId,
          nome: cuidador.nome,
          totalJobs: jobs.total,
          jobsCompletados: jobs.completados,
          taxaSucesso: Math.round(taxaSucesso * 10) / 10,
          ratingMedio: Math.round(ratingMedio * 10) / 10,
          tempoMedioResposta: 0 // Simplificado
        });
      });
    }

    // Ordenar por total de jobs completados
    performances.sort((a, b) => b.jobsCompletados - a.jobsCompletados);

    return {
      top10: performances.slice(0, 10)
    };

  } catch (error) {
    console.error('[Top Performers] Erro:', error);
    return {
      top10: []
    };
  }
}
