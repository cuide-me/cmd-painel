/**
 * ═══════════════════════════════════════════════════════
 * ABANDONO - Dropout Analysis
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { AbandonoFamilia } from './types';

export async function getAbandonoFamilias(): Promise<AbandonoFamilia> {
  const db = getFirestore();

  try {
    // Total de famílias cadastradas
    const familiasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();

    const totalFamilias = familiasSnap.size;
    const familiaIds: string[] = [];
    familiasSnap.forEach(doc => familiaIds.push(doc.id));

    let familiasComJob = 0;
    let familiasComMatch = 0;
    let jobsCancelados = 0;

    if (familiaIds.length > 0) {
      const batchSize = 10;
      const idsComJob = new Set<string>();
      const idsComMatch = new Set<string>();

      for (let i = 0; i < familiaIds.length; i += batchSize) {
        const batch = familiaIds.slice(i, i + batchSize);
        const jobsSnap = await db
          .collection('jobs')
          .where('userId', 'in', batch)
          .get();

        jobsSnap.forEach(doc => {
          const data = doc.data();
          const userId = data.userId;

          idsComJob.add(userId);

          // Match = status matched/active/completed
          if (data.status === 'matched' || data.status === 'active' || data.status === 'completed') {
            idsComMatch.add(userId);
          }

          // Jobs cancelados
          if (data.status === 'cancelled') {
            jobsCancelados++;
          }
        });
      }

      familiasComJob = idsComJob.size;
      familiasComMatch = idsComMatch.size;
    }

    // Calcular abandonos
    const abandonoPreJob = totalFamilias - familiasComJob;
    const abandonoPosJob = familiasComJob - familiasComMatch;
    const abandonoPosMatch = jobsCancelados;
    const taxaAbandonoTotal = totalFamilias > 0 
      ? ((abandonoPreJob + abandonoPosJob + abandonoPosMatch) / totalFamilias) * 100
      : 0;

    return {
      abandonoPreJob,
      abandonoPosJob,
      abandonoPosMatch,
      taxaAbandonoTotal: Math.round(taxaAbandonoTotal * 10) / 10
    };

  } catch (error) {
    console.error('[Abandono Famílias] Erro:', error);
    return {
      abandonoPreJob: 0,
      abandonoPosJob: 0,
      abandonoPosMatch: 0,
      taxaAbandonoTotal: 0
    };
  }
}
