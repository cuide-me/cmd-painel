/**
 * Torre - Confiança Block
 * Source: Firebase Firestore (tickets collection)
 * Read-only, no writes
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { ConfiancaBlock } from './types';

export async function getConfiancaBlock(): Promise<ConfiancaBlock> {
  const db = getFirestore();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Tickets abertos
  const openTicketsSnapshot = await db
    .collection('tickets')
    .where('status', 'in', ['aberto', 'em_andamento'])
    .get();

  const totalTickets = openTicketsSnapshot.size;

  // Tickets críticos (prioridade alta)
  let criticalTickets = 0;
  openTicketsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.prioridade === 'alta' || data.priority === 'high') {
      criticalTickets++;
    }
  });

  // SLA 24h (tickets criados nas últimas 24h)
  let ticketsWithin24h = 0;
  openTicketsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    
    if (createdAt >= twentyFourHoursAgo) {
      ticketsWithin24h++;
    }
  });

  const sla24hPercentage = totalTickets > 0 
    ? (ticketsWithin24h / totalTickets) * 100 
    : 100;

  return {
    ticketsAbertos: {
      total: totalTickets,
      criticos: criticalTickets,
      sla24h: sla24hPercentage
    }
  };
}
