import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { verifyAdminAuth } from '@/lib/server/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    // Verificar autenticação admin
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const db = getFirestore();

    const { ticketId } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
    }

    // Atualizar ticket
    const ticketRef = db.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 });
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Se está marcando como "in_progress" pela primeira vez, registrar firstResponseAt
    if (status === 'in_progress' && !ticketDoc.data()?.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    // Se está marcando como "resolved", registrar resolvedAt
    if (status === 'resolved' && !ticketDoc.data()?.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    await ticketRef.update(updateData);

    return NextResponse.json({ 
      success: true, 
      ticketId,
      status,
      message: 'Ticket atualizado com sucesso' 
    });
  } catch (error) {
    console.error('[PATCH /api/admin/service-desk/[ticketId]] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar ticket' },
      { status: 500 }
    );
  }
}
