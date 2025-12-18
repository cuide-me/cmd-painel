/**
 * ────────────────────────────────────
 * API: Torre de Controle (Overview)
 * ────────────────────────────────────
 * GET /api/admin/torre
 * 
 * ⚠️ DEPRECATED: Use /api/admin/control-tower instead
 * This endpoint will be removed in a future version
 * 
 * Retorna dados completos da Torre de Controle
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getTorreData } from '@/services/admin/torre';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Log deprecation warning
  console.warn('[DEPRECATED] /api/admin/torre is deprecated. Use /api/admin/control-tower instead');
  
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
        'X-API-Deprecated': 'true',
        'X-API-Deprecation-Info': 'Use /api/admin/control-tower instead',
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
