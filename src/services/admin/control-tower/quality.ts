/**
 * Quality KPIs - Torre de Controle
 * Fonte: 100% Firebase (feedbacks + tickets)
 * Responde: "Nossos clientes estão satisfeitos?"
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { QualityKPIs } from './types';

export async function getQualityKPIs(): Promise<QualityKPIs> {
  try {
    const db = getFirestore();
    
    console.log('[Quality] Buscando dados Firebase...');
    
    // 1. NPS Score (baseado em feedbacks)
    let npsScore = 0;
    let feedbackCount = 0;
    
    try {
      const feedbacksSnap = await db.collection('feedbacks').limit(500).get();
      
      if (feedbacksSnap.size > 0) {
        const ratings = feedbacksSnap.docs
          .map((doc: any) => doc.data().rating)
          .filter((r: any) => typeof r === 'number' && r >= 1 && r <= 5);
        
        if (ratings.length > 0) {
          // ⚠️ NOTA: Interpretação de rating 1-5 como NPS
          // Promotores: rating >= 4 (satisfeitos)
          // Neutros: rating == 3 (indiferentes)
          // Detratores: rating <= 2 (insatisfeitos)
          const promotores = ratings.filter((r: any) => r >= 4).length;
          const detratores = ratings.filter((r: any) => r <= 2).length;
          npsScore = ((promotores - detratores) / ratings.length) * 100;
          feedbackCount = ratings.length;
          
          console.log('[Quality] NPS:', npsScore.toFixed(0), `(${feedbackCount} feedbacks)`);
        }
      }
    } catch (feedbackError) {
      console.error('[Quality] Erro ao buscar feedbacks:', feedbackError);
      // Continuar sem dados de feedbacks
    }
    
    // 2. Tickets Abertos
    let ticketsAbertos = 0;
    let ticketsEmAtraso = 0;
    
    try {
      const ticketsSnap = await db
        .collection('tickets')
        .where('status', 'in', ['open', 'pending', 'in_progress'])
        .get();
      
      ticketsAbertos = ticketsSnap.size;
      
      // 3. Tickets em Atraso (> 48h sem resolução)
      const limite48h = new Date();
      limite48h.setHours(limite48h.getHours() - 48);
      
      ticketsEmAtraso = ticketsSnap.docs.filter((doc: any) => {
        const createdAt = toDate(doc.data().createdAt);
        return createdAt && createdAt < limite48h;
      }).length;
      
      console.log('[Quality] Tickets:', ticketsAbertos, 'abertos,', ticketsEmAtraso, 'em atraso');
    } catch (ticketError) {
      console.error('[Quality] Erro ao buscar tickets:', ticketError);
      // Continuar sem dados de tickets
    }
    
    return {
      npsScore: Math.round(npsScore),
      feedbackCount,
      ticketsAbertos,
      ticketsEmAtraso,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Quality] ❌ Erro ao buscar KPIs:', error);
    
    // Retornar zeros em caso de erro
    return {
      npsScore: 0,
      feedbackCount: 0,
      ticketsAbertos: 0,
      ticketsEmAtraso: 0,
      timestamp: new Date().toISOString()
    };
  }
}
