import { toDate } from '@/lib/dateUtils';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import type { FamilyHealth, NPSByStage, CohortData, FamilySummary } from './types';

/**
 * ═══════════════════════════════════════════════════════════════
 * SAÚDE OPERACIONAL - FAMILIES SERVICE
 * ═══════════════════════════════════════════════════════════════
 * Métricas de saúde da demanda (famílias)
 */


/**
 * Calcula métricas de saúde das famílias
 */
export async function getFamilyHealth(): Promise<FamilyHealth> {
  const db = getFirestore();

  try {
    // 1. Buscar todas as famílias
    const familiesSnap = await db
      .collection('users')
      .where('perfil', '==', 'cliente')
      .get();

    const families = familiesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
    }));

    const totalRegistered = families.length;

    // 2. Buscar jobs (agendamentos)
    const requestsSnap = await db.collection('jobs').limit(500).get();
    const appointments = requestsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().dataCriacao?.toDate?.() || new Date(0),
      completedAt: doc.data().completedAt?.toDate?.() || doc.data().dataFinalizacao?.toDate?.(),
    }));

    // 3. Atividade recente (30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeFamilies = new Set(
      appointments
        .filter((a: any) => new Date(a.createdAt) >= thirtyDaysAgo)
        .map((a: any) => a.clientId || a.familyId)
        .filter(id => id)
    );

    const totalActive = activeFamilies.size;
    const totalDormant = totalRegistered - totalActive;

    // 4. Taxa de conversão (cadastro → 1º agendamento)
    const familiesWithAppointment = new Set(
      appointments.map((a: any) => a.clientId || a.familyId).filter(id => id)
    );
    const conversionRate = totalRegistered > 0 
      ? (familiesWithAppointment.size / totalRegistered) * 100 
      : 0;

    // 5. Tempo médio até 1ª consulta
    const firstAppointments = new Map<string, any>();
    appointments.forEach((apt: any) => {
      const clientId = apt.clientId || apt.familyId;
      if (!clientId) return;
      if (!firstAppointments.has(clientId) || 
          new Date(apt.createdAt) < new Date(firstAppointments.get(clientId).createdAt)) {
        firstAppointments.set(clientId, apt);
      }
    });

    let totalDays = 0;
    let count = 0;
    firstAppointments.forEach((apt: any, familyId: string) => {
      const family = families.find((f: any) => f.id === familyId);
      if (family && (family as any).createdAt) {
        const daysDiff = Math.floor(
          (new Date(apt.createdAt).getTime() - new Date((family as any).createdAt).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        if (daysDiff >= 0) {
          totalDays += daysDiff;
          count++;
        }
      }
    });

    const avgTimeToFirstAppointment = count > 0 ? Math.round(totalDays / count) : 0;

    // 6. Retenção D30 (% que fazem 2ª consulta em 30 dias)
    const familyAppointmentCounts = new Map<string, any[]>();
    appointments.forEach((apt: any) => {
      const clientId = apt.clientId || apt.familyId;
      if (!clientId) return;
      if (!familyAppointmentCounts.has(clientId)) {
        familyAppointmentCounts.set(clientId, []);
      }
      familyAppointmentCounts.get(clientId)!.push(apt);
    });

    let familiesWith2Plus = 0;
    familyAppointmentCounts.forEach((apts: any[]) => {
      if (apts.length >= 2) {
        const sortedApts = apts.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const daysBetween = Math.floor(
          (new Date(sortedApts[1].createdAt).getTime() - new Date(sortedApts[0].createdAt).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        if (daysBetween <= 30) {
          familiesWith2Plus++;
        }
      }
    });

    const retentionD30 = familiesWithAppointment.size > 0 
      ? (familiesWith2Plus / familiesWithAppointment.size) * 100 
      : 0;

    // 7. No-show rate de famílias
    const noShows = appointments.filter((a: any) => a.noShow && a.noShowBy === 'family').length;
    const noShowRate = appointments.length > 0 ? (noShows / appointments.length) * 100 : 0;

    // 8. NPS por estágio
    const feedbacksSnap = await db
      .collection('feedbacks')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const feedbacks = feedbacksSnap.docs.map(doc => ({
      ...doc.data(),
      score: doc.data().score || 0,
      stage: doc.data().stage || 'overall',
    }));

    const calculateNPS = (scores: number[]) => {
      if (scores.length === 0) return 0;
      const promoters = scores.filter(s => s >= 9).length;
      const detractors = scores.filter(s => s <= 6).length;
      return Math.round(((promoters - detractors) / scores.length) * 100);
    };

    const npsByStage: NPSByStage = {
      preAppointment: calculateNPS(feedbacks.filter((f: any) => f.stage === 'pre').map((f: any) => f.score)),
      postAppointment: calculateNPS(feedbacks.filter((f: any) => f.stage === 'post').map((f: any) => f.score)),
      followUp: calculateNPS(feedbacks.filter((f: any) => f.stage === 'followup').map((f: any) => f.score)),
      overall: calculateNPS(feedbacks.map((f: any) => f.score)),
    };

    // 9. Análise de cohort (últimos 6 meses)
    const cohortAnalysis: CohortData[] = [];
    for (let i = 0; i < 6; i++) {
      const cohortDate = new Date();
      cohortDate.setMonth(cohortDate.getMonth() - i);
      const cohortMonth = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`;
      
      const cohortStart = new Date(cohortDate.getFullYear(), cohortDate.getMonth(), 1);
      const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);
      
      const cohortFamilies = families.filter((f: any) => {
        const createdAt = new Date(f.createdAt);
        return createdAt >= cohortStart && createdAt <= cohortEnd;
      });

      const cohortWithAppointments = cohortFamilies.filter((f: any) => 
        familyAppointmentCounts.has(f.id)
      );

      const retained = cohortWithAppointments.filter((f: any) => {
        const apts = familyAppointmentCounts.get(f.id) || [];
        return apts.length >= 2;
      }).length;

      const retentionRate = cohortFamilies.length > 0 
        ? (retained / cohortFamilies.length) * 100 
        : 0;

      cohortAnalysis.push({
        cohortMonth,
        totalUsers: cohortFamilies.length,
        retained,
        retentionRate: Math.round(retentionRate),
      });
    }

    // 10. Famílias dormentes (precisam reengajamento)
    const dormantFamilies: FamilySummary[] = families
      .filter((f: any) => !activeFamilies.has(f.id))
      .sort((a: any, b: any) => {
        const aLast = appointments
          .filter((apt: any) => apt.familyId === a.id)
          .sort((x: any, y: any) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
        const bLast = appointments
          .filter((apt: any) => apt.familyId === b.id)
          .sort((x: any, y: any) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
        
        if (!aLast && !bLast) return 0;
        if (!aLast) return 1;
        if (!bLast) return -1;
        return new Date(bLast.createdAt).getTime() - new Date(aLast.createdAt).getTime();
      })
      .slice(0, 20)
      .map((f: any) => {
        const familyAppointments = appointments.filter((a: any) => a.familyId === f.id);
        const lastActivity = familyAppointments.length > 0
          ? Math.max(...familyAppointments.map((a: any) => new Date(a.createdAt).getTime()))
          : new Date(f.createdAt).getTime();

        const daysSinceActivity = Math.floor(
          (Date.now() - lastActivity) / (1000 * 60 * 60 * 24)
        );

        let alertLevel: 'none' | 'warning' | 'critical' = 'none';
        if (daysSinceActivity > 60) alertLevel = 'critical';
        else if (daysSinceActivity > 30) alertLevel = 'warning';

        return {
          id: f.id,
          name: f.name || f.displayName || 'Sem nome',
          email: f.email || '',
          registeredAt: f.createdAt ? new Date(f.createdAt).toISOString() : '',
          lastActivity: new Date(lastActivity).toISOString(),
          totalAppointments: familyAppointments.length,
          alertLevel,
        };
      });

    return {
      totalRegistered,
      totalActive,
      totalDormant,
      conversionRate: Math.round(conversionRate),
      avgTimeToFirstAppointment,
      retentionD30: Math.round(retentionD30),
      noShowRate: Math.round(noShowRate * 10) / 10,
      npsByStage,
      cohortAnalysis: cohortAnalysis.reverse(),
      dormantFamilies,
    };
  } catch (error) {
    console.error('[FamilyHealth] Error:', error);
    return {
      totalRegistered: 0,
      totalActive: 0,
      totalDormant: 0,
      conversionRate: 0,
      avgTimeToFirstAppointment: 0,
      retentionD30: 0,
      noShowRate: 0,
      npsByStage: {
        preAppointment: 0,
        postAppointment: 0,
        followUp: 0,
        overall: 0,
      },
      cohortAnalysis: [],
      dormantFamilies: [],
    };
  }
}
