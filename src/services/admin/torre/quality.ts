/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — QUALIDADE
 * ────────────────────────────────────
 * Métricas de confiança, NPS, avaliações e satisfação
 */

import { getFirestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { QualitySummary } from './types';

/**
 * Calcula NPS (Net Promoter Score)
 * Promotores: 9-10
 * Passivos: 7-8
 * Detratores: 0-6
 */
function calculateNPS(promoters: number, passives: number, detractors: number): number {
  const total = promoters + passives + detractors;
  if (total === 0) return 0;
  
  const promoterPercent = (promoters / total) * 100;
  const detractorPercent = (detractors / total) * 100;
  
  return Math.round(promoterPercent - detractorPercent);
}

/**
 * Calcula Trust Score (0-100) baseado em múltiplos fatores
 */
function calculateTrustScore(data: {
  avgRating: number;
  npsScore: number;
  cancellationRate: number;
  complaintRate: number;
}): number {
  // Peso de cada fator
  const ratingWeight = 0.35;
  const npsWeight = 0.35;
  const cancellationWeight = 0.15;
  const complaintWeight = 0.15;
  
  // Normalizar cada métrica para 0-100
  const ratingScore = (data.avgRating / 5) * 100;
  const npsScore = ((data.npsScore + 100) / 200) * 100; // NPS varia de -100 a +100
  const cancellationScore = Math.max(0, 100 - (data.cancellationRate * 10)); // 10% = 0 pontos
  const complaintScore = Math.max(0, 100 - (data.complaintRate * 20)); // 5% = 0 pontos
  
  const trustScore = 
    (ratingScore * ratingWeight) +
    (npsScore * npsWeight) +
    (cancellationScore * cancellationWeight) +
    (complaintScore * complaintWeight);
  
  return Math.round(trustScore);
}

/**
 * Busca resumo de qualidade e confiança da plataforma
 */
export async function getQualitySummary(): Promise<QualitySummary> {
  const db = getFirestore();

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ═══════════════════════════════════════
    // 1. AVALIAÇÕES DE PROFISSIONAIS
    // ═══════════════════════════════════════
    const professionalRatingsSnap = await db
      .collection('ratings')
      .where('targetType', '==', 'professional')
      .get();

    const professionalRatings = professionalRatingsSnap.docs.map((doc: QueryDocumentSnapshot) => (doc.data() as any).rating || 0);
    const avgRatingProfessionals = professionalRatings.length > 0
      ? professionalRatings.reduce((sum: number, r: number) => sum + r, 0) / professionalRatings.length
      : 0;

    // ═══════════════════════════════════════
    // 2. AVALIAÇÕES DE FAMÍLIAS
    // ═══════════════════════════════════════
    const familyRatingsSnap = await db
      .collection('ratings')
      .where('targetType', '==', 'family')
      .get();

    const familyRatings = familyRatingsSnap.docs.map((doc: QueryDocumentSnapshot) => (doc.data() as any).rating || 0);
    const avgRatingFamilies = familyRatings.length > 0
      ? familyRatings.reduce((sum: number, r: number) => sum + r, 0) / familyRatings.length
      : 0;

    const totalRatings = professionalRatings.length + familyRatings.length;

    // ═══════════════════════════════════════
    // 3. NPS (Net Promoter Score)
    // ═══════════════════════════════════════
    const feedbacksSnap = await db.collection('feedbacks').get();
    
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    feedbacksSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
      const score = (doc.data() as any).score || 0;
      if (score >= 9) promoters++;
      else if (score >= 7) passives++;
      else detractors++;
    });

    const npsScore = calculateNPS(promoters, passives, detractors);

    // ═══════════════════════════════════════
    // 4. CANCELAMENTOS (últimos 30 dias)
    // ═══════════════════════════════════════
    const cancellationsSnap = await db
      .collection('requests')
      .where('status', 'in', ['cancelado', 'cancelled', 'canceled'])
      .where('updatedAt', '>=', thirtyDaysAgo)
      .get();

    const cancellations30d = cancellationsSnap.size;

    // ═══════════════════════════════════════
    // 5. RECLAMAÇÕES (últimos 30 dias)
    // ═══════════════════════════════════════
    const complaintsSnap = await db
      .collection('tickets')
      .where('source', '==', 'complaint')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const complaints30d = complaintsSnap.size;

    // ═══════════════════════════════════════
    // 6. TRUST SCORE
    // ═══════════════════════════════════════
    const totalRequests = await db
      .collection('requests')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const cancellationRate = totalRequests.size > 0
      ? (cancellations30d / totalRequests.size) * 100
      : 0;

    const complaintRate = totalRequests.size > 0
      ? (complaints30d / totalRequests.size) * 100
      : 0;

    const avgRating = (avgRatingProfessionals + avgRatingFamilies) / 2;

    const trustScore = calculateTrustScore({
      avgRating,
      npsScore,
      cancellationRate,
      complaintRate,
    });

    return {
      avgRatingProfessionals: Math.round(avgRatingProfessionals * 10) / 10,
      avgRatingFamilies: Math.round(avgRatingFamilies * 10) / 10,
      totalRatings,
      npsScore,
      promoters,
      passives,
      detractors,
      cancellations30d,
      complaints30d,
      trustScore,
    };
  } catch (error) {
    console.error('[Qualidade] Erro ao calcular resumo de qualidade:', error);
    return {
      avgRatingProfessionals: 0,
      avgRatingFamilies: 0,
      totalRatings: 0,
      npsScore: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      cancellations30d: 0,
      complaints30d: 0,
      trustScore: 0,
    };
  }
}
