/**
 * ═══════════════════════════════════════════════════════
 * RETENÇÃO - Novos vs Ativos vs Churn
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { RetencaoCuidadores } from './types';

export async function getRetencaoCuidadores(): Promise<RetencaoCuidadores> {
  const db = getFirestore();

  try {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total de cuidadores
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    let cuidadoresAtivos = 0;
    let cuidadoresInativos = 0;
    let novosCuidadores30d = 0;

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();

      // Novos últimos 30 dias
      if (data.createdAt) {
        const createdAt = toDate(data.createdAt);
        if (createdAt && createdAt >= last30Days) {
          novosCuidadores30d++;
        }
      }

      // Ativos vs Inativos
      if (data.ativo === false) {
        cuidadoresInativos++;
      } else {
        cuidadoresAtivos++;
      }
    });

    const total = cuidadoresSnap.size;
    const taxaRetencao = total > 0 ? (cuidadoresAtivos / total) * 100 : 0;
    const churn30d = total > 0 ? (cuidadoresInativos / total) * 100 : 0;

    return {
      novosCuidadores30d,
      cuidadoresAtivos,
      cuidadoresInativos,
      taxaRetencao: Math.round(taxaRetencao * 10) / 10,
      churn30d: Math.round(churn30d * 10) / 10
    };

  } catch (error) {
    console.error('[Retenção Cuidadores] Erro:', error);
    return {
      novosCuidadores30d: 0,
      cuidadoresAtivos: 0,
      cuidadoresInativos: 0,
      taxaRetencao: 0,
      churn30d: 0
    };
  }
}
