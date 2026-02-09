/**
 * ═══════════════════════════════════════════════════════
 * API ROUTE - Torre de Controle
 * ═══════════════════════════════════════════════════════
 * GET /api/admin/torre-de-controle
 * 
 * Query params:
 * - window: 7 | 30 | 90 (dias)
 * - region: slug da região (opcional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { calculateTorreDeControleMetrics } from '@/services/admin/torreDeControleMetrics';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

// Cache simples em memória (5 minutos)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(window: number, region?: string): string {
  return `torre-${window}-${region || 'all'}`;
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('[API Torre] Requisição recebida');
    
    // Verificar autenticação admin (aceita x-admin-password)
    const auth = await verifyAdminAuth(request);
    if (!auth || !auth.authorized) {
      console.log('[API Torre] Autenticação falhou');
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[API Torre] Autenticação OK');

    // Garantir Firebase Admin inicializado
    try {
      getFirebaseAdmin();
      console.log('[API Torre] Firebase Admin OK');
    } catch (firebaseError) {
      console.error('[API Torre] Erro ao inicializar Firebase:', firebaseError);
      return NextResponse.json(
        { 
          error: 'firebase_init_error', 
          message: 'Failed to initialize Firebase Admin',
          details: firebaseError instanceof Error ? firebaseError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const windowParam = searchParams.get('window') || '30';
    const regionParam = searchParams.get('region') || undefined;

    const window = parseInt(windowParam, 10);
    if (![7, 30, 90].includes(window)) {
      return NextResponse.json(
        { error: 'invalid_window', message: 'Window must be 7, 30, or 90 days' },
        { status: 400 }
      );
    }

    // Verificar cache
    const cacheKey = getCacheKey(window, regionParam);
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('[API Torre] Retornando dados do cache');
      return NextResponse.json({
        ...cached,
        cached: true,
      });
    }

    // Calcular métricas
    console.log('[API Torre] Calculando métricas...');
    const result = await calculateTorreDeControleMetrics(window, regionParam);
    console.log('[API Torre] Métricas calculadas com sucesso');

    // Salvar no cache
    setCache(cacheKey, result);

    return NextResponse.json({
      ...result,
      cached: false,
    });

  } catch (error) {
    console.error('[API Torre de Controle] ERRO FATAL:', error);
    console.error('[API Torre de Controle] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[API Torre de Controle] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[API Torre de Controle] Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    );
  }
}
