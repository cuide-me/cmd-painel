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
      porStatus: {
        A_FAZER: 0,
        EM_ATENDIMENTO: 0,
        CONCLUIDO: 0
      },
      porPrioridade: {
        URGENTE: 0,
        ALTA: 0,
        MEDIA: 0,
        BAIXA: 0
      },
      tempoMedioResposta: 0,
      tempoMedioResolucao: 0
    };

    ticketsSnap.forEach(doc => {
      const data = doc.data();
      
      const ticket: Ticket = {
        id: doc.id,
        title: data.titulo || data.title || 'Sem título',
        description: data.descricao || data.description || '',
        status: data.status || 'A_FAZER',
        priority: (data.prioridade || data.priority || 'media').toUpperCase() as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE',
        type: data.categoria || data.type || 'geral',
        createdAt: toDate(data.criadoEm || data.createdAt) || new Date(),
        updatedAt: toDate(data.atualizadoEm || data.updatedAt) || new Date(),
        assignedTo: data.responsavel || data.assignedTo,
        userId: data.usuarioId || data.userId,
        responseTime: data.tempoResposta || data.responseTime,
        resolutionTime: data.tempoResolucao || data.resolutionTime
      };

      tickets.push(ticket);
      stats.total++;

      // Contagem por status
      if (ticket.status === 'A_FAZER') stats.porStatus.A_FAZER++;
      else if (ticket.status === 'EM_ATENDIMENTO') stats.porStatus.EM_ATENDIMENTO++;
      else if (ticket.status === 'CONCLUIDO') stats.porStatus.CONCLUIDO++;

      // Contagem por prioridade
      if (ticket.priority === 'URGENTE') stats.porPrioridade.URGENTE++;
      else if (ticket.priority === 'ALTA') stats.porPrioridade.ALTA++;
      else if (ticket.priority === 'MEDIA') stats.porPrioridade.MEDIA++;
      else if (ticket.priority === 'BAIXA') stats.porPrioridade.BAIXA++;
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
        porStatus: {
          A_FAZER: 0,
          EM_ATENDIMENTO: 0,
          CONCLUIDO: 0
        },
        porPrioridade: {
          URGENTE: 0,
          ALTA: 0,
          MEDIA: 0,
          BAIXA: 0
        },
        tempoMedioResposta: 0,
        tempoMedioResolucao: 0
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
