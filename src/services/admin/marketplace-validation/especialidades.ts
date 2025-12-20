/**
 * ═══════════════════════════════════════════════════════
 * ESPECIALIDADES - Gap Analysis
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { EspecialidadeBalance } from './types';

export async function getEspecialidadesBalance(): Promise<EspecialidadeBalance[]> {
  const db = getFirestore();

  try {
    // Buscar jobs em aberto para ver demanda por especialidade
    const jobsSnap = await db
      .collection('jobs')
      .where('status', 'in', ['pending', 'open'])
      .get();

    const demandaPorEspecialidade = new Map<string, number>();

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const tipo = data.tipo || 'geral';
      demandaPorEspecialidade.set(tipo, (demandaPorEspecialidade.get(tipo) || 0) + 1);
    });

    // Buscar cuidadores para ver oferta por especialidade
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const ofertaPorEspecialidade = new Map<string, number>();

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      if (data.ativo === false) return;

      const especialidades = data.especialidades || ['geral'];
      especialidades.forEach((esp: string) => {
        ofertaPorEspecialidade.set(esp, (ofertaPorEspecialidade.get(esp) || 0) + 1);
      });
    });

    // Consolidar
    const todasEspecialidades = new Set([
      ...demandaPorEspecialidade.keys(),
      ...ofertaPorEspecialidade.keys()
    ]);

    const result: EspecialidadeBalance[] = [];

    todasEspecialidades.forEach(esp => {
      const demanda = demandaPorEspecialidade.get(esp) || 0;
      const oferta = ofertaPorEspecialidade.get(esp) || 0;
      const gap = demanda - oferta;

      let status: 'superavit' | 'equilibrado' | 'deficit';
      if (gap < -3) {
        status = 'superavit'; // mais oferta que demanda
      } else if (gap <= 3) {
        status = 'equilibrado';
      } else {
        status = 'deficit'; // mais demanda que oferta
      }

      result.push({
        especialidade: esp,
        demanda,
        oferta,
        gap,
        status
      });
    });

    // Ordenar por gap absoluto (maiores gaps primeiro)
    return result.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  } catch (error) {
    console.error('[Especialidades] Erro:', error);
    return [];
  }
}
