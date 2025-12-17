import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * GET /api/admin/audit-data
 * Auditoria completa da estrutura de dados do Firebase
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getFirestore();
    const audit: any = {
      timestamp: new Date().toISOString(),
      collections: {},
    };

    // Auditar USERS - buscar TODOS os documentos
    console.log('[Audit] Analisando collection users...');
    const usersSnap = await db.collection('users').get();
    
    const perfis: Record<string, number> = {};
    const userTypes: Record<string, number> = {};
    const camposUsuarios = new Set<string>();
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      Object.keys(data).forEach(key => camposUsuarios.add(key));
      
      if (data.perfil) {
        perfis[data.perfil] = (perfis[data.perfil] || 0) + 1;
      }
      if (data.userType) {
        userTypes[data.userType] = (userTypes[data.userType] || 0) + 1;
      }
    });

    // Exemplo de profissional
    const profSnap = await db.collection('users').where('perfil', '==', 'profissional').limit(1).get();
    const profissionalExemplo = profSnap.empty ? null : {
      campos: Object.keys(profSnap.docs[0].data()),
      exemplo: profSnap.docs[0].data(),
    };

    // Exemplo de família
    const famSnap = await db.collection('users').where('perfil', '==', 'cliente').limit(1).get();
    const familiaExemplo = famSnap.empty ? null : {
      campos: Object.keys(famSnap.docs[0].data()),
      exemplo: famSnap.docs[0].data(),
    };

    audit.collections.users = {
      total: usersSnap.size,
      camposDetectados: Array.from(camposUsuarios).sort(),
      distribuicaoPorPerfil: perfis,
      distribuicaoPorUserType: userTypes,
      temCampoPerfil: Object.keys(perfis).length > 0,
      temCampoUserType: Object.keys(userTypes).length > 0,
      profissionalExemplo,
      familiaExemplo,
    };

    // Auditar REQUESTS - buscar TODOS
    console.log('[Audit] Analisando collection requests...');
    const requestsSnap = await db.collection('requests').get();
    const camposRequests = new Set<string>();
    const statusRequests: Record<string, number> = {};
    
    requestsSnap.docs.forEach(doc => {
      const data = doc.data();
      Object.keys(data).forEach(key => camposRequests.add(key));
      
      if (data.status) {
        statusRequests[data.status] = (statusRequests[data.status] || 0) + 1;
      }
    });

    const requestExemplo = requestsSnap.empty ? null : {
      campos: Object.keys(requestsSnap.docs[0].data()),
      exemplo: requestsSnap.docs[0].data(),
    };

    audit.collections.requests = {
      total: requestsSnap.size,
      camposDetectados: Array.from(camposRequests).sort(),
      distribuicaoPorStatus: statusRequests,
      exemplo: requestExemplo,
    };

    // Auditar APPOINTMENTS (se existir)
    console.log('[Audit] Analisando collection appointments...');
    try {
      const appointmentsSnap = await db.collection('appointments').limit(10).get();
      const camposAppointments = new Set<string>();
      
      appointmentsSnap.docs.forEach(doc => {
        Object.keys(doc.data()).forEach(key => camposAppointments.add(key));
      });

      audit.collections.appointments = {
        exists: true,
        total: appointmentsSnap.size,
        camposDetectados: Array.from(camposAppointments).sort(),
        exemplo: appointmentsSnap.empty ? null : appointmentsSnap.docs[0].data(),
      };
    } catch (error) {
      audit.collections.appointments = {
        exists: false,
        error: 'Collection não existe ou está vazia',
      };
    }

    // Auditar MATCHES (se existir)
    console.log('[Audit] Analisando collection matches...');
    try {
      const matchesSnap = await db.collection('matches').limit(10).get();
      const camposMatches = new Set<string>();
      
      matchesSnap.docs.forEach(doc => {
        Object.keys(doc.data()).forEach(key => camposMatches.add(key));
      });

      audit.collections.matches = {
        exists: true,
        total: matchesSnap.size,
        camposDetectados: Array.from(camposMatches).sort(),
        exemplo: matchesSnap.empty ? null : matchesSnap.docs[0].data(),
      };
    } catch (error) {
      audit.collections.matches = {
        exists: false,
        error: 'Collection não existe ou está vazia',
      };
    }

    // Auditar FEEDBACKS
    console.log('[Audit] Analisando collection feedbacks...');
    try {
      const feedbacksSnap = await db.collection('feedbacks').limit(10).get();
      const camposFeedbacks = new Set<string>();
      
      feedbacksSnap.docs.forEach(doc => {
        Object.keys(doc.data()).forEach(key => camposFeedbacks.add(key));
      });

      audit.collections.feedbacks = {
        exists: true,
        total: feedbacksSnap.size,
        camposDetectados: Array.from(camposFeedbacks).sort(),
        exemplo: feedbacksSnap.empty ? null : feedbacksSnap.docs[0].data(),
      };
    } catch (error) {
      audit.collections.feedbacks = {
        exists: false,
        error: 'Collection não existe ou está vazia',
      };
    }

    // Auditar RATINGS
    console.log('[Audit] Analisando collection ratings...');
    try {
      const ratingsSnap = await db.collection('ratings').limit(10).get();
      const camposRatings = new Set<string>();
      
      ratingsSnap.docs.forEach(doc => {
        Object.keys(doc.data()).forEach(key => camposRatings.add(key));
      });

      audit.collections.ratings = {
        exists: true,
        total: ratingsSnap.size,
        camposDetectados: Array.from(camposRatings).sort(),
        exemplo: ratingsSnap.empty ? null : ratingsSnap.docs[0].data(),
      };
    } catch (error) {
      audit.collections.ratings = {
        exists: false,
        error: 'Collection não existe ou está vazia',
      };
    }

    // Análise e recomendações
    audit.analise = {
      problemasEncontrados: [],
      recomendacoes: [],
    };

    if (!audit.collections.users.temCampoPerfil) {
      audit.analise.problemasEncontrados.push('Campo "perfil" não encontrado em users');
    }

    if (audit.collections.users.temCampoUserType) {
      audit.analise.recomendacoes.push('Campo "userType" detectado - considere padronizar para "perfil"');
    }

    if (!audit.collections.appointments.exists && audit.collections.requests.total > 0) {
      audit.analise.recomendacoes.push('Collection "appointments" não existe - sistema usa "requests"');
    }

    if (!audit.collections.matches.exists && audit.collections.requests.total > 0) {
      audit.analise.recomendacoes.push('Collection "matches" não existe - considere usar "requests" filtrado por status');
    }

    return NextResponse.json(audit, { status: 200 });

  } catch (error: any) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to audit data' },
      { status: 500 }
    );
  }
}
