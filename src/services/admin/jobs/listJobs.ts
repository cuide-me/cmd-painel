/**
 * Listagem de jobs com dados reais do Firestore
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
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

async function fetchUsersByIds(ids: string[]): Promise<Map<string, Record<string, any>>> {
  const map = new Map<string, Record<string, any>>();
  if (ids.length === 0) return map;

  const app = getFirebaseAdmin();
  const db = getFirestore(app);

  const chunks: string[][] = [];
  const chunkSize = 50;
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const refs = chunk.map((id) => db.collection('users').doc(id));
    const docs = await db.getAll(...refs);
    docs.forEach((doc) => {
      if (doc.exists) {
        map.set(doc.id, doc.data() as Record<string, any>);
      }
    });
  }

  return map;
}

export async function listJobs(params?: ListJobsParams): Promise<ListJobsResult> {
  const app = getFirebaseAdmin();
  const db = getFirestore(app);

  const pageSize = params?.pageSize || 500;
  const statusFilter = params?.statusFilter || 'all';
  const searchTerm = params?.searchTerm?.toLowerCase();

  let query = db.collection('jobs').limit(pageSize);

  if (params?.cursor) {
    query = query.startAfter(params.cursor) as any;
  }

  const snapshot = await query.get();

  const jobsRaw = snapshot.docs.map((doc) => ({
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

  let jobs: AdminJobRow[] = jobsRaw.map((job) => {
    const clienteId = job.clientId || job.familyId || job.clienteId || job.userId;
    const profissionalId = job.professionalId || job.specialistId || job.profissionalId;

    const clienteNome = buildUserName(usersMap.get(clienteId));
    const profissionalNome = buildUserName(usersMap.get(profissionalId));

    const statusRaw = job.status;
    const status = normalizeJobStatus(statusRaw || 'pending');

    const createdAt = job.createdAt || null;
    const semMatch48h = !hasJobProfessional(job) && hoursSince(createdAt) >= 48;

    const cidade = job.cidade || usersMap.get(clienteId)?.cidade || '';
    const estado = job.estado || usersMap.get(clienteId)?.estado || '';

    return {
      id: job.id,
      statusRaw,
      status,
      clienteId,
      clienteNome,
      profissionalId,
      profissionalNome: profissionalId ? profissionalNome : undefined,
      titulo: job.titulo || job.title,
      tipo: job.tipo,
      especialidade: job.specialty || job.especialidade,
      cidade,
      estado,
      valor: typeof job.valor === 'number' ? job.valor : undefined,
      paymentId: job.paymentId,
      createdAt,
      completedAt: job.completedAt || null,
      semMatch48h,
    };
  });

  // Filtro por status (client-side)
  if (statusFilter !== 'all') {
    jobs = jobs.filter((job) => job.status === statusFilter);
  }

  // Filtro por searchTerm (id, cliente, profissional)
  if (searchTerm) {
    jobs = jobs.filter((job) =>
      job.id.toLowerCase().includes(searchTerm) ||
      (job.clienteNome || '').toLowerCase().includes(searchTerm) ||
      (job.profissionalNome || '').toLowerCase().includes(searchTerm)
    );
  }

  const nextCursor = snapshot.docs.length === pageSize
    ? snapshot.docs[snapshot.docs.length - 1]
    : undefined;

  return {
    jobs,
    nextCursor,
  };
}
