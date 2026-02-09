export * from './types';
export * from './listUsers';

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

/**
 * Retorna resumo de famílias do Firestore
 * - Total de famílias (perfil=cliente)
 * - Ativas nos últimos 30 dias (com jobs)
 * - Com jobs criados
 */
export async function getFamiliesSummary() {
  try {
    const app = getFirebaseAdmin();
    const db = getFirestore(app);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total de famílias
    const familiesSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();
    
    const total = familiesSnap.size;

    // Requests dos últimos 30 dias
    const recentRequestsSnap = await db
      .collection('jobs')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const activeFamilies = new Set<string>();
    const familiesWithRequests = new Set<string>();

    recentRequestsSnap.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.clientId || data.familyId || data.clienteId || data.userId;
      if (userId) {
        activeFamilies.add(userId);
        familiesWithRequests.add(userId);
      }
    });

    // Todas as requests (histórico total)
    const allRequestsSnap = await db.collection('jobs').get();
    allRequestsSnap.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.clientId || data.familyId || data.clienteId || data.userId;
      if (userId) familiesWithRequests.add(userId);
    });

    return {
      total,
      active30d: activeFamilies.size,
      withRequests: familiesWithRequests.size,
    };
  } catch (error) {
    console.error('[getFamiliesSummary] Error:', error);
    return {
      total: 0,
      active30d: 0,
      withRequests: 0,
    };
  }
}

/**
 * Retorna resumo de profissionais do Firestore
 * - Total de cuidadores (perfil=profissional)
 * - Com perfil completo (profileComplete=true ou >= 90% campos preenchidos)
 * - Com propostas ativas
 */
export async function getProfessionalsSummary() {
  try {
    const app = getFirebaseAdmin();
    const db = getFirestore(app);

    // Total de profissionais
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    const total = professionalsSnap.size;

    // Contar perfis completos
    let profileComplete = 0;
    professionalsSnap.docs.forEach(doc => {
      const data = doc.data();
      
      // Considera completo se tiver profileComplete=true OU todos campos essenciais
      const isComplete = data.profileComplete === true || 
        (data.name && data.email && data.phone && data.address && 
         data.experience && data.specialties && data.certifications);
      
      if (isComplete) profileComplete++;
    });

    // Propostas ativas (proposals com status pending ou active)
    const proposalsSnap = await db
      .collection('proposals')
      .where('status', 'in', ['pending', 'active'])
      .get();

    const professionalsWithProposals = new Set<string>();
    proposalsSnap.docs.forEach(doc => {
      const data = doc.data();
      const professionalId = data.specialistId || data.professionalId;
      if (professionalId) professionalsWithProposals.add(professionalId);
    });

    return {
      total,
      profileComplete,
      activeProposals: professionalsWithProposals.size,
    };
  } catch (error) {
    console.error('[getProfessionalsSummary] Error:', error);
    return {
      total: 0,
      profileComplete: 0,
      activeProposals: 0,
    };
  }
}
