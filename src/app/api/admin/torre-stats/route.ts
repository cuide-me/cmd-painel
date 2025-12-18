/**
 * ⚠️ DEPRECATED: Use /api/admin/control-tower instead
 * This endpoint will be removed in a future version
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  console.warn('[DEPRECATED] /api/admin/torre-stats is deprecated. Use /api/admin/control-tower instead');
  
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const app = getFirebaseAdmin();
    const db = getFirestore(app);

    // Buscar usuários
    const usersSnapshot = await db.collection('users').get();

    let profissionais = 0;
    let familias = 0;

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const perfil = data.perfil;

      if (perfil === 'profissional') {
        profissionais++;
      } else if (perfil === 'cliente' || perfil === 'family') {
        familias++;
      }
    });

    // Buscar tickets abertos (se houver coleção de tickets)
    let tickets = 0;
    try {
      const ticketsSnapshot = await db
        .collection('tickets')
        .where('status', 'in', ['open', 'pending', 'in_progress'])
        .get();
      tickets = ticketsSnapshot.size;
    } catch (error) {
      // Coleção tickets pode não existir
      tickets = 0;
    }

    // Buscar receita do mês (da coleção payments ou similar)
    let receita = 0;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const paymentsSnapshot = await db
        .collection('payments')
        .where('status', '==', 'succeeded')
        .where('createdAt', '>=', startOfMonth)
        .get();

      paymentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        receita += data.amount || 0;
      });
    } catch (error) {
      // Coleção payments pode não existir
      receita = 0;
    }

    return NextResponse.json({
      familias,
      profissionais,
      receita,
      tickets,
    });
  } catch (error: any) {
    console.error('[Torre Stats API] Erro:', error);
    return NextResponse.json(
      {
        familias: 0,
        profissionais: 0,
        receita: 0,
        tickets: 0,
      },
      { status: 200 } // Retorna 200 com zeros em caso de erro
    );
  }
}
