/**
 * ═══════════════════════════════════════════════════════
 * RATINGS - Tendências de avaliação
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { RatingTrends } from './types';

export async function getRatingTrends(): Promise<RatingTrends> {
  const db = getFirestore();

  try {
    const ratingsSnap = await db
      .collection('ratings')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    let totalRating = 0;
    let count = 0;
    const byMonth: { [key: string]: { sum: number; count: number } } = {};

    ratingsSnap.forEach(doc => {
      const data = doc.data();
      if (data.rating) {
        totalRating += data.rating;
        count++;

        if (data.createdAt) {
          const date = toDate(data.createdAt);
          if (date) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[monthKey]) {
              byMonth[monthKey] = { sum: 0, count: 0 };
            }
            byMonth[monthKey].sum += data.rating;
            byMonth[monthKey].count++;
          }
        }
      }
    });

    const overall = count > 0 ? totalRating / count : 0;

    const byMonthArray = Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        rating: Math.round((data.sum / data.count) * 10) / 10,
        count: data.count
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);

    return {
      overall: Math.round(overall * 10) / 10,
      byMonth: byMonthArray,
      byService: []
    };

  } catch (error) {
    console.error('[Ratings] Erro:', error);
    return {
      overall: 0,
      byMonth: [],
      byService: []
    };
  }
}
