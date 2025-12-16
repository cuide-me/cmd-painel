/**
 * ═══════════════════════════════════════════════════════════════
 * SAÚDE OPERACIONAL - MATCH QUALITY SERVICE
 * ═══════════════════════════════════════════════════════════════
 * Métricas de qualidade do match profissional-família
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { MatchQuality, MatchSpecialtyMetrics, MatchSummary } from './types';

/**
 * Calcula métricas de qualidade do match
 */
export async function getMatchQuality(): Promise<MatchQuality> {
  const db = getFirestore();

  try {
    // 1. Buscar matches dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchesSnap = await db
      .collection('matches')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const matches = matchesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      acceptedAt: doc.data().acceptedAt?.toDate(),
      declinedAt: doc.data().declinedAt?.toDate(),
    }));

    const totalMatches = matches.length;

    // 2. Taxa de aceitação e recusa
    const acceptedMatches = matches.filter((m: any) => m.status === 'accepted' || m.acceptedAt);
    const declinedMatches = matches.filter((m: any) => m.status === 'declined' || m.declinedAt);
    
    const acceptedRate = totalMatches > 0 ? (acceptedMatches.length / totalMatches) * 100 : 0;
    const declinedRate = totalMatches > 0 ? (declinedMatches.length / totalMatches) * 100 : 0;

    // 3. Taxa de rematch (famílias que solicitaram outro profissional)
    const familyMatchCounts = new Map<string, number>();
    matches.forEach((m: any) => {
      familyMatchCounts.set(m.familyId, (familyMatchCounts.get(m.familyId) || 0) + 1);
    });
    
    const familiesWithRematch = Array.from(familyMatchCounts.values()).filter(count => count > 1).length;
    const uniqueFamilies = familyMatchCounts.size;
    const rematchRate = uniqueFamilies > 0 ? (familiesWithRematch / uniqueFamilies) * 100 : 0;

    // 4. Tempo médio de match (criação até aceitação)
    const matchesWithAcceptTime = acceptedMatches.filter((m: any) => m.acceptedAt && m.createdAt);
    let totalMinutes = 0;
    
    matchesWithAcceptTime.forEach((m: any) => {
      const minutes = (new Date(m.acceptedAt).getTime() - new Date(m.createdAt).getTime()) / (1000 * 60);
      totalMinutes += minutes;
    });

    const avgMatchTimeMinutes = matchesWithAcceptTime.length > 0 
      ? Math.round(totalMinutes / matchesWithAcceptTime.length) 
      : 0;

    // 5. Satisfação do primeiro encontro
    const ratingsSnap = await db
      .collection('ratings')
      .where('ratingType', '==', 'first_meeting')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    const firstMeetingRatings = ratingsSnap.docs.map(doc => doc.data().score || 0);
    const firstMeetingSatisfaction = firstMeetingRatings.length > 0
      ? firstMeetingRatings.reduce((a, b) => a + b, 0) / firstMeetingRatings.length
      : 0;

    // 6. Quality Score geral (0-100)
    // Baseado em: taxa de aceitação (40%), tempo de match (30%), satisfação (30%)
    const acceptanceScore = acceptedRate * 0.4;
    const timeScore = avgMatchTimeMinutes < 60 ? 30 : avgMatchTimeMinutes < 120 ? 20 : 10;
    const satisfactionScore = (firstMeetingSatisfaction / 5) * 30;
    const qualityScore = Math.round(acceptanceScore + timeScore + satisfactionScore);

    // 7. Métricas por especialidade
    const specialtyMap = new Map<string, any[]>();
    
    for (const match of matches) {
      const m = match as any;
      try {
        const profDoc = await db.collection('users').doc(m.professionalId).get();
        const specialty = profDoc.data()?.specialty || 'Não especificado';
        
        if (!specialtyMap.has(specialty)) {
          specialtyMap.set(specialty, []);
        }
        specialtyMap.get(specialty)!.push(match);
      } catch (error) {
        console.error('[MatchQuality] Error fetching professional:', error);
      }
    }

    const matchesBySpecialty: MatchSpecialtyMetrics[] = Array.from(specialtyMap.entries()).map(([specialty, specialtyMatches]) => {
      const totalMatches = specialtyMatches.length;
      const accepted = specialtyMatches.filter((m: any) => m.status === 'accepted' || m.acceptedAt).length;
      const acceptedRate = totalMatches > 0 ? (accepted / totalMatches) * 100 : 0;

      const withTime = specialtyMatches.filter((m: any) => m.acceptedAt && m.createdAt);
      const avgTime = withTime.length > 0
        ? withTime.reduce((sum: number, m: any) => {
            const minutes = (new Date(m.acceptedAt).getTime() - new Date(m.createdAt).getTime()) / (1000 * 60);
            return sum + minutes;
          }, 0) / withTime.length
        : 0;

      return {
        specialty,
        totalMatches,
        acceptedRate: Math.round(acceptedRate),
        avgMatchTime: Math.round(avgTime),
        satisfactionScore: Math.round(firstMeetingSatisfaction * 10) / 10,
      };
    });

    // 8. Matches recentes com detalhes
    const recentMatches: MatchSummary[] = await Promise.all(
      matches
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
        .map(async (m: any) => {
          try {
            const [familyDoc, profDoc] = await Promise.all([
              db.collection('users').doc(m.familyId).get(),
              db.collection('users').doc(m.professionalId).get(),
            ]);

            const matchTimeMinutes = m.acceptedAt && m.createdAt
              ? Math.round((new Date(m.acceptedAt).getTime() - new Date(m.createdAt).getTime()) / (1000 * 60))
              : undefined;

            return {
              id: m.id,
              familyId: m.familyId,
              familyName: familyDoc.data()?.name || familyDoc.data()?.displayName || 'Sem nome',
              professionalId: m.professionalId,
              professionalName: profDoc.data()?.name || profDoc.data()?.displayName || 'Sem nome',
              specialty: profDoc.data()?.specialty || 'Não especificado',
              createdAt: new Date(m.createdAt).toISOString(),
              acceptedAt: m.acceptedAt ? new Date(m.acceptedAt).toISOString() : undefined,
              declinedAt: m.declinedAt ? new Date(m.declinedAt).toISOString() : undefined,
              matchTimeMinutes,
              status: m.status || 'pending',
              satisfactionScore: m.satisfactionScore,
            };
          } catch (error) {
            console.error('[MatchQuality] Error fetching match details:', error);
            return {
              id: m.id,
              familyId: m.familyId,
              familyName: 'Erro ao carregar',
              professionalId: m.professionalId,
              professionalName: 'Erro ao carregar',
              specialty: 'Desconhecido',
              createdAt: new Date(m.createdAt).toISOString(),
              status: m.status || 'pending',
            };
          }
        })
    );

    return {
      totalMatches,
      acceptedRate: Math.round(acceptedRate),
      declinedRate: Math.round(declinedRate),
      rematchRate: Math.round(rematchRate),
      avgMatchTimeMinutes,
      firstMeetingSatisfaction: Math.round(firstMeetingSatisfaction * 10) / 10,
      qualityScore,
      matchesBySpecialty,
      recentMatches,
    };
  } catch (error) {
    console.error('[MatchQuality] Error:', error);
    return {
      totalMatches: 0,
      acceptedRate: 0,
      declinedRate: 0,
      rematchRate: 0,
      avgMatchTimeMinutes: 0,
      firstMeetingSatisfaction: 0,
      qualityScore: 0,
      matchesBySpecialty: [],
      recentMatches: [],
    };
  }
}
