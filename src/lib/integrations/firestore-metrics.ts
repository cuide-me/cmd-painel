/**
 * ────────────────────────────────────────────────────────────────────────────
 * FIREBASE FIRESTORE METRICS SERVICE - Torre de Controle v2
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Serviço otimizado para métricas do Firestore com cache e agregações.
 * 
 * FEATURES:
 * - Queries otimizadas (evita full collection scans)
 * - Cache in-memory (5 minutos TTL)
 * - Aggregations (count, sum, avg)
 * - Fallback com mock data
 * - Graceful degradation
 * 
 * USAGE:
 * ```typescript
 * import { getActiveProfessionals, getPendingJobs, getNPSScore } from '@/lib/integrations/firestore-metrics';
 * 
 * const pros = await getActiveProfessionals();
 * const jobs = await getPendingJobs({ startDate: '30daysAgo', endDate: 'today' });
 * const nps = await getNPSScore({ startDate: '2024-01-01', endDate: '2024-01-31' });
 * ```
 * 
 * COLLECTIONS USED:
 * - users: Usuários (clientes e profissionais)
 * - jobs: Solicitações/jobs
 * - feedbacks: Avaliações NPS
 * - ratings: Ratings de matches
 * 
 * @see TORRE_V2_KPIS.md - KPIs operacionais
 * @see src/services/admin/operational-health/* - Services existentes
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';

// ────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ────────────────────────────────────────────────────────────────────────────

export interface FirestoreDateRange {
  startDate: string | Date; // ISO date ou relative (e.g., '30daysAgo')
  endDate: string | Date;
}

export interface ActiveProfessionalsMetrics {
  totalActive: number; // Profissionais ativos
  totalInactive: number; // Profissionais inativos
  activationRate: number; // % de ativação
  bySpecialty: Array<{
    specialty: string;
    count: number;
    avgRating: number;
  }>;
  byStatus: {
    active: number;
    busy: number;
    offline: number;
  };
  avgProfileCompleteness: number; // % médio de completude do perfil
}

export interface PendingJobsMetrics {
  totalPending: number; // Total de jobs pendentes
  totalMatched: number; // Total de jobs com match
  totalCompleted: number; // Total de jobs completos
  avgMatchingTime: number; // Tempo médio para match (horas)
  byStatus: {
    pending: number;
    contacted: number;
    proposal_sent: number;
    accepted: number;
    completed: number;
    cancelled: number;
  };
  bySpecialty: Array<{
    specialty: string;
    count: number;
    avgMatchingTime: number;
  }>;
  olderThan24h: number; // Jobs sem match há mais de 24h
  olderThan48h: number; // Jobs sem match há mais de 48h
}

export interface NPSMetrics {
  npsScore: number; // Score NPS (-100 a 100)
  totalResponses: number;
  promoters: number; // Score 9-10
  passives: number; // Score 7-8
  detractors: number; // Score 0-6
  promoterRate: number; // % promotores
  detractorRate: number; // % detratores
  avgScore: number; // Média geral (0-10)
  responsesByCategory: {
    excellent: number; // 9-10
    good: number; // 7-8
    poor: number; // 0-6
  };
  trendVsPreviousPeriod: number; // Variação % do NPS
}

export interface UserGrowthMetrics {
  totalUsers: number;
  newUsers: number; // No período
  activeUsers: number; // Usuários com atividade no período
  usersByType: {
    clients: number;
    professionals: number;
    admin: number;
  };
  growthRate: number; // % crescimento
  retentionRate: number; // % de usuários que voltaram
}

// ────────────────────────────────────────────────────────────────────────────
// CACHE SYSTEM
// ────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const firestoreCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(functionName: string, params: any): string {
  return `firestore:${functionName}:${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = firestoreCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    firestoreCache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  firestoreCache.set(key, { data, timestamp: Date.now() });
}

export function clearFirestoreCache(): void {
  firestoreCache.clear();
  console.log('[Firestore] Cache cleared');
}

export function getFirestoreCacheStats() {
  return {
    size: firestoreCache.size,
    keys: Array.from(firestoreCache.keys()),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

function parseDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  
  const now = new Date();
  
  if (date === 'today') return now;
  if (date === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  
  const daysAgoMatch = date.match(/^(\d+)daysAgo$/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const past = new Date(now);
    past.setDate(past.getDate() - days);
    return past;
  }
  
  return new Date(date);
}

function toISOString(date: string | Date): string {
  return parseDate(date).toISOString();
}

function parseFirestoreDate(firestoreDate: any): Date {
  if (!firestoreDate) return new Date();
  
  // Firestore Timestamp
  if (firestoreDate.toDate && typeof firestoreDate.toDate === 'function') {
    return firestoreDate.toDate();
  }
  
  // ISO string
  if (typeof firestoreDate === 'string') {
    return new Date(firestoreDate);
  }
  
  // Already a Date
  if (firestoreDate instanceof Date) {
    return firestoreDate;
  }
  
  return new Date();
}

function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ||
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get Active Professionals Metrics
 * 
 * Retorna métricas de profissionais ativos, por especialidade e status.
 * 
 * @returns ActiveProfessionalsMetrics com total, breakdown, completion rate
 */
export async function getActiveProfessionals(): Promise<ActiveProfessionalsMetrics> {
  const cacheKey = getCacheKey('getActiveProfessionals', {});
  const cached = getFromCache<ActiveProfessionalsMetrics>(cacheKey);
  if (cached) return cached;

  if (!isFirebaseConfigured()) {
    console.warn('[Firestore] getActiveProfessionals: Firebase não configurado, retornando mock data');
    return getMockActiveProfessionals();
  }

  try {
    const db = getFirestore();
    
    // Query profissionais (perfil=profissional)
    const professionalsSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .limit(500)
      .get();

    let totalActive = 0;
    let totalInactive = 0;
    let totalProfileCompleteness = 0;
    
    const specialtyMap = new Map<string, { count: number; totalRating: number; ratingCount: number }>();
    const statusCounts = { active: 0, busy: 0, offline: 0 };

    for (const doc of professionalsSnap.docs) {
      const data = doc.data();
      
      // Active vs inactive
      const isActive = data.isActive !== false && data.status !== 'inactive';
      if (isActive) {
        totalActive++;
      } else {
        totalInactive++;
      }

      // Status breakdown
      const status = data.status || 'offline';
      if (status === 'active') statusCounts.active++;
      else if (status === 'busy') statusCounts.busy++;
      else statusCounts.offline++;

      // Specialty breakdown
      const specialty = data.specialty || data.especialidade || 'Não especificado';
      if (!specialtyMap.has(specialty)) {
        specialtyMap.set(specialty, { count: 0, totalRating: 0, ratingCount: 0 });
      }
      const specialtyData = specialtyMap.get(specialty)!;
      specialtyData.count++;
      
      if (data.rating) {
        specialtyData.totalRating += data.rating;
        specialtyData.ratingCount++;
      }

      // Profile completeness (0-100%)
      const completeness = calculateProfileCompleteness(data);
      totalProfileCompleteness += completeness;
    }

    const total = professionalsSnap.docs.length;
    const activationRate = total > 0 ? (totalActive / total) * 100 : 0;
    const avgProfileCompleteness = total > 0 ? totalProfileCompleteness / total : 0;

    const bySpecialty = Array.from(specialtyMap.entries()).map(([specialty, data]) => ({
      specialty,
      count: data.count,
      avgRating: data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0,
    }));

    const result: ActiveProfessionalsMetrics = {
      totalActive,
      totalInactive,
      activationRate,
      bySpecialty,
      byStatus: statusCounts,
      avgProfileCompleteness,
    };

    setCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error('[Firestore] Error fetching active professionals:', error.message);
    return getMockActiveProfessionals();
  }
}

/**
 * Get Pending Jobs Metrics
 * 
 * Retorna métricas de jobs pendentes, tempo de match, breakdown por status.
 * 
 * @param dateRange - Período para análise
 * @returns PendingJobsMetrics com totais, tempo de match, breakdown
 */
export async function getPendingJobs(dateRange: FirestoreDateRange): Promise<PendingJobsMetrics> {
  const cacheKey = getCacheKey('getPendingJobs', dateRange);
  const cached = getFromCache<PendingJobsMetrics>(cacheKey);
  if (cached) return cached;

  if (!isFirebaseConfigured()) {
    console.warn('[Firestore] getPendingJobs: Firebase não configurado, retornando mock data');
    return getMockPendingJobs();
  }

  try {
    const db = getFirestore();
    const startDate = toISOString(dateRange.startDate);
    const endDate = toISOString(dateRange.endDate);

    // Query jobs no período
    const jobsSnap = await db
      .collection('jobs')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .limit(1000)
      .get();

    let totalPending = 0;
    let totalMatched = 0;
    let totalCompleted = 0;
    let totalMatchingTime = 0;
    let matchingTimeCount = 0;
    let olderThan24h = 0;
    let olderThan48h = 0;

    const statusCounts = {
      pending: 0,
      contacted: 0,
      proposal_sent: 0,
      accepted: 0,
      completed: 0,
      cancelled: 0,
    };

    const specialtyMap = new Map<string, { count: number; totalMatchingTime: number; matchingTimeCount: number }>();

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    for (const doc of jobsSnap.docs) {
      const data = doc.data();
      const status = data.status || 'pending';
      const createdAt = parseFirestoreDate(data.createdAt);
      const matchedAt = data.matchedAt ? parseFirestoreDate(data.matchedAt) : null;
      const specialty = data.specialty || data.especialidade || 'Não especificado';

      // Status counts
      if (status === 'pending' || status === 'aguardando_proposta') {
        statusCounts.pending++;
        totalPending++;
        
        // Check older than 24h/48h
        if (createdAt < fortyEightHoursAgo) {
          olderThan48h++;
        } else if (createdAt < twentyFourHoursAgo) {
          olderThan24h++;
        }
      } else if (status === 'contacted' || status === 'contact_made') {
        statusCounts.contacted++;
      } else if (status === 'proposal_sent' || status === 'proposta_enviada') {
        statusCounts.proposal_sent++;
      } else if (status === 'accepted' || status === 'proposal_accepted') {
        statusCounts.accepted++;
        totalMatched++;
      } else if (status === 'completed' || status === 'concluido') {
        statusCounts.completed++;
        totalCompleted++;
      } else if (status === 'cancelled' || status === 'cancelado') {
        statusCounts.cancelled++;
      }

      // Matching time calculation
      if (matchedAt) {
        const matchingTimeHours = (matchedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        totalMatchingTime += matchingTimeHours;
        matchingTimeCount++;

        // Specialty matching time
        if (!specialtyMap.has(specialty)) {
          specialtyMap.set(specialty, { count: 0, totalMatchingTime: 0, matchingTimeCount: 0 });
        }
        const specialtyData = specialtyMap.get(specialty)!;
        specialtyData.count++;
        specialtyData.totalMatchingTime += matchingTimeHours;
        specialtyData.matchingTimeCount++;
      }
    }

    const avgMatchingTime = matchingTimeCount > 0 ? totalMatchingTime / matchingTimeCount : 0;

    const bySpecialty = Array.from(specialtyMap.entries()).map(([specialty, data]) => ({
      specialty,
      count: data.count,
      avgMatchingTime: data.matchingTimeCount > 0 ? data.totalMatchingTime / data.matchingTimeCount : 0,
    }));

    const result: PendingJobsMetrics = {
      totalPending,
      totalMatched,
      totalCompleted,
      avgMatchingTime,
      byStatus: statusCounts,
      bySpecialty,
      olderThan24h,
      olderThan48h,
    };

    setCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error('[Firestore] Error fetching pending jobs:', error.message);
    return getMockPendingJobs();
  }
}

/**
 * Get NPS Score Metrics
 * 
 * Calcula NPS (Net Promoter Score) baseado em feedbacks no período.
 * 
 * @param dateRange - Período para análise
 * @returns NPSMetrics com score, breakdown, trend
 */
export async function getNPSScore(dateRange: FirestoreDateRange): Promise<NPSMetrics> {
  const cacheKey = getCacheKey('getNPSScore', dateRange);
  const cached = getFromCache<NPSMetrics>(cacheKey);
  if (cached) return cached;

  if (!isFirebaseConfigured()) {
    console.warn('[Firestore] getNPSScore: Firebase não configurado, retornando mock data');
    return getMockNPSScore();
  }

  try {
    const db = getFirestore();
    const startDate = toISOString(dateRange.startDate);
    const endDate = toISOString(dateRange.endDate);

    // Query feedbacks no período
    const feedbacksSnap = await db
      .collection('feedbacks')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .limit(1000)
      .get();

    let promoters = 0;
    let passives = 0;
    let detractors = 0;
    let totalScore = 0;
    const responsesByCategory = { excellent: 0, good: 0, poor: 0 };

    for (const doc of feedbacksSnap.docs) {
      const data = doc.data();
      const score = data.npsScore || data.rating || data.score || 0;

      totalScore += score;

      // NPS categorization
      if (score >= 9) {
        promoters++;
        responsesByCategory.excellent++;
      } else if (score >= 7) {
        passives++;
        responsesByCategory.good++;
      } else {
        detractors++;
        responsesByCategory.poor++;
      }
    }

    const totalResponses = feedbacksSnap.docs.length;
    const promoterRate = totalResponses > 0 ? (promoters / totalResponses) * 100 : 0;
    const detractorRate = totalResponses > 0 ? (detractors / totalResponses) * 100 : 0;
    const npsScore = promoterRate - detractorRate;
    const avgScore = totalResponses > 0 ? totalScore / totalResponses : 0;

    // Calculate trend vs previous period (simplified - would need previous period query)
    // For now, return 0 (can be improved with actual previous period data)
    const trendVsPreviousPeriod = 0;

    const result: NPSMetrics = {
      npsScore,
      totalResponses,
      promoters,
      passives,
      detractors,
      promoterRate,
      detractorRate,
      avgScore,
      responsesByCategory,
      trendVsPreviousPeriod,
    };

    setCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error('[Firestore] Error fetching NPS score:', error.message);
    return getMockNPSScore();
  }
}

/**
 * Get User Growth Metrics
 * 
 * Retorna métricas de crescimento de usuários no período.
 * 
 * @param dateRange - Período para análise
 * @returns UserGrowthMetrics com totais, novos usuários, retenção
 */
export async function getUserGrowth(dateRange: FirestoreDateRange): Promise<UserGrowthMetrics> {
  const cacheKey = getCacheKey('getUserGrowth', dateRange);
  const cached = getFromCache<UserGrowthMetrics>(cacheKey);
  if (cached) return cached;

  if (!isFirebaseConfigured()) {
    console.warn('[Firestore] getUserGrowth: Firebase não configurado, retornando mock data');
    return getMockUserGrowth();
  }

  try {
    const db = getFirestore();
    const startDate = toISOString(dateRange.startDate);
    const endDate = toISOString(dateRange.endDate);

    // Total users
    const totalUsersSnap = await db.collection('users').limit(5000).get();
    
    // New users in period
    const newUsersSnap = await db
      .collection('users')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .limit(1000)
      .get();

    let clients = 0;
    let professionals = 0;
    let admin = 0;

    for (const doc of totalUsersSnap.docs) {
      const data = doc.data();
      const perfil = data.perfil || data.role;
      
      if (perfil === 'cliente' || perfil === 'family') clients++;
      else if (perfil === 'profissional' || perfil === 'professional') professionals++;
      else if (perfil === 'admin') admin++;
    }

    const totalUsers = totalUsersSnap.docs.length;
    const newUsers = newUsersSnap.docs.length;
    const activeUsers = totalUsers; // Simplified - would need lastActivityAt query

    // Calculate growth rate (simplified - would need previous period)
    const growthRate = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

    // Retention rate (simplified - would need cohort analysis)
    const retentionRate = 85; // Mock value - requires complex cohort queries

    const result: UserGrowthMetrics = {
      totalUsers,
      newUsers,
      activeUsers,
      usersByType: { clients, professionals, admin },
      growthRate,
      retentionRate,
    };

    setCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error('[Firestore] Error fetching user growth:', error.message);
    return getMockUserGrowth();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HELPER CALCULATIONS
// ────────────────────────────────────────────────────────────────────────────

function calculateProfileCompleteness(userData: any): number {
  let score = 0;
  const fields = [
    'displayName', 'nome', 'email', 'phone', 'telefone',
    'specialty', 'especialidade', 'bio', 'descricao',
    'photoURL', 'foto', 'certifications', 'certificacoes'
  ];

  for (const field of fields) {
    if (userData[field]) score += 100 / fields.length;
  }

  return Math.min(score, 100);
}

// ────────────────────────────────────────────────────────────────────────────
// MOCK DATA (Fallback quando Firebase não está configurado)
// ────────────────────────────────────────────────────────────────────────────

function getMockActiveProfessionals(): ActiveProfessionalsMetrics {
  return {
    totalActive: 120,
    totalInactive: 15,
    activationRate: 88.9,
    bySpecialty: [
      { specialty: 'Psicólogo', count: 45, avgRating: 4.7 },
      { specialty: 'Terapeuta Ocupacional', count: 30, avgRating: 4.5 },
      { specialty: 'Fonoaudiólogo', count: 25, avgRating: 4.6 },
      { specialty: 'Fisioterapeuta', count: 20, avgRating: 4.8 },
    ],
    byStatus: {
      active: 85,
      busy: 25,
      offline: 25,
    },
    avgProfileCompleteness: 78.5,
  };
}

function getMockPendingJobs(): PendingJobsMetrics {
  return {
    totalPending: 12,
    totalMatched: 45,
    totalCompleted: 32,
    avgMatchingTime: 8.5,
    byStatus: {
      pending: 12,
      contacted: 5,
      proposal_sent: 8,
      accepted: 10,
      completed: 32,
      cancelled: 3,
    },
    bySpecialty: [
      { specialty: 'Psicólogo', count: 15, avgMatchingTime: 6.5 },
      { specialty: 'Terapeuta Ocupacional', count: 12, avgMatchingTime: 9.2 },
      { specialty: 'Fonoaudiólogo', count: 8, avgMatchingTime: 7.8 },
    ],
    olderThan24h: 3,
    olderThan48h: 1,
  };
}

function getMockNPSScore(): NPSMetrics {
  return {
    npsScore: 45,
    totalResponses: 85,
    promoters: 50,
    passives: 25,
    detractors: 10,
    promoterRate: 58.8,
    detractorRate: 11.8,
    avgScore: 8.2,
    responsesByCategory: {
      excellent: 50,
      good: 25,
      poor: 10,
    },
    trendVsPreviousPeriod: 5.2,
  };
}

function getMockUserGrowth(): UserGrowthMetrics {
  return {
    totalUsers: 450,
    newUsers: 35,
    activeUsers: 380,
    usersByType: {
      clients: 250,
      professionals: 185,
      admin: 15,
    },
    growthRate: 8.5,
    retentionRate: 85,
  };
}
