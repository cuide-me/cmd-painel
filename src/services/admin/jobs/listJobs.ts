/**
 * Listagem de jobs com dados reais do Firestore
 */

import { type QueryDocumentSnapshot, type DocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore, getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { normalizeJobStatus, type NormalizedJobStatus, hasJobProfessional } from '../statusNormalizer';
import { hoursSince, toDate } from '@/lib/admin/dateHelpers';
import type { AdminJobRow, ListJobsParams, ListJobsResult } from './types';

function buildUserName(data: Record<string, any> | undefined): string {
  if (!data) return 'Nao informado';
  const nome = data.nome || data.displayName || data.name;
  const sobrenome = data.sobrenome || data.lastName;
  if (nome && sobrenome) return `${nome} ${sobrenome}`;
  return nome || 'Nao informado';
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function containsText(value: string | undefined, term: string | undefined): boolean {
  if (!term) return true;
  if (!value) return false;
  return value.toLowerCase().includes(term.toLowerCase());
}

function toCreatedAtIso(value: unknown): string | null {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : null;
}

function resolveCriticality(
  status: NormalizedJobStatus,
  hasProfessional: boolean,
  agingHours: number,
): { isCritical: boolean; reason?: string } {
  if (status === 'pending' && !hasProfessional && agingHours >= 48) {
    return {
      isCritical: true,
      reason: 'Sem profissional apos 48h',
    };
  }

  if (['pending', 'matched', 'active'].includes(status) && agingHours >= 72) {
    return {
      isCritical: true,
      reason: 'Aging operacional acima de 72h',
    };
  }

  return { isCritical: false };
}

function sortByCriticalAndAging(a: AdminJobRow, b: AdminJobRow): number {
  if (a.isCritical !== b.isCritical) {
    return a.isCritical ? -1 : 1;
  }

  if (a.agingHours !== b.agingHours) {
    return b.agingHours - a.agingHours;
  }

  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return dateB - dateA;
}

async function fetchUsersByIds(ids: string[]): Promise<Map<string, Record<string, any>>> {
  const map = new Map<string, Record<string, any>>();
  if (ids.length === 0) return map;

  const app = getFirebaseAdmin();
  const db = getFirestore();

  const chunks: string[][] = [];
  const chunkSize = 50;
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const refs = chunk.map((id) => db.collection('users').doc(id));
    const docs = await db.getAll(...refs);
    docs.forEach((doc: DocumentSnapshot) => {
      if (doc.exists) {
        map.set(doc.id, doc.data() as Record<string, any>);
      }
    });
  }

  return map;
}

export async function listJobs(params?: ListJobsParams): Promise<ListJobsResult> {
  getFirebaseAdmin();
  const db = getFirestore();

  const pageSize = Math.min(Math.max(params?.pageSize || 500, 50), 1000);
  const statusFilter = params?.statusFilter || 'all';
  const searchTerm = cleanText(params?.searchTerm);
  const regionFilter = cleanText(params?.regionFilter);
  const bairroFilter = cleanText(params?.bairroFilter);
  const specialtyFilter = cleanText(params?.specialtyFilter);
  const criticalOnly = params?.criticalOnly === true;
  const agingMinHours = typeof params?.agingMinHours === 'number' && params.agingMinHours > 0
    ? params.agingMinHours
    : undefined;

  let query = db.collection('jobs').limit(pageSize);

  if (params?.cursor) {
    query = query.startAfter(params.cursor) as any;
  }

  const snapshot = await query.get();

  const jobsRaw = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    id: doc.id,
    ...(doc.data() as Record<string, unknown>),
  })) as Array<Record<string, any>>;

  // Coletar ids de usuarios
  const userIds = new Set<string>();
  jobsRaw.forEach((job) => {
    const clienteId = job.clientId || job.familyId || job.clienteId || job.userId;
    const profissionalId = job.professionalId || job.specialistId || job.profissionalId;
    if (clienteId) userIds.add(clienteId);
    if (profissionalId) userIds.add(profissionalId);
  });

  const usersMap = await fetchUsersByIds(Array.from(userIds));

  const mappedJobs: AdminJobRow[] = jobsRaw.map((job) => {
    const clienteId = job.clientId || job.familyId || job.clienteId || job.userId;
    const profissionalId = job.professionalId || job.specialistId || job.profissionalId;

    const clienteNome = buildUserName(usersMap.get(clienteId));
    const profissionalNome = buildUserName(usersMap.get(profissionalId));

    const statusRaw = cleanText(job.status);
    const status = normalizeJobStatus(statusRaw || 'pending');

    const createdAt = toCreatedAtIso(job.createdAt);
    const agingHours = Math.max(0, hoursSince(job.createdAt));
    const hasProfessional = hasJobProfessional(job);
    const criticality = resolveCriticality(status, hasProfessional, agingHours);

    const location = job.location || {};
    const cidade = cleanText(location.cidade) || cleanText(usersMap.get(clienteId)?.cidade);
    const estado = cleanText(location.estado) || cleanText(usersMap.get(clienteId)?.estado);
    const bairro = cleanText(location.bairro) || cleanText(location.neighborhood) || cleanText(usersMap.get(clienteId)?.bairro);
    const regiao =
      cleanText(location.regiao) ||
      cleanText(location.region) ||
      cleanText(location.zona) ||
      (cidade && estado ? `${cidade}/${estado}` : cleanText(cidade));
    const especialidade = cleanText(job.specialty) || cleanText(job.especialidade) || cleanText(job.tipo);
    const tipo = cleanText(job.tipo);
    const titulo = cleanText(job.titulo) || cleanText(job.title);

    return {
      id: job.id,
      statusRaw,
      status,
      clienteId,
      clienteNome,
      profissionalId,
      profissionalNome: profissionalId ? profissionalNome : undefined,
      titulo,
      tipo,
      especialidade,
      bairro,
      regiao,
      cidade,
      estado,
      createdAt,
      agingHours,
      hasProfessional,
      isCritical: criticality.isCritical,
      criticalReason: criticality.reason,
    };
  });

  const summaryByStatus: Record<NormalizedJobStatus, number> = {
    pending: 0,
    matched: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  };

  mappedJobs.forEach((job) => {
    summaryByStatus[job.status] += 1;
  });

  const suggestions = {
    regions: Array.from(new Set(mappedJobs.map((job) => job.regiao).filter(Boolean) as string[])).sort(),
    bairros: Array.from(new Set(mappedJobs.map((job) => job.bairro).filter(Boolean) as string[])).sort(),
    specialties: Array.from(new Set(mappedJobs.map((job) => job.especialidade).filter(Boolean) as string[])).sort(),
  };

  let jobs = [...mappedJobs];

  if (statusFilter !== 'all') {
    jobs = jobs.filter((job) => job.status === statusFilter);
  }

  if (criticalOnly) {
    jobs = jobs.filter((job) => job.isCritical);
  }

  if (agingMinHours) {
    jobs = jobs.filter((job) => job.agingHours >= agingMinHours);
  }

  if (regionFilter) {
    jobs = jobs.filter((job) => containsText(job.regiao, regionFilter));
  }

  if (bairroFilter) {
    jobs = jobs.filter((job) => containsText(job.bairro, bairroFilter));
  }

  if (specialtyFilter) {
    jobs = jobs.filter((job) => containsText(job.especialidade, specialtyFilter));
  }

  if (searchTerm) {
    jobs = jobs.filter((job) =>
      containsText(job.id, searchTerm) ||
      containsText(job.clienteNome, searchTerm) ||
      containsText(job.profissionalNome, searchTerm) ||
      containsText(job.especialidade, searchTerm) ||
      containsText(job.bairro, searchTerm) ||
      containsText(job.regiao, searchTerm)
    );
  }

  jobs.sort(sortByCriticalAndAging);

  const nextCursor = snapshot.docs.length === pageSize
    ? snapshot.docs[snapshot.docs.length - 1]
    : undefined;

  return {
    items: jobs,
    summary: {
      total: mappedJobs.length,
      critical: mappedJobs.filter((job) => job.isCritical).length,
      byStatus: summaryByStatus,
    },
    filtersApplied: {
      statusFilter,
      searchTerm,
      regionFilter,
      bairroFilter,
      specialtyFilter,
      criticalOnly,
      agingMinHours,
    },
    suggestions,
    nextCursor,
  };
}
