/**
 * ═══════════════════════════════════════════════════════
 * ESPECIALIDADES - Cuidadores por especialidade
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { EspecialidadesCuidadores } from './types';

export async function getEspecialidadesCuidadores(): Promise<EspecialidadesCuidadores[]> {
  const db = getFirestore();

  try {
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const especialidadesMap = new Map<string, { total: number; ativos: number; disponiveis: number }>();

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      const especialidades = data.especialidades || ['geral'];
      const isAtivo = data.ativo !== false;

      especialidades.forEach((esp: string) => {
        if (!especialidadesMap.has(esp)) {
          especialidadesMap.set(esp, { total: 0, ativos: 0, disponiveis: 0 });
        }

        const entry = especialidadesMap.get(esp)!;
        entry.total++;

        if (isAtivo) {
          entry.ativos++;
          entry.disponiveis++; // Simplificado - pode ser refinado com jobs ativos
        }
      });
    });

    const result: EspecialidadesCuidadores[] = [];

    especialidadesMap.forEach((value, especialidade) => {
      result.push({
        especialidade,
        total: value.total,
        ativos: value.ativos,
        disponiveis: value.disponiveis
      });
    });

    return result.sort((a, b) => b.total - a.total);

  } catch (error) {
    console.error('[Especialidades Cuidadores] Erro:', error);
    return [];
  }
}
