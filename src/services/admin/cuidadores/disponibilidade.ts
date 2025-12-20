/**
 * ═══════════════════════════════════════════════════════
 * DISPONIBILIDADE - Cuidadores disponíveis
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { DisponibilidadeCuidador } from './types';

export async function getDisponibilidadeCuidadores(): Promise<DisponibilidadeCuidador> {
  const db = getFirestore();

  try {
    // Buscar todos os cuidadores
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    let total = cuidadoresSnap.size;
    let disponiveis = 0;
    let inativos = 0;

    const cuidadorIds: string[] = [];

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      cuidadorIds.push(doc.id);

      if (data.ativo === false) {
        inativos++;
      } else {
        disponiveis++; // Considerado disponível se não está explicitamente inativo
      }
    });

    // Buscar jobs ativos para ver quantos estão ocupados
    let emJob = 0;

    if (cuidadorIds.length > 0) {
      const batchSize = 10;
      const cuidadoresEmJob = new Set<string>();

      for (let i = 0; i < cuidadorIds.length; i += batchSize) {
        const batch = cuidadorIds.slice(i, i + batchSize);
        const jobsSnap = await db
          .collection('jobs')
          .where('profissionalId', 'in', batch)
          .where('status', '==', 'active')
          .get();

        jobsSnap.forEach(doc => {
          const data = doc.data();
          if (data.profissionalId) {
            cuidadoresEmJob.add(data.profissionalId);
          }
        });
      }

      emJob = cuidadoresEmJob.size;
      disponiveis = disponiveis - emJob; // Ajustar disponíveis
    }

    const taxaDisponibilidade = total > 0 ? (disponiveis / total) * 100 : 0;

    return {
      total,
      disponiveis: Math.max(0, disponiveis),
      emJob,
      inativos,
      taxaDisponibilidade: Math.round(taxaDisponibilidade * 10) / 10
    };

  } catch (error) {
    console.error('[Disponibilidade Cuidadores] Erro:', error);
    return {
      total: 0,
      disponiveis: 0,
      emJob: 0,
      inativos: 0,
      taxaDisponibilidade: 0
    };
  }
}
