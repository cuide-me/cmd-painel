/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD EXECUTIVO - GMV (Gross Merchandise Value)
 * ═══════════════════════════════════════════════════════
 * Calcula GMV total da plataforma
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { GMVMetrics } from './types';

export async function getGMVMetrics(): Promise<GMVMetrics> {
  const db = getFirestore();
  
  try {
    const hoje = new Date();
    const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

    // Buscar jobs completados do mês atual
    const jobsMesAtualSnap = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', inicioMesAtual)
      .get();

    let gmvAtual = 0;
    jobsMesAtualSnap.forEach(doc => {
      const data = doc.data();
      gmvAtual += data.valor || 2500; // Fallback: R$ 2.5k
    });

    // Buscar jobs do mês anterior para calcular MoM
    const jobsMesAnteriorSnap = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', inicioMesAnterior)
      .where('completedAt', '<=', fimMesAnterior)
      .get();

    let gmvAnterior = 0;
    jobsMesAnteriorSnap.forEach(doc => {
      const data = doc.data();
      gmvAnterior += data.valor || 2500;
    });

    // Calcular crescimento MoM
    const momGrowth = gmvAnterior > 0 
      ? ((gmvAtual - gmvAnterior) / gmvAnterior) * 100 
      : 0;

    // Gerar histórico últimos 12 meses
    const historico12M = await gerarHistorico12M(db);

    // Forecast simples (baseado em média de crescimento)
    const forecast3M = gerarForecast(gmvAtual, momGrowth, 3);

    // Meta: R$ 500k/mês
    const meta = 500000;

    // Calcular status
    const percentualMeta = (gmvAtual / meta) * 100;
    const status = 
      percentualMeta >= 110 ? 'excelente' :
      percentualMeta >= 90 ? 'bom' :
      percentualMeta >= 70 ? 'atencao' : 'critico';

    return {
      atual: gmvAtual,
      meta,
      momGrowth: Math.round(momGrowth * 10) / 10,
      forecast3M,
      historico12M,
      status,
    };

  } catch (error) {
    console.error('[GMV] Erro:', error);
    return {
      atual: 0,
      meta: 500000,
      momGrowth: 0,
      forecast3M: [0, 0, 0],
      historico12M: [],
      status: 'critico',
    };
  }
}

/**
 * Gera histórico dos últimos 12 meses
 */
async function gerarHistorico12M(db: FirebaseFirestore.Firestore) {
  const historico: Array<{ mes: string; valor: number }> = [];
  const hoje = new Date();

  for (let i = 11; i >= 0; i--) {
    const mesRef = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const inicioMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
    const fimMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0);

    try {
      const jobsSnap = await db
        .collection('jobs')
        .where('status', '==', 'completed')
        .where('completedAt', '>=', inicioMes)
        .where('completedAt', '<=', fimMes)
        .get();

      let gmvMes = 0;
      jobsSnap.forEach(doc => {
        const data = doc.data();
        gmvMes += data.valor || 2500;
      });

      historico.push({
        data: mesRef.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
        valor: gmvMes,
      });
    } catch (error) {
      // Se falhar, adicionar 0
      historico.push({
        data: mesRef.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }),
        valor: 0,
      });
    }
  }

  return historico;
}

/**
 * Gera forecast simples baseado em crescimento
 */
function gerarForecast(valorAtual: number, taxaCrescimento: number, meses: number): number[] {
  const forecast: number[] = [];
  let valorProjetado = valorAtual;

  for (let i = 0; i < meses; i++) {
    valorProjetado = valorProjetado * (1 + taxaCrescimento / 100);
    forecast.push(Math.round(valorProjetado));
  }

  return forecast;
}
