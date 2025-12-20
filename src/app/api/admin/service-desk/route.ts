/**
 * API ROUTE: /api/admin/service-desk
 * Service Desk Kanban Board
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getServiceDeskData, updateTicketStatus } from '@/services/admin/service-desk';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const data = await getServiceDeskData();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Service Desk API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'ticketId e status são obrigatórios' }, { status: 400 });
    }

    await updateTicketStatus(ticketId, status);

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[Service Desk API] Erro ao atualizar:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar ticket' },
      { status: 500 }
    );
  }
}
