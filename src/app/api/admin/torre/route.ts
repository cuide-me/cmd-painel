/**
 * ────────────────────────────────────
 * API: Torre de Controle (Overview)
 * ────────────────────────────────────
 * GET /api/admin/torre
 * 
 * Retorna dados completos da Torre de Controle
 */

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getTorreData } from '@/services/admin/torre';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verificar autenticação
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
      console.error('[Torre API] Token inválido:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Buscar dados da Torre
    const torreData = await getTorreData();

    return NextResponse.json(torreData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[Torre API] Erro ao buscar dados:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
