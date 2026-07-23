/**
 * Listagem de tickets (Service Desk) baseada em dados reais
 */

import { FieldValue, Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { hoursSince } from '@/lib/admin/dateHelpers';
import { normalizeTicketStatus } from '../statusNormalizer';
import { cache } from '@/lib/cache';
import type { TicketItem, TicketsResponse, TicketPriority, TicketStatus, TicketOperationalContext, UpdateTicketOperationalInput } from './types';

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toOperationalContext(value: unknown): TicketOperationalContext {
  const operational = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const status = operational.status === 'in_progress' || operational.status === 'resolved' ? operational.status : 'unassigned';
  return {
    status,
    ownerId: typeof operational.ownerId === 'string' && operational.ownerId.trim() ? operational.ownerId.trim() : null,
    ownerName: typeof operational.ownerName === 'string' && operational.ownerName.trim() ? operational.ownerName.trim() : null,
    nextAction: typeof operational.nextAction === 'string' && operational.nextAction.trim() ? operational.nextAction.trim() : null,
    dueAt: toIso(operational.dueAt),
    resolvedAt: toIso(operational.resolvedAt),
    updatedAt: toIso(operational.updatedAt),
    updatedBy: typeof operational.updatedBy === 'string' && operational.updatedBy.trim() ? operational.updatedBy.trim() : null,
  };
}

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

async function listTicketsUncached(windowDays: number): Promise<TicketsResponse> {
  const app = getFirebaseAdmin();
  const db = getFirestore();

  const windowStart = Timestamp.fromDate(
    new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  );

  const snapshot = await db
    .collection('tickets')
    .where('createdAt', '>=', windowStart)
    .get();

  const tickets: TicketItem[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
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
      operational: toOperationalContext(data.operational),
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

export async function updateTicketOperationalContext(
  ticketId: string,
  input: UpdateTicketOperationalInput,
  updatedBy: string,
  ownerName: string,
): Promise<void> {
  getFirebaseAdmin();
  const db = getFirestore();
  const ticketRef = db.collection('tickets').doc(ticketId);
  const ticket = await ticketRef.get();
  if (!ticket.exists) throw new Error('Ticket nao encontrado');

  const dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) throw new Error('Prazo operacional invalido');

  await ticketRef.set({
    operational: {
      status: input.status,
      ownerId: updatedBy,
      ownerName,
      nextAction: input.nextAction?.trim() || null,
      dueAt,
      resolvedAt: input.status === 'resolved' ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    },
  }, { merge: true });
  cache.invalidatePattern(/^admin:tickets:/);
}

export async function listTickets(windowDays: number = 30): Promise<TicketsResponse> {
  const normalizedWindowDays = Math.min(Math.max(windowDays, 1), 90);
  return cache.getOrFetch(
    `admin:tickets:${normalizedWindowDays}`,
    () => listTicketsUncached(normalizedWindowDays),
    60
  );
}
