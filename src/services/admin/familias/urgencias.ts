/**
 * Famílias - Urgências e Alertas
 * Source: Firebase (jobs + feedbacks)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { Urgencias, UrgenciaDetalhada } from './types';

export async function getUrgencias(): Promise<Urgencias> {
  const db = getFirestore();
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Solicitações urgentes (> 48h sem match)
  const urgentesSnapshot = await db
    .collection('jobs')
    .where('status', '==', 'pendente')
    .where('createdAt', '<', fortyEightHoursAgo)
    .get();

  const solicitacoesUrgentes = urgentesSnapshot.size;

  // Famílias insatisfeitas (NPS < 6)
  const feedbacksSnapshot = await db
    .collection('feedbacks')
    .get();

  const familiasInsatisfeitasSet = new Set<string>();

  feedbacksSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const rating = data.rating || data.nota || 0;
    
    if (rating < 6 && data.userId) {
      familiasInsatisfeitasSet.add(data.userId);
    }
  });

  const familiasInsatisfeitas = familiasInsatisfeitasSet.size;

  // Detalhes das solicitações críticas (top 10 mais antigas)
  const solicitacoesCriticas: UrgenciaDetalhada[] = [];

  const sortedDocs = urgentesSnapshot.docs
    .sort((a: any, b: any) => {
      const aTime = toDate(a.data().createdAt)?.getTime() || 0;
      const bTime = toDate(b.data().createdAt)?.getTime() || 0;
      return aTime - bTime; // mais antigas primeiro
    })
    .slice(0, 10);

  for (const doc of sortedDocs) {
    const data = doc.data();
    const createdAt = toDate(data.createdAt);
    const tempoAberta = createdAt 
      ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      : 0;

    solicitacoesCriticas.push({
      id: doc.id,
      familiaId: data.clientId || 'N/A',
      especialidade: data.especialidade || 'Não especificada',
      tempoAberta,
      cidade: data.clientCity || data.cidade || 'N/A',
      estado: data.clientState || data.estado || 'N/A',
      motivo: tempoAberta > 72 ? 'Crítico: >72h sem match' : 'Urgente: >48h sem match'
    });
  }

  return {
    solicitacoesUrgentes,
    familiasInsatisfeitas,
    solicitacoesCriticas
  };
}
