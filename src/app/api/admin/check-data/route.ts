import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * GET /api/admin/check-data
 * Endpoint simples para verificar se os dados estão sendo lidos corretamente
 */
export async function GET() {
  try {
    const db = getFirestore();
    
    // Contar users
    const usersSnap = await db.collection('users').limit(500).get();
    const perfis: Record<string, number> = {};
    
    usersSnap.forEach(doc => {
      const perfil = doc.data()?.perfil || 'sem_perfil';
      perfis[perfil] = (perfis[perfil] || 0) + 1;
    });
    
    // Verificar jobs
    const jobsSnap = await db.collection('jobs').limit(100).get();
    const jobsData = jobsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        clientId: data.clientId,
        specialistId: data.specialistId,
        status: data.status,
        hasClientId: !!data.clientId,
        hasSpecialistId: !!data.specialistId,
      };
    });
    
    return NextResponse.json({
      success: true,
      users: {
        total: usersSnap.size,
        perfis,
      },
      jobs: {
        total: jobsSnap.size,
        samples: jobsData.slice(0, 5),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
