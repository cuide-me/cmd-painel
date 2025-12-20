/**
 * ═══════════════════════════════════════════════════════
 * CARD 2: OFERTA (Cuidadores)
 * ═══════════════════════════════════════════════════════
 * Fonte: Firebase users (perfil: profissional)
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { OfertaCard } from './types';

export async function getOfertaCard(): Promise<OfertaCard> {
  const db = getFirestore();
  
  try {
    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

    // Buscar todos os cuidadores (perfil: profissional)
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const totalCuidadores = cuidadoresSnap.size;

    // Contar novos cuidadores (últimos 30 dias)
    let novosCuidadores30d = 0;
    const cuidadorIds: string[] = [];
    let cuidadoresDisponiveis = 0;

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      cuidadorIds.push(doc.id);

      if (data.createdAt) {
        const createdDate = toDate(data.createdAt);
        if (createdDate && createdDate.getTime() >= thirtyDaysAgoTimestamp) {
          novosCuidadores30d++;
        }
      }

      // Contar disponibilidade (simplificado: ativo = disponível)
      if (data.ativo !== false) {
        cuidadoresDisponiveis++;
      }
    });

    // Buscar jobs para calcular taxa de ativação
    const jobsSnap = await db
      .collection('jobs')
      .get();

    const cuidadoresAtivados = new Set<string>();

    jobsSnap.forEach(jobDoc => {
      const jobData = jobDoc.data();
      
      // Verificar se tem professionalId (job aceito/ativo)
      if (jobData.professionalId && cuidadorIds.includes(jobData.professionalId)) {
        cuidadoresAtivados.add(jobData.professionalId);
      }

      // Verificar matches aceitos
      if (jobData.matches && Array.isArray(jobData.matches)) {
        jobData.matches.forEach((match: any) => {
          if (match.status === 'accepted' && cuidadorIds.includes(match.professionalId)) {
            cuidadoresAtivados.add(match.professionalId);
          }
        });
      }
    });

    const taxaAtivacao = totalCuidadores > 0
      ? (cuidadoresAtivados.size / totalCuidadores) * 100
      : 0;

    const disponibilidadeMedia = totalCuidadores > 0
      ? (cuidadoresDisponiveis / totalCuidadores) * 100
      : 0;

    // Determinar trend
    const trend = novosCuidadores30d > 0 ? 'up' : 'stable';

    return {
      totalCuidadores,
      novosCuidadores30d,
      taxaAtivacao: Math.round(taxaAtivacao * 10) / 10,
      disponibilidadeMedia: Math.round(disponibilidadeMedia * 10) / 10,
      trend
    };

  } catch (error) {
    console.error('[Oferta] Erro ao buscar dados:', error);
    return {
      totalCuidadores: 0,
      novosCuidadores30d: 0,
      taxaAtivacao: 0,
      disponibilidadeMedia: 0,
      trend: 'stable'
    };
  }
}
