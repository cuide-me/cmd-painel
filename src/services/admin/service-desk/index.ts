/**
 * ═══════════════════════════════════════════════════════
 * SERVICE DESK - Kanban Board
 * ═══════════════════════════════════════════════════════
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { ServiceDeskData, Ticket, ServiceDeskStats } from './types';

export async function getServiceDeskData(): Promise<ServiceDeskData> {
  const db = getFirestore();

  try {
    const ticketsSnap = await db
      .collection('tickets')
      .orderBy('criadoEm', 'desc')
      .limit(200)
      .get();

    const tickets: Ticket[] = [];
    const stats: ServiceDeskStats = {
      total: 0,
      aFazer: 0,
      emAtendimento: 0,
      concluidos: 0,
      tempoMedioResposta: 0,
      tempoMedioResolucao: 0,
      ticketsPorPrioridade: {
        urgente: 0,
        alta: 0,
        media: 0,
        baixa: 0
      }
    };

    ticketsSnap.forEach(doc => {
      const data = doc.data();
      
      const ticket: Ticket = {
        id: doc.id,
        titulo: data.titulo || 'Sem título',
        descricao: data.descricao || '',
        status: data.status || 'A_FAZER',
        prioridade: data.prioridade || 'media',
        categoria: data.categoria || 'geral',
        criadoEm: toDate(data.criadoEm) || new Date(),
        atualizadoEm: toDate(data.atualizadoEm) || new Date(),
        responsavel: data.responsavel,
        usuarioId: data.usuarioId,
        tempoResposta: data.tempoResposta,
        tempoResolucao: data.tempoResolucao
      };

      tickets.push(ticket);
      stats.total++;

      // Contagem por status
      if (ticket.status === 'A_FAZER') stats.aFazer++;
      else if (ticket.status === 'EM_ATENDIMENTO') stats.emAtendimento++;
      else if (ticket.status === 'CONCLUIDO') stats.concluidos++;

      // Contagem por prioridade
      const prioridade = ticket.prioridade;
      if (stats.ticketsPorPrioridade[prioridade] !== undefined) {
        stats.ticketsPorPrioridade[prioridade]++;
      }
    });

    return {
      tickets,
      stats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Service Desk] Erro:', error);
    return {
      tickets: [],
      stats: {
        total: 0,
        aFazer: 0,
        emAtendimento: 0,
        concluidos: 0,
        tempoMedioResposta: 0,
        tempoMedioResolucao: 0,
        ticketsPorPrioridade: {
          urgente: 0,
          alta: 0,
          media: 0,
          baixa: 0
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

export async function updateTicketStatus(ticketId: string, newStatus: 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO'): Promise<void> {
  const db = getFirestore();
  
  try {
    await db.collection('tickets').doc(ticketId).update({
      status: newStatus,
      atualizadoEm: new Date()
    });
  } catch (error) {
    console.error('[Service Desk] Erro ao atualizar status:', error);
    throw error;
  }
}

export * from './types';
