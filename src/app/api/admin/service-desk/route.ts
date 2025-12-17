import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAdminAuth } from '@/lib/server/auth';

/**
 * GET /api/admin/service-desk
 * Lista tickets com filtros
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assignedTo');

    const db = getFirestore();
    let query: any = db.collection('tickets');

    // Aplicar filtros
    if (status) {
      query = query.where('status', '==', status);
    }
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    if (source) {
      query = query.where('source', '==', source);
    }
    if (assignedTo) {
      query = query.where('assignedTo', '==', assignedTo);
    }

    query = query.orderBy('createdAt', 'desc').limit(200);

    const snapshot = await query.get();
    const tickets = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        firstResponseAt: data.firstResponseAt?.toDate?.()?.toISOString() || null,
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Calcular métricas
    const metrics = {
      total: tickets.length,
      byStatus: {
        open: tickets.filter((t: any) => t.status === 'open').length,
        in_progress: tickets.filter((t: any) => t.status === 'in_progress').length,
        resolved: tickets.filter((t: any) => t.status === 'resolved').length,
        closed: tickets.filter((t: any) => t.status === 'closed').length,
      },
      byPriority: {
        urgent: tickets.filter((t: any) => t.priority === 'urgent').length,
        high: tickets.filter((t: any) => t.priority === 'high').length,
        normal: tickets.filter((t: any) => t.priority === 'normal').length,
        low: tickets.filter((t: any) => t.priority === 'low').length,
      },
      bySource: {
        detractor: tickets.filter((t: any) => t.source === 'detractor').length,
        complaint: tickets.filter((t: any) => t.source === 'complaint').length,
        bug: tickets.filter((t: any) => t.source === 'bug').length,
        question: tickets.filter((t: any) => t.source === 'question').length,
        feature_request: tickets.filter((t: any) => t.source === 'feature_request').length,
      },
      avgResponseTimeHours: calculateAvgResponseTime(tickets),
      slaCompliance: calculateSLACompliance(tickets),
      ticketsOver24h: tickets.filter((t: any) => {
        const created = new Date(t.createdAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return hoursDiff > 24 && !t.firstResponseAt;
      }).length,
    };

    return NextResponse.json({ tickets, metrics });
  } catch (error: any) {
    console.error('[ServiceDesk API] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/service-desk
 * Atualiza status/atribuição de ticket
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, status, assignedTo, priority, notes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
    }

    const db = getFirestore();
    const ticketRef = db.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      
      // Marcar primeira resposta se mudou de 'open' para 'in_progress'
      const currentStatus = ticketDoc.data()?.status;
      if (currentStatus === 'open' && status === 'in_progress' && !ticketDoc.data()?.firstResponseAt) {
        updateData.firstResponseAt = new Date();
      }

      // Marcar resolução
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
      }
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }

    if (priority) {
      updateData.priority = priority;
    }

    // Adicionar nota à timeline
    if (notes || status || assignedTo) {
      const timeline = ticketDoc.data()?.timeline || [];
      timeline.push({
        timestamp: new Date(),
        action: status ? `Status alterado para ${status}` : assignedTo ? `Atribuído para ${assignedTo}` : 'Atualização',
        notes: notes || '',
        updatedBy: 'admin', // TODO: pegar do token
      });
      updateData.timeline = timeline;
    }

    await ticketRef.update(updateData);

    return NextResponse.json({ success: true, ticketId });
  } catch (error: any) {
    console.error('[ServiceDesk API] PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/service-desk
 * Cria novo ticket manual
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, userName, userType, source, priority, subject, description } = body;

    if (!subject || !source) {
      return NextResponse.json({ error: 'subject and source required' }, { status: 400 });
    }

    const db = getFirestore();
    const ticketData = {
      userId: userId || null,
      userName: userName || 'Desconhecido',
      userType: userType || 'unknown',
      source,
      priority: priority || 'normal',
      status: 'open',
      subject,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [
        {
          timestamp: new Date(),
          action: 'Ticket criado manualmente',
          notes: '',
          updatedBy: 'admin',
        },
      ],
    };

    const docRef = await db.collection('tickets').add(ticketData);

    return NextResponse.json({ success: true, ticketId: docRef.id });
  } catch (error: any) {
    console.error('[ServiceDesk API] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateAvgResponseTime(tickets: any[]): number {
  const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
  if (ticketsWithResponse.length === 0) return 0;

  const totalHours = ticketsWithResponse.reduce((sum, t) => {
    const created = new Date(t.createdAt).getTime();
    const responded = new Date(t.firstResponseAt).getTime();
    return sum + (responded - created) / (1000 * 60 * 60);
  }, 0);

  return Math.round((totalHours / ticketsWithResponse.length) * 10) / 10;
}

function calculateSLACompliance(tickets: any[]): number {
  if (tickets.length === 0) return 100;

  // SLA: responder em 24h para urgent/high, 48h para normal, 72h para low
  const slaHours: Record<string, number> = {
    urgent: 4,
    high: 24,
    normal: 48,
    low: 72,
  };

  let compliant = 0;

  tickets.forEach(t => {
    const sla = slaHours[t.priority] || 48;
    const created = new Date(t.createdAt).getTime();
    const responded = t.firstResponseAt ? new Date(t.firstResponseAt).getTime() : Date.now();
    const hoursDiff = (responded - created) / (1000 * 60 * 60);

    if (hoursDiff <= sla) {
      compliant++;
    }
  });

  return Math.round((compliant / tickets.length) * 100);
}
