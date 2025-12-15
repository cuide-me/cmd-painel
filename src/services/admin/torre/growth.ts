/**
 * ────────────────────────────────────
 * TORRE DE CONTROLE — CRESCIMENTO
 * ────────────────────────────────────
 * Métricas de ativação, conversão e retenção
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { GrowthSummary } from './types';

/**
 * Calcula taxa de conversão de cadastro → primeira ação
 */
async function calculateFamilySignupConversion(): Promise<number> {
  const db = getFirestore();
  
  try {
    // Total de famílias cadastradas
    const familiesSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();
    
    const totalFamilies = familiesSnap.size;
    
    // Famílias que fizeram pelo menos 1 solicitação
    const requestsSnap = await db.collection('requests').get();
    const uniqueFamiliesWithRequests = new Set();
    
    requestsSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) uniqueFamiliesWithRequests.add(userId);
    });
    
    const familiesWithAction = uniqueFamiliesWithRequests.size;
    
    return totalFamilies > 0 ? (familiesWithAction / totalFamilies) * 100 : 0;
  } catch (error) {
    console.error('[Crescimento] Erro ao calcular conversão de famílias:', error);
    return 0;
  }
}

/**
 * Calcula taxa de ativação de profissionais (perfil 100%)
 */
async function calculateProfessionalActivation(): Promise<number> {
  const db = getFirestore();
  
  try {
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    const total = professionalsSnap.size;
    let activated = 0;
    
    professionalsSnap.docs.forEach(doc => {
      const data = doc.data();
      const isComplete = 
        data.nome &&
        data.cpf &&
        data.telefone &&
        data.dataNascimento &&
        data.especialidades &&
        data.especialidades.length > 0 &&
        data.disponibilidade;
      
      if (isComplete) activated++;
    });
    
    return total > 0 ? (activated / total) * 100 : 0;
  } catch (error) {
    console.error('[Crescimento] Erro ao calcular ativação de profissionais:', error);
    return 0;
  }
}

/**
 * Calcula usuários ativos nos últimos 30 dias
 */
async function calculateActiveUsers30d(): Promise<{ families: number; professionals: number }> {
  const db = getFirestore();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Famílias ativas (com solicitação recente)
    const requestsSnap = await db
      .collection('requests')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const activeFamilies = new Set();
    requestsSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) activeFamilies.add(userId);
    });
    
    // Profissionais ativos (com proposta ou job recente)
    const jobsSnap = await db
      .collection('jobs')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const activeProfessionals = new Set();
    jobsSnap.docs.forEach(doc => {
      const professionalId = doc.data().professionalId;
      if (professionalId) activeProfessionals.add(professionalId);
    });
    
    return {
      families: activeFamilies.size,
      professionals: activeProfessionals.size,
    };
  } catch (error) {
    console.error('[Crescimento] Erro ao calcular usuários ativos:', error);
    return { families: 0, professionals: 0 };
  }
}

/**
 * Calcula retenção (usuários que voltaram após 30 dias)
 */
async function calculateRetention30d(): Promise<number> {
  const db = getFirestore();
  
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Usuários que criaram solicitação entre 60-30 dias atrás
    const oldRequestsSnap = await db
      .collection('requests')
      .where('createdAt', '>=', sixtyDaysAgo)
      .where('createdAt', '<', thirtyDaysAgo)
      .get();
    
    const oldUsers = new Set();
    oldRequestsSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) oldUsers.add(userId);
    });
    
    // Desses, quantos voltaram nos últimos 30 dias?
    const recentRequestsSnap = await db
      .collection('requests')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const recentUsers = new Set();
    recentRequestsSnap.docs.forEach(doc => {
      const userId = doc.data().userId || doc.data().familyId;
      if (userId) recentUsers.add(userId);
    });
    
    let retained = 0;
    oldUsers.forEach(userId => {
      if (recentUsers.has(userId)) retained++;
    });
    
    return oldUsers.size > 0 ? (retained / oldUsers.size) * 100 : 0;
  } catch (error) {
    console.error('[Crescimento] Erro ao calcular retenção:', error);
    return 0;
  }
}

/**
 * Calcula churn rate (usuários que não retornaram)
 */
async function calculateChurnRate(): Promise<number> {
  try {
    const retention = await calculateRetention30d();
    return 100 - retention;
  } catch (error) {
    console.error('[Crescimento] Erro ao calcular churn:', error);
    return 0;
  }
}

/**
 * Retorna resumo completo de crescimento
 */
export async function getGrowthSummary(): Promise<GrowthSummary> {
  try {
    const [
      familySignupConversion,
      professionalActivation,
      activeUsers,
      retention30d,
      churnRate,
    ] = await Promise.all([
      calculateFamilySignupConversion(),
      calculateProfessionalActivation(),
      calculateActiveUsers30d(),
      calculateRetention30d(),
      calculateChurnRate(),
    ]);

    return {
      familySignupConversion: Math.round(familySignupConversion),
      professionalActivation: Math.round(professionalActivation),
      familyActivation30d: activeUsers.families,
      professionalActivation30d: activeUsers.professionals,
      retention30d: Math.round(retention30d),
      churnRate: Math.round(churnRate),
    };
  } catch (error) {
    console.error('[Crescimento] Erro ao gerar resumo:', error);
    return {
      familySignupConversion: 0,
      professionalActivation: 0,
      familyActivation30d: 0,
      professionalActivation30d: 0,
      retention30d: 0,
      churnRate: 0,
    };
  }
}
