/**
 * Operations KPIs - Torre de Controle
 * Fonte: 100% Firebase
 * Responde: "Onde está o gargalo agora?"
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { OperationsKPIs } from './types';

export async function getOperationsKPIs(): Promise<OperationsKPIs> {
  try {
    const db = getFirestore();
    
    console.log('[Operations] Buscando dados Firebase...');
    
    // 1. Profissionais (total, disponíveis, em atendimento)
    const profissionaisSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    const profissionaisTotal = profissionaisSnap.size;
    console.log('[Operations] Profissionais total:', profissionaisTotal);
    
    // 2. Jobs (últimos 30 dias para métricas)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const jobsSnap = await db
      .collection('jobs')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    
    const jobs = jobsSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        specialistId: data.specialistId || data.professionalId,
        clientId: data.clientId || data.familyId,
        createdAt: toDate(data.createdAt),
        acceptedAt: data.acceptedAt ? toDate(data.acceptedAt) : null,
        completedAt: data.completedAt ? toDate(data.completedAt) : null
      };
    });
    
    console.log('[Operations] Jobs encontrados:', jobs.length);
    
    // 3. SLA Compliance (% jobs aceitos em < 24h)
    const jobsComAceitacao = jobs.filter((j: any) => 
      j.acceptedAt && j.createdAt && j.acceptedAt > j.createdAt
    );
    
    let slaCompliance = 0;
    if (jobsComAceitacao.length > 0) {
      const dentroSLA = jobsComAceitacao.filter((j: any) => {
        const horasAteAceitar = (j.acceptedAt!.getTime() - j.createdAt!.getTime()) / (1000 * 60 * 60);
        return horasAteAceitar <= 24;  // SLA = 24 horas
      });
      slaCompliance = (dentroSLA.length / jobsComAceitacao.length) * 100;
    }
    
    console.log('[Operations] SLA compliance:', slaCompliance.toFixed(1) + '%');
    
    // 4. Taxa de Abandono (jobs criados vs aceitos nos últimos 30 dias)
    const jobsCriados = jobs.filter((j: any) => j.createdAt && j.createdAt >= thirtyDaysAgo);
    const jobsAceitos = jobsCriados.filter((j: any) => j.acceptedAt);
    const taxaAbandono = jobsCriados.length > 0
      ? ((jobsCriados.length - jobsAceitos.length) / jobsCriados.length) * 100
      : 0;
    
    console.log('[Operations] Taxa abandono:', taxaAbandono.toFixed(1) + '%');
    
    // 5. Profissionais em atendimento (jobs com status 'active')
    const jobsAtivos = jobs.filter((j: any) => j.status === 'active');
    const profissionaisEmAtendimento = new Set(
      jobsAtivos
        .map((j: any) => j.specialistId)
        .filter(Boolean)
    ).size;
    
    console.log('[Operations] Profissionais em atendimento:', profissionaisEmAtendimento);
    
    // 6. Profissionais disponíveis
    const profissionaisDisponiveis = Math.max(
      0,
      profissionaisTotal - profissionaisEmAtendimento
    );
    
    console.log('[Operations] Profissionais disponíveis:', profissionaisDisponiveis);
    
    // 7. Capacidade de utilização
    const capacidadeUtilizacao = profissionaisTotal > 0
      ? (profissionaisEmAtendimento / profissionaisTotal) * 100
      : 0;
    
    console.log('[Operations] Capacidade:', capacidadeUtilizacao.toFixed(1) + '%');
    
    return {
      profissionaisDisponiveis,
      profissionaisEmAtendimento,
      profissionaisTotal,
      slaCompliance: Math.round(slaCompliance * 100) / 100,
      taxaAbandono: Math.round(taxaAbandono * 100) / 100,
      capacidadeUtilizacao: Math.round(capacidadeUtilizacao * 100) / 100,
      jobsAtivos: jobsAtivos.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Operations] ❌ Erro ao buscar KPIs:', error);
    
    // Retornar zeros em caso de erro
    return {
      profissionaisDisponiveis: 0,
      profissionaisEmAtendimento: 0,
      profissionaisTotal: 0,
      slaCompliance: 0,
      taxaAbandono: 0,
      capacidadeUtilizacao: 0,
      jobsAtivos: 0,
      timestamp: new Date().toISOString()
    };
  }
}
