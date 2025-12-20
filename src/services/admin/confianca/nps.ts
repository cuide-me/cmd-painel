/**
 * ═══════════════════════════════════════════════════════
 * NPS - Net Promoter Score
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { NPSData } from './types';

export async function getNPSData(): Promise<NPSData> {
  const db = getFirestore();

  try {
    // Buscar feedbacks com ratings
    const feedbacksSnap = await db
      .collection('feedbacks')
      .where('rating', '>=', 1)
      .where('rating', '<=', 10)
      .limit(500)
      .get();

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    feedbacksSnap.forEach(doc => {
      const data = doc.data();
      const rating = data.rating || 0;

      if (rating >= 9) {
        promoters++;
      } else if (rating >= 7) {
        passives++;
      } else {
        detractors++;
      }
    });

    const total = feedbacksSnap.size;
    const score = total > 0 
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;

    return {
      score,
      promoters,
      passives,
      detractors,
      totalResponses: total
    };

  } catch (error) {
    console.error('[NPS] Erro:', error);
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      totalResponses: 0
    };
  }
}
