/**
 * ────────────────────────────────────
 * API: Torre de Controle (Overview)
 * ────────────────────────────────────
 * GET /api/admin/torre
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

// Simple in-memory cache
let cachedData: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 120000; // 2 minutes

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache
    const now = Date.now();
    if (cachedData && (now - cacheTime) < CACHE_DURATION) {
      console.log('[Torre API] Serving from cache');
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Cache': 'HIT',
        },
      });
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
    console.log('[Torre API] Fetching fresh data');
    const torreData = await getTorreData();

    // Update cache
    cachedData = torreData;
    cacheTime = now;

    return NextResponse.json(torreData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Cache': 'MISS',
        'X-Cache-Age': '0',
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
