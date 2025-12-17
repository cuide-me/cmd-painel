import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

/**
 * GET /api/admin/simple-test
 * Teste extremamente simples - apenas listar collections
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[SimpleTest] Iniciando teste...');
    
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    
    console.log('[SimpleTest] Firestore obtido, tentando listar collections...');
    
    // Teste 1: Listar collections
    const collections = await db.listCollections();
    const collectionNames = collections.map(c => c.id);
    
    console.log('[SimpleTest] Collections encontradas:', collectionNames);
    
    // Teste 2: Tentar buscar 1 usuário
    console.log('[SimpleTest] Tentando buscar 1 usuário...');
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(1).get();
    
    console.log('[SimpleTest] Query executada, size:', snapshot.size);
    
    const hasUsers = !snapshot.empty;
    const firstUser = hasUsers ? {
      id: snapshot.docs[0].id,
      campos: Object.keys(snapshot.docs[0].data()),
      perfil: snapshot.docs[0].data().perfil,
    } : null;
    
    console.log('[SimpleTest] Primeiro usuário:', firstUser);

    return NextResponse.json({
      success: true,
      collections: collectionNames,
      usersCount: snapshot.size,
      firstUser,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[SimpleTest] ERRO:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
