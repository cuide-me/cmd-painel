/**
 * ────────────────────────────────────
 * API: Torre - Service Desk
 * ────────────────────────────────────
 * GET /api/admin/torre/service-desk
 * 
 * Retorna resumo do Service Desk
 */

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getServiceDeskSummary } from '@/services/admin/torre';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const admin = getFirebaseAdmin();
    const auth = getAuth(admin);

    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const serviceDesk = await getServiceDeskSummary();

    return NextResponse.json(serviceDesk, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[Torre ServiceDesk API] Erro:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
