/**
 * ═══════════════════════════════════════════════════════
 * JORNADA - Etapas da família
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { JornadaFamilia } from './types';

export async function getJornadaFamilias(): Promise<JornadaFamilia[]> {
  const db = getFirestore();

  try {
    // Buscar todas as famílias
    const familiasSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();

    const etapas = {
      'Cadastro Iniciado': 0,
      'Perfil Completo': 0,
      'Primeiro Job Criado': 0,
      'Match Realizado': 0,
      'Serviço Ativo': 0,
      'Serviço Completado': 0
    };

    const tempos: { [key: string]: number[] } = {
      'Cadastro Iniciado': [],
      'Perfil Completo': [],
      'Primeiro Job Criado': [],
      'Match Realizado': [],
      'Serviço Ativo': [],
      'Serviço Completado': []
    };

    const familiaIds: string[] = [];

    familiasSnap.forEach(doc => {
      const data = doc.data();
      familiaIds.push(doc.id);
      
      etapas['Cadastro Iniciado']++;
      
      // Perfil completo (tem nome e telefone)
      if (data.nome && data.telefone) {
        etapas['Perfil Completo']++;
      }
    });

    // Buscar jobs das famílias
    if (familiaIds.length > 0) {
      // Firestore limita 'in' a 10 itens, então fazer em lotes
      const batchSize = 10;
      for (let i = 0; i < familiaIds.length; i += batchSize) {
        const batch = familiaIds.slice(i, i + batchSize);
        const jobsSnap = await db
          .collection('jobs')
          .where('userId', 'in', batch)
          .get();

        jobsSnap.forEach(doc => {
          const data = doc.data();
          
          // Primeiro job criado
          etapas['Primeiro Job Criado']++;
          
          // Match realizado
          if (data.status === 'matched' || data.status === 'active' || data.status === 'completed') {
            etapas['Match Realizado']++;
          }
          
          // Serviço ativo
          if (data.status === 'active') {
            etapas['Serviço Ativo']++;
          }
          
          // Serviço completado
          if (data.status === 'completed') {
            etapas['Serviço Completado']++;
          }
        });
      }
    }

    // Calcular percentuais
    const total = etapas['Cadastro Iniciado'];
    const resultado: JornadaFamilia[] = Object.entries(etapas).map(([etapa, count]) => ({
      etapa,
      total: count,
      percentual: total > 0 ? Math.round((count / total) * 100) : 0,
      tempoMedio: 0 // Simplificado - pode ser calculado com timestamps
    }));

    return resultado;

  } catch (error) {
    console.error('[Jornada Famílias] Erro:', error);
    return [];
  }
}
