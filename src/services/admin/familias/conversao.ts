/**
 * ═══════════════════════════════════════════════════════
 * CONVERSÃO - Funil de ativação
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { ConversaoFamilia } from './types';

export async function getConversaoFamilias(): Promise<ConversaoFamilia> {
  const db = getFirestore();

  try {
    // Total de cadastros
    const familiasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();

    const cadastros = familiasSnap.size;
    const familiaIds: string[] = [];
    familiasSnap.forEach(doc => familiaIds.push(doc.id));

    let primeiroJob = 0;
    let jobAtivo = 0;
    let jobCompletado = 0;

    if (familiaIds.length > 0) {
      // Buscar jobs em lotes
      const batchSize = 10;
      const familiasComJob = new Set<string>();
      const familiasComAtivo = new Set<string>();
      const familiasComCompletado = new Set<string>();

      for (let i = 0; i < familiaIds.length; i += batchSize) {
        const batch = familiaIds.slice(i, i + batchSize);
        const jobsSnap = await db
          .collection('jobs')
          .where('userId', 'in', batch)
          .get();

        jobsSnap.forEach(doc => {
          const data = doc.data();
          const userId = data.userId;

          familiasComJob.add(userId);

          if (data.status === 'active') {
            familiasComAtivo.add(userId);
          }

          if (data.status === 'completed') {
            familiasComCompletado.add(userId);
          }
        });
      }

      primeiroJob = familiasComJob.size;
      jobAtivo = familiasComAtivo.size;
      jobCompletado = familiasComCompletado.size;
    }

    // Calcular taxas
    const taxaCadastroParaJob = cadastros > 0 ? (primeiroJob / cadastros) * 100 : 0;
    const taxaJobParaAtivo = primeiroJob > 0 ? (jobAtivo / primeiroJob) * 100 : 0;
    const taxaAtivacao = cadastros > 0 ? (jobAtivo / cadastros) * 100 : 0;

    return {
      cadastros,
      primeiroJob,
      jobAtivo,
      jobCompletado,
      taxaCadastroParaJob: Math.round(taxaCadastroParaJob * 10) / 10,
      taxaJobParaAtivo: Math.round(taxaJobParaAtivo * 10) / 10,
      taxaAtivacao: Math.round(taxaAtivacao * 10) / 10
    };

  } catch (error) {
    console.error('[Conversão Famílias] Erro:', error);
    return {
      cadastros: 0,
      primeiroJob: 0,
      jobAtivo: 0,
      jobCompletado: 0,
      taxaCadastroParaJob: 0,
      taxaJobParaAtivo: 0,
      taxaAtivacao: 0
    };
  }
}
