import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * GET /api/admin/test-count
 * Teste simples de contagem de usuários
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getFirestore();
    
    // Método 1: Buscar todos e contar
    console.log('[TestCount] Método 1: get().size');
    const allUsers = await db.collection('users').get();
    const totalUsers = allUsers.size;
    
    // Método 2: Contar por perfil
    console.log('[TestCount] Método 2: where perfil');
    const profSnap = await db.collection('users').where('perfil', '==', 'profissional').get();
    const clienteSnap = await db.collection('users').where('perfil', '==', 'cliente').get();
    
    // Ver campos do primeiro usuário
    const firstUser = allUsers.docs[0]?.data();
    const campos = firstUser ? Object.keys(firstUser) : [];
    
    // Ver valores de perfil únicos
    const perfisUnicos = new Set<string>();
    allUsers.docs.forEach(doc => {
      const perfil = doc.data().perfil;
      if (perfil) perfisUnicos.add(perfil);
    });

    return NextResponse.json({
      totalUsers,
      profissionais: profSnap.size,
      clientes: clienteSnap.size,
      primeiroUsuarioCampos: campos,
      primeiroUsuarioExemplo: firstUser,
      perfisEncontrados: Array.from(perfisUnicos),
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[TestCount] Error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
