/**
 * ═══════════════════════════════════════════════════════
 * SEGMENTAÇÃO - Perfil das famílias
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { SegmentacaoFamilia } from './types';

export async function getSegmentacaoFamilias(): Promise<SegmentacaoFamilia> {
  const db = getFirestore();

  try {
    // Buscar jobs ativos/completados para análise
    const jobsSnap = await db
      .collection('jobs')
      .where('status', 'in', ['active', 'completed', 'matched'])
      .limit(500)
      .get();

    const tipoServicoMap = new Map<string, number>();
    const localizacaoMap = new Map<string, { estado: string; count: number }>();

    jobsSnap.forEach(doc => {
      const data = doc.data();
      
      // Tipo de serviço
      const tipo = data.tipo || 'geral';
      tipoServicoMap.set(tipo, (tipoServicoMap.get(tipo) || 0) + 1);
      
      // Localização
      const cidade = data.cidade || 'Não especificado';
      const estado = data.estado || 'N/A';
      const key = `${cidade}|${estado}`;
      
      if (!localizacaoMap.has(key)) {
        localizacaoMap.set(key, { estado, count: 0 });
      }
      localizacaoMap.get(key)!.count++;
    });

    // Converter para arrays
    const tipoServico = Array.from(tipoServicoMap.entries())
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count);

    const localizacao = Array.from(localizacaoMap.entries())
      .map(([key, value]) => {
        const [cidade] = key.split('|');
        return { cidade, estado: value.estado, count: value.count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Faixa de idade (simplificado - não temos idade diretamente)
    const faixaIdade = [
      { faixa: 'Não especificado', count: jobsSnap.size }
    ];

    return {
      tipoServico,
      localizacao,
      faixaIdade
    };

  } catch (error) {
    console.error('[Segmentação Famílias] Erro:', error);
    return {
      tipoServico: [],
      localizacao: [],
      faixaIdade: []
    };
  }
}
