/**
 * TORRE DE CONTROLE V3 - CONVERSION FUNNEL
 * Funil de conversão baseado em Firebase (não GA4)
 * Stages: user_created → job_created → job_accepted → job_paid → job_completed
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';
import type { ConversionFunnel, FunnelStage, FunnelStageName } from './types';

// ═══════════════════════════════════════════════════════════════
// MAIN FUNNEL CALCULATOR
// ═══════════════════════════════════════════════════════════════

export async function getConversionFunnel(period: 'week' | 'month' | 'quarter' = 'month'): Promise<ConversionFunnel> {
  console.log('[Conversion Funnel] Calculando funil de conversão...');
  
  getFirebaseAdmin();
  const db = getFirestore();
  
  try {
    // Definir período
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    // STAGE 1: Usuários criados (clientes apenas)
    const usersSnap = await db.collection('users')
      .where('perfil', '==', 'cliente')
      .where('createdAt', '>=', startDate)
      .limit(500)
      .get();
    
    const totalUsers = usersSnap.size;
    const userIds = new Set<string>();
    usersSnap.forEach(doc => userIds.add(doc.id));
    
    // STAGE 2: Jobs criados por esses usuários
    const jobsSnap = await db.collection('jobs')
      .where('createdAt', '>=', startDate)
      .limit(500)
      .get();
    
    let jobsCreated = 0;
    let jobsAccepted = 0;
    let jobsPaid = 0;
    let jobsCompleted = 0;
    
    const jobsByUser = new Map<string, number>();
    
    jobsSnap.forEach(doc => {
      const data = doc.data();
      const clientId = data.clientId || data.familyId;
      
      // Contar apenas jobs de usuários do período
      if (clientId && userIds.has(clientId)) {
        jobsCreated++;
        jobsByUser.set(clientId, (jobsByUser.get(clientId) || 0) + 1);
        
        // STAGE 3: Jobs aceitos
        if (data.status === 'accepted' || data.status === 'completed') {
          jobsAccepted++;
          
          // STAGE 4: Jobs pagos
          if (data.paymentStatus === 'paid' || data.status === 'completed') {
            jobsPaid++;
            
            // STAGE 5: Jobs completados
            if (data.status === 'completed') {
              jobsCompleted++;
            }
          }
        }
      }
    });
    
    // Usuários que criaram pelo menos 1 job
    const usersWhoCreatedJob = jobsByUser.size;
    
    // Construir funil
    const stages: FunnelStage[] = [
      {
        name: 'Usuário Cadastrado',
        count: totalUsers,
        percentage: 100,
        dropOff: totalUsers > 0 ? ((totalUsers - usersWhoCreatedJob) / totalUsers) * 100 : 0,
        conversionRate: totalUsers > 0 ? (usersWhoCreatedJob / totalUsers) * 100 : 0,
      },
      {
        name: 'Job Criado',
        count: jobsCreated,
        percentage: totalUsers > 0 ? (jobsCreated / totalUsers) * 100 : 0,
        dropOff: jobsCreated > 0 ? ((jobsCreated - jobsAccepted) / jobsCreated) * 100 : 0,
        conversionRate: jobsCreated > 0 ? (jobsAccepted / jobsCreated) * 100 : 0,
      },
      {
        name: 'Job Aceito',
        count: jobsAccepted,
        percentage: totalUsers > 0 ? (jobsAccepted / totalUsers) * 100 : 0,
        dropOff: jobsAccepted > 0 ? ((jobsAccepted - jobsPaid) / jobsAccepted) * 100 : 0,
        conversionRate: jobsAccepted > 0 ? (jobsPaid / jobsAccepted) * 100 : 0,
      },
      {
        name: 'Pagamento Realizado',
        count: jobsPaid,
        percentage: totalUsers > 0 ? (jobsPaid / totalUsers) * 100 : 0,
        dropOff: jobsPaid > 0 ? ((jobsPaid - jobsCompleted) / jobsPaid) * 100 : 0,
        conversionRate: jobsPaid > 0 ? (jobsCompleted / jobsPaid) * 100 : 0,
      },
      {
        name: 'Serviço Concluído',
        count: jobsCompleted,
        percentage: totalUsers > 0 ? (jobsCompleted / totalUsers) * 100 : 0,
        dropOff: 0, // Último estágio
        conversionRate: 100, // Chegou ao fim
      },
    ];
    
    // Overall conversion rate (do topo ao fundo)
    const overallConversionRate = totalUsers > 0 ? (jobsCompleted / totalUsers) * 100 : 0;
    
    // Identificar gargalo (maior drop-off)
    let bottleneck = stages[0].name;
    let maxDropOff = 0;
    stages.forEach(stage => {
      if (stage.dropOff > maxDropOff) {
        maxDropOff = stage.dropOff;
        bottleneck = stage.name;
      }
    });
    
    console.log('[Conversion Funnel] ✅ Funil calculado:', {
      totalUsers,
      jobsCreated,
      jobsAccepted,
      jobsPaid,
      jobsCompleted,
      overallConversionRate: overallConversionRate.toFixed(2) + '%',
      bottleneck,
    });
    
    return {
      stages,
      overallConversionRate,
      bottleneck,
    };
  } catch (error) {
    console.error('[Conversion Funnel] ❌ Erro:', error);
    return getEmptyFunnel();
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Empty Funnel
// ═══════════════════════════════════════════════════════════════

function getEmptyFunnel(): ConversionFunnel {
  return {
    stages: [
      {
        name: 'Usuário Cadastrado',
        count: 0,
        percentage: 100,
        dropOff: 0,
        conversionRate: 0,
      },
      {
        name: 'Job Criado',
        count: 0,
        percentage: 0,
        dropOff: 0,
        conversionRate: 0,
      },
      {
        name: 'Job Aceito',
        count: 0,
        percentage: 0,
        dropOff: 0,
        conversionRate: 0,
      },
      {
        name: 'Pagamento Realizado',
        count: 0,
        percentage: 0,
        dropOff: 0,
        conversionRate: 0,
      },
      {
        name: 'Serviço Concluído',
        count: 0,
        percentage: 0,
        dropOff: 0,
        conversionRate: 100,
      },
    ],
    overallConversionRate: 0,
    bottleneck: 'Usuário Cadastrado',
  };
}
