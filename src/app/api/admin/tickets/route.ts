import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { listTickets } from '@/services/admin/tickets';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const { searchParams } = new URL(request.url);
    const windowDays = searchParams.get('window')
      ? parseInt(searchParams.get('window') as string, 10)
      : 30;

    const result = await listTickets(windowDays);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Tickets API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar tickets' },
      { status: 500 }
    );
  }
}
