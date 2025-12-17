/**
 * ═══════════════════════════════════════════════════════════════
 * SAÚDE OPERACIONAL - PROFESSIONALS SERVICE
 * ═══════════════════════════════════════════════════════════════
 * Métricas de saúde da oferta (profissionais)
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { ProfessionalHealth, SpecialtyMetrics, ProfessionalSummary } from './types';

/**
 * Calcula métricas de saúde dos profissionais
 */
export async function getProfessionalHealth(): Promise<ProfessionalHealth> {
  const db = getFirestore();

  try {
    // 1. Buscar todos os profissionais
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    const professionals = professionalsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Buscar requests (agendamentos) e filtrar no código
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const requestsSnap = await db
      .collection('requests')
      .limit(500)
      .get();

    const appointments = requestsSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().dataCriacao?.toDate?.() || new Date(0),
        scheduledAt: doc.data().scheduledAt?.toDate?.() || doc.data().dataAgendamento?.toDate?.(),
        cancelledAt: doc.data().cancelledAt?.toDate?.() || doc.data().dataCancelamento?.toDate?.(),
      }))
      .filter((a: any) => a.createdAt >= thirtyDaysAgo);

    // 3. Calcular métricas gerais
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const professionalsWithActivity = new Set(
      appointments
        .filter((a: any) => new Date(a.createdAt) >= sevenDaysAgo)
        .map((a: any) => a.professionalId)
    );

    const totalActive = professionalsWithActivity.size;
    const totalInactive = professionals.length - totalActive;

    // 4. Taxa de aceitação (appointments aceitos vs criados)
    const totalCreated = appointments.length;
    const totalAccepted = appointments.filter((a: any) => a.status === 'scheduled' || a.status === 'completed').length;
    const acceptanceRate = totalCreated > 0 ? (totalAccepted / totalCreated) * 100 : 0;

    // 5. Taxa de cancelamento pelo profissional
    const canceledByProfessional = appointments.filter((a: any) => a.cancelledBy === 'professional').length;
    const cancellationRate = totalCreated > 0 ? (canceledByProfessional / totalCreated) * 100 : 0;

    // 6. No-show rate de profissionais
    const noShows = appointments.filter((a: any) => a.noShow && a.noShowBy === 'professional').length;
    const noShowRate = totalCreated > 0 ? (noShows / totalCreated) * 100 : 0;

    // 7. Rating médio
    const ratingsSnap = await db
      .collection('ratings')
      .where('ratedType', '==', 'professional')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const ratings = ratingsSnap.docs.map(doc => doc.data().score || 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // 8. Tempo médio de resposta (simulado - precisa implementar tracking real)
    const avgResponseTimeHours = 12; // TODO: implementar tracking real

    // 9. Disponibilidade média (simulado)
    const avgAvailabilitySlots = 15; // TODO: buscar de availability collection

    // 10. Métricas por especialidade
    const specialtyMap = new Map<string, any>();
    
    professionals.forEach((prof: any) => {
      const specialty = prof.specialty || 'Não especificado';
      if (!specialtyMap.has(specialty)) {
        specialtyMap.set(specialty, {
          specialty,
          professionals: [],
          appointments: [],
          ratings: [],
        });
      }
      specialtyMap.get(specialty).professionals.push(prof);
    });

    appointments.forEach((apt: any) => {
      const prof = professionals.find((p: any) => p.id === apt.professionalId);
      if (prof) {
        const specialty = (prof as any).specialty || 'Não especificado';
        if (specialtyMap.has(specialty)) {
          specialtyMap.get(specialty).appointments.push(apt);
        }
      }
    });

    const bySpecialty: SpecialtyMetrics[] = Array.from(specialtyMap.values()).map((data: any) => {
      const totalProfessionals = data.professionals.length;
      const activeCount = data.professionals.filter((p: any) => 
        professionalsWithActivity.has(p.id)
      ).length;
      
      const specialtyAppointments = data.appointments;
      const specialtyAccepted = specialtyAppointments.filter((a: any) => 
        a.status === 'scheduled' || a.status === 'completed'
      ).length;
      
      const acceptanceRate = specialtyAppointments.length > 0 
        ? (specialtyAccepted / specialtyAppointments.length) * 100 
        : 0;

      return {
        specialty: data.specialty,
        totalProfessionals,
        activeCount,
        avgRating: 4.5, // TODO: calcular por especialidade
        avgResponseTime: 12,
        acceptanceRate: Math.round(acceptanceRate),
      };
    });

    // 11. Top performers (maior taxa de aceitação e rating)
    const profWithMetrics = professionals.map((prof: any) => {
      const profAppointments = appointments.filter((a: any) => a.professionalId === prof.id);
      const profAccepted = profAppointments.filter((a: any) => 
        a.status === 'scheduled' || a.status === 'completed'
      ).length;
      const profCanceled = profAppointments.filter((a: any) => 
        a.cancelledBy === 'professional'
      ).length;

      const acceptanceRate = profAppointments.length > 0 
        ? (profAccepted / profAppointments.length) * 100 
        : 0;
      const cancellationRate = profAppointments.length > 0 
        ? (profCanceled / profAppointments.length) * 100 
        : 0;

      const lastActivity = profAppointments.length > 0 
        ? Math.max(...profAppointments.map((a: any) => new Date(a.createdAt).getTime()))
        : new Date(prof.createdAt?.toDate?.() || 0).getTime();

      let alertLevel: 'none' | 'warning' | 'critical' = 'none';
      if (cancellationRate > 20) alertLevel = 'critical';
      else if (cancellationRate > 10) alertLevel = 'warning';
      else if (acceptanceRate < 70) alertLevel = 'warning';

      return {
        ...prof,
        acceptanceRate,
        cancellationRate,
        lastActivity: new Date(lastActivity).toISOString(),
        alertLevel,
      };
    });

    const topPerformers: ProfessionalSummary[] = profWithMetrics
      .filter((p: any) => p.acceptanceRate > 0)
      .sort((a: any, b: any) => b.acceptanceRate - a.acceptanceRate)
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        name: p.name || p.displayName || 'Sem nome',
        specialty: p.specialty || 'Não especificado',
        responseTime: 12,
        acceptanceRate: Math.round(p.acceptanceRate),
        cancellationRate: Math.round(p.cancellationRate),
        rating: 4.5,
        lastActivity: p.lastActivity,
        alertLevel: p.alertLevel,
      }));

    // 12. Profissionais que precisam atenção
    const needsAttention: ProfessionalSummary[] = profWithMetrics
      .filter((p: any) => p.alertLevel !== 'none')
      .sort((a: any, b: any) => {
        if (a.alertLevel === 'critical' && b.alertLevel !== 'critical') return -1;
        if (a.alertLevel !== 'critical' && b.alertLevel === 'critical') return 1;
        return b.cancellationRate - a.cancellationRate;
      })
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        name: p.name || p.displayName || 'Sem nome',
        specialty: p.specialty || 'Não especificado',
        responseTime: 12,
        acceptanceRate: Math.round(p.acceptanceRate),
        cancellationRate: Math.round(p.cancellationRate),
        rating: 4.5,
        lastActivity: p.lastActivity,
        alertLevel: p.alertLevel,
      }));

    return {
      totalActive,
      totalInactive,
      avgResponseTimeHours,
      acceptanceRate: Math.round(acceptanceRate),
      cancellationRate: Math.round(cancellationRate),
      avgAvailabilitySlots,
      avgRating: Math.round(avgRating * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      bySpecialty,
      topPerformers,
      needsAttention,
    };
  } catch (error) {
    console.error('[ProfessionalHealth] Error:', error);
    return {
      totalActive: 0,
      totalInactive: 0,
      avgResponseTimeHours: 0,
      acceptanceRate: 0,
      cancellationRate: 0,
      avgAvailabilitySlots: 0,
      avgRating: 0,
      noShowRate: 0,
      bySpecialty: [],
      topPerformers: [],
      needsAttention: [],
    };
  }
}
