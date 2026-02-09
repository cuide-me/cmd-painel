/**
 * Listagem de tickets (Service Desk) baseada em dados reais
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { hoursSince } from '@/lib/admin/dateHelpers';
import { normalizeTicketStatus } from '../statusNormalizer';
import type { TicketItem, TicketsResponse, TicketPriority, TicketStatus } from './types';

function calculatePriority(ticket: TicketItem): TicketPriority {
  const horas = ticket.horasEmAberto || 0;
  const tipo = (ticket.tipo || '').toString().toUpperCase();

  if (tipo === 'RECLAMACAO' || tipo === 'RECLAMAÇÃO') {
    if (horas >= 48) return 'urgente';
    if (horas >= 24) return 'alta';
    return 'media';
  }

  if (tipo === 'PROBLEMA') {
    if (horas >= 72) return 'alta';
    return 'media';
  }

  return 'baixa';
}

export async function listTickets(windowDays: number = 30): Promise<TicketsResponse> {
  const app = getFirebaseAdmin();
  const db = getFirestore(app);

  const windowStart = Timestamp.fromDate(
    new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  );

  const snapshot = await db
    .collection('tickets')
    .where('createdAt', '>=', windowStart)
    .get();

  const tickets: TicketItem[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, any>;
    const status = normalizeTicketStatus(data.status || 'A_FAZER') as TicketStatus;
    const horasEmAberto = hoursSince(data.createdAt);

    const ticket: TicketItem = {
      id: doc.id,
      titulo: data.titulo || data.subject,
      descricao: data.descricao || data.description,
      tipo: data.tipo,
      status,
      prioridade: 'baixa',
      usuarioId: data.usuarioId || data.userId,
      usuarioNome: data.usuarioNome || data.userName,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      closedAt: data.closedAt || null,
      horasEmAberto: typeof horasEmAberto === 'number' ? horasEmAberto : null,
    };

    ticket.prioridade = calculatePriority(ticket);
    return ticket;
  });

  return {
    windowDays,
    tickets,
    timestamp: new Date().toISOString(),
  };
}
