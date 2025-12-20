/**
 * ═══════════════════════════════════════════════════════
 * GEOGRÁFICO - Cobertura por Cidade
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { CoberturasGeograficas } from './types';

export async function getCoberturaGeografica(): Promise<CoberturasGeograficas[]> {
  const db = getFirestore();

  try {
    // Demanda por cidade (jobs em aberto)
    const jobsSnap = await db
      .collection('jobs')
      .where('status', 'in', ['pending', 'open'])
      .get();

    const demandaPorCidade = new Map<string, { demanda: number; estado: string }>();

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const cidade = data.cidade || 'Não especificado';
      const estado = data.estado || 'N/A';
      
      if (!demandaPorCidade.has(cidade)) {
        demandaPorCidade.set(cidade, { demanda: 0, estado });
      }
      const entry = demandaPorCidade.get(cidade)!;
      entry.demanda++;
    });

    // Oferta por cidade (cuidadores disponíveis)
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const ofertaPorCidade = new Map<string, number>();

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      if (data.ativo === false) return;

      const cidade = data.cidade || 'Não especificado';
      ofertaPorCidade.set(cidade, (ofertaPorCidade.get(cidade) || 0) + 1);
    });

    // Consolidar
    const todasCidades = new Set([
      ...demandaPorCidade.keys(),
      ...ofertaPorCidade.keys()
    ]);

    const result: CoberturasGeograficas[] = [];

    todasCidades.forEach(cidade => {
      const demandaInfo = demandaPorCidade.get(cidade);
      const demanda = demandaInfo?.demanda || 0;
      const estado = demandaInfo?.estado || 'N/A';
      const oferta = ofertaPorCidade.get(cidade) || 0;
      
      const cobertura = demanda > 0 ? (oferta / demanda) * 100 : 0;

      let status: 'coberto' | 'parcial' | 'descoberto';
      if (cobertura >= 120) {
        status = 'coberto';
      } else if (cobertura >= 80) {
        status = 'parcial';
      } else {
        status = 'descoberto';
      }

      result.push({
        cidade,
        estado,
        demanda,
        oferta,
        cobertura: Math.round(cobertura),
        status
      });
    });

    // Ordenar por demanda (maiores primeiro)
    return result.sort((a, b) => b.demanda - a.demanda);

  } catch (error) {
    console.error('[Geográfico] Erro:', error);
    return [];
  }
}
