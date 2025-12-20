/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD EXECUTIVO - GROWTH METRICS
 * ═══════════════════════════════════════════════════════
 * Métricas de crescimento Month-over-Month
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { GrowthMetrics } from './types';

export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  const db = getFirestore();
  
  try {
    const hoje = new Date();
    const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

    // Famílias Ativas
    const familiasAtuais = await contarFamiliasAtivas(db, inicioMesAtual, hoje);
    const familiasAnteriores = await contarFamiliasAtivas(db, inicioMesAnterior, fimMesAnterior);
    const familiasGrowth = calcularGrowth(familiasAtuais, familiasAnteriores);

    // Cuidadores Ativos
    const cuidadoresAtuais = await contarCuidadoresAtivos(db, inicioMesAtual, hoje);
    const cuidadoresAnteriores = await contarCuidadoresAtivos(db, inicioMesAnterior, fimMesAnterior);
    const cuidadoresGrowth = calcularGrowth(cuidadoresAtuais, cuidadoresAnteriores);

    // Jobs Completados
    const jobsAtuais = await contarJobsCompletados(db, inicioMesAtual, hoje);
    const jobsAnteriores = await contarJobsCompletados(db, inicioMesAnterior, fimMesAnterior);
    const jobsGrowth = calcularGrowth(jobsAtuais, jobsAnteriores);

    // Revenue Growth
    const revenueAtual = await calcularRevenue(db, inicioMesAtual, hoje);
    const revenueAnterior = await calcularRevenue(db, inicioMesAnterior, fimMesAnterior);
    const revenueGrowth = calcularGrowth(revenueAtual, revenueAnterior);

    // Metas de crescimento
    const metaFamilias = 10; // 10% MoM
    const metaCuidadores = 8; // 8% MoM
    const metaJobs = 12; // 12% MoM
    const metaRevenue = 15; // 15% MoM

    // Status geral baseado na média de atingimento
    const atingimentos = [
      familiasGrowth / metaFamilias,
      cuidadoresGrowth / metaCuidadores,
      jobsGrowth / metaJobs,
      revenueGrowth / metaRevenue,
    ];
    const mediaAtingimento = atingimentos.reduce((a, b) => a + b, 0) / atingimentos.length;

    const status = 
      mediaAtingimento >= 1.2 ? 'excelente' :
      mediaAtingimento >= 1.0 ? 'bom' :
      mediaAtingimento >= 0.8 ? 'atencao' : 'critico';

    return {
      familiasAtivas: {
        atual: familiasAtuais,
        anterior: familiasAnteriores,
        momGrowth: Math.round(familiasGrowth * 10) / 10,
        meta: metaFamilias,
      },
      cuidadoresAtivos: {
        atual: cuidadoresAtuais,
        anterior: cuidadoresAnteriores,
        momGrowth: Math.round(cuidadoresGrowth * 10) / 10,
        meta: metaCuidadores,
      },
      jobsCompletados: {
        atual: jobsAtuais,
        anterior: jobsAnteriores,
        momGrowth: Math.round(jobsGrowth * 10) / 10,
        meta: metaJobs,
      },
      revenueGrowth: {
        atual: revenueAtual,
        anterior: revenueAnterior,
        momGrowth: Math.round(revenueGrowth * 10) / 10,
        meta: metaRevenue,
      },
      status,
    };

  } catch (error) {
    console.error('[Growth] Erro:', error);
    return {
      familiasAtivas: { atual: 0, anterior: 0, momGrowth: 0, meta: 10 },
      cuidadoresAtivos: { atual: 0, anterior: 0, momGrowth: 0, meta: 8 },
      jobsCompletados: { atual: 0, anterior: 0, momGrowth: 0, meta: 12 },
      revenueGrowth: { atual: 0, anterior: 0, momGrowth: 0, meta: 15 },
      status: 'critico',
    };
  }
}

async function contarFamiliasAtivas(db: FirebaseFirestore.Firestore, inicio: Date, fim: Date): Promise<number> {
  const snap = await db
    .collection('users')
    .where('perfil', '==', 'cliente')
    .where('createdAt', '<=', fim)
    .get();
  return snap.size;
}

async function contarCuidadoresAtivos(db: FirebaseFirestore.Firestore, inicio: Date, fim: Date): Promise<number> {
  const snap = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('createdAt', '<=', fim)
    .get();
  return snap.size;
}

async function contarJobsCompletados(db: FirebaseFirestore.Firestore, inicio: Date, fim: Date): Promise<number> {
  const snap = await db
    .collection('jobs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', inicio)
    .where('completedAt', '<=', fim)
    .get();
  return snap.size;
}

async function calcularRevenue(db: FirebaseFirestore.Firestore, inicio: Date, fim: Date): Promise<number> {
  const snap = await db
    .collection('jobs')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', inicio)
    .where('completedAt', '<=', fim)
    .get();

  let revenue = 0;
  snap.forEach(doc => {
    const data = doc.data();
    revenue += data.valor || 2500;
  });

  return revenue;
}

function calcularGrowth(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return ((atual - anterior) / anterior) * 100;
}
