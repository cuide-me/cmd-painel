/**
 * ═══════════════════════════════════════════════════════
 * API ROUTE - Admin Login
 * ═══════════════════════════════════════════════════════
 * POST /api/admin/auth/login
 * 
 * Valida senha de admin e retorna token customizado do Firebase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

// Rate limiting simples em memória
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (attempt) {
    // Está bloqueado?
    if (attempt.blockedUntil > now) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((attempt.blockedUntil - now) / 1000) 
      };
    }
    
    // Resetar se bloqueio expirou
    if (attempt.blockedUntil <= now && attempt.count >= MAX_ATTEMPTS) {
      loginAttempts.delete(ip);
    }
  }
  
  return { allowed: true };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  
  attempt.count++;
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_DURATION;
    console.warn(`[Auth] IP ${ip} bloqueado por ${BLOCK_DURATION / 60000} minutos após ${MAX_ATTEMPTS} tentativas`);
  }
  
  loginAttempts.set(ip, attempt);
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  // Verificar rate limit
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many attempts', 
        message: `Muitas tentativas. Tente novamente em ${rateLimitResult.retryAfter} segundos.`,
        retryAfter: rateLimitResult.retryAfter 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter)
        }
      }
    );
  }
  
  try {
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password required', message: 'Senha é obrigatória' },
        { status: 400 }
      );
    }
    
    // Verificar ADMIN_PASSWORD da env var
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    
    if (!ADMIN_PASSWORD) {
      console.error('[Auth] ❌ ADMIN_PASSWORD não configurado nas variáveis de ambiente');
      return NextResponse.json(
        { error: 'Server configuration error', message: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }
    
    // Validar senha
    if (password !== ADMIN_PASSWORD) {
      recordFailedAttempt(ip);
      console.warn(`[Auth] ❌ Tentativa de login falhou de IP: ${ip}`);
      return NextResponse.json(
        { error: 'Invalid password', message: 'Senha incorreta' },
        { status: 401 }
      );
    }
    
    // Login bem sucedido
    clearAttempts(ip);
    console.log(`[Auth] ✅ Login bem sucedido de IP: ${ip}`);

    // Gera custom token Firebase com claims de admin
    getFirebaseAdmin();
    const firebaseCustomToken = await getAuth().createCustomToken('admin-panel-user', {
      admin: true,
      role: 'admin',
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login realizado com sucesso',
        firebaseCustomToken,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[Auth] Erro no login:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
