import { getFirestore } from 'firebase-admin/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getStripeClient } from '@/lib/server/stripe';
import { isJobCompleted, isJobCancelled } from '../statusNormalizer';
import type { AdminUserRow, ListUsersParams, ListUsersResult } from './types';

/**
 * Busca status REAL da conta Stripe Connect via API
 */
async function getStripeAccountStatus(stripeAccountId: string): Promise<string> {
  if (!stripeAccountId) {
    return 'Desconhecida';
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Verifica se a conta pode receber pagamentos
    if (account.charges_enabled && account.payouts_enabled) {
      return 'Ativada';
    }

    // Verifica se está pendente de informações
    if (account.requirements?.currently_due?.length && account.requirements.currently_due.length > 0) {
      return 'Pendente';
    }

    // Verifica se está restrita
    if (account.requirements?.disabled_reason) {
      return 'Restrita';
    }

    // Padrão: incompleta
    return 'Incompleta';
  } catch (error) {
    console.warn(`[Stripe] Erro ao buscar conta ${stripeAccountId}:`, error);
    return 'Erro';
  }
}

/**
 * Lista usuários com paginação e filtros
 *
 * NOTA: Filtro client-side para evitar necessidade de índices compostos no Firestore
 */
export async function listUsers(params?: ListUsersParams): Promise<ListUsersResult> {
  const db = getFirestore();
  const pageSize = params?.pageSize || 1000; // Aumentado para buscar todos os usuários
  const perfilFilter = params?.perfilFilter || 'all';
  const searchTerm = params?.searchTerm?.toLowerCase();

  // Query simples sem WHERE + ORDER BY em campos diferentes
  // Para evitar erro de índice composto, fazemos filtro client-side
  let query;
  
  if (perfilFilter !== 'all') {
    // Se filtrar por perfil, usa WHERE no perfil (sem orderBy)
    query = db.collection('users')
      .where('perfil', '==', perfilFilter)
      .limit(pageSize * 2); // Busca mais documentos para compensar filtros client-side
  } else {
    // Sem filtro, apenas limit
    query = db.collection('users')
      .limit(pageSize);
  }

  // Cursor de paginação
  if (params?.cursor) {
    query = query.startAfter(params.cursor) as any;
  }

  const snapshot = await query.get();

  // IDs de usuarios retornados
  const userIds = new Set<string>(snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.id));

  // ═══════════════════════════════════════════════════════
  // Agregacoes: jobs, pagamentos, avaliacoes, tickets
  // ═══════════════════════════════════════════════════════
  const jobsByClient = new Map<string, { created: number; completed: number; cancelled: number }>();
  const jobsByProfessional = new Map<string, { accepted: number; completed: number; cancelled: number }>();

  const paymentsByUser = new Map<string, number>();
  const ratingsByProfessional = new Map<string, { sum: number; count: number }>();
  const ratingsByUser = new Map<string, { sum: number; count: number }>();
  const ticketsByUser = new Map<string, number>();

  // Jobs
  try {
    const jobsSnap = await db.collection('jobs').get();
    jobsSnap.docs.forEach(doc => {
      const data = doc.data() as Record<string, any>;

      const clientId = data.clientId || data.familyId || data.clienteId || data.userId;
      const professionalId = data.professionalId || data.specialistId || data.profissionalId;

      if (clientId && userIds.has(clientId)) {
        if (!jobsByClient.has(clientId)) {
          jobsByClient.set(clientId, { created: 0, completed: 0, cancelled: 0 });
        }
        const stats = jobsByClient.get(clientId)!;
        stats.created++;
        if (isJobCompleted(data)) stats.completed++;
        if (isJobCancelled(data)) stats.cancelled++;
      }

      if (professionalId && userIds.has(professionalId)) {
        if (!jobsByProfessional.has(professionalId)) {
          jobsByProfessional.set(professionalId, { accepted: 0, completed: 0, cancelled: 0 });
        }
        const stats = jobsByProfessional.get(professionalId)!;
        stats.accepted++;
        if (isJobCompleted(data)) stats.completed++;
        if (isJobCancelled(data)) stats.cancelled++;
      }
    });
  } catch (error) {
    console.warn('[listUsers] Erro ao agregar jobs:', error);
  }

  // Payments (Firestore collection)
  try {
    const paymentsSnap = await db.collection('payments').get();
    paymentsSnap.docs.forEach(doc => {
      const data = doc.data() as Record<string, any>;
      const userId = data.usuarioId || data.userId;
      if (userId && userIds.has(userId)) {
        paymentsByUser.set(userId, (paymentsByUser.get(userId) || 0) + 1);
      }
    });
  } catch (error) {
    console.warn('[listUsers] Erro ao agregar pagamentos:', error);
  }

  // Ratings (Firestore collection)
  try {
    const ratingsSnap = await db.collection('ratings').get();
    ratingsSnap.docs.forEach(doc => {
      const data = doc.data() as Record<string, any>;
      const rating = typeof data.rating === 'number' ? data.rating : null;
      const professionalId = data.professionalId;
      const userId = data.usuarioId || data.userId;

      if (rating !== null && professionalId && userIds.has(professionalId)) {
        const current = ratingsByProfessional.get(professionalId) || { sum: 0, count: 0 };
        current.sum += rating;
        current.count += 1;
        ratingsByProfessional.set(professionalId, current);
      }

      if (rating !== null && userId && userIds.has(userId)) {
        const current = ratingsByUser.get(userId) || { sum: 0, count: 0 };
        current.sum += rating;
        current.count += 1;
        ratingsByUser.set(userId, current);
      }
    });
  } catch (error) {
    console.warn('[listUsers] Erro ao agregar ratings:', error);
  }

  // Tickets (Firestore collection)
  try {
    const ticketsSnap = await db.collection('tickets').get();
    ticketsSnap.docs.forEach(doc => {
      const data = doc.data() as Record<string, any>;
      const userId = data.usuarioId || data.userId;
      if (userId && userIds.has(userId)) {
        ticketsByUser.set(userId, (ticketsByUser.get(userId) || 0) + 1);
      }
    });
  } catch (error) {
    console.warn('[listUsers] Erro ao agregar tickets:', error);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usersPromises = snapshot.docs.map(async (doc: any) => {
    const data = doc.data();
    const nome =
      data.nome && data.sobrenome
        ? `${data.nome} ${data.sobrenome}`
        : data.nome || data.displayName || 'Sem nome';

    // Buscar especialidade se for profissional
    const especialidades = Array.isArray(data.especialidades)
      ? data.especialidades
      : [];
    const especialidade = data.perfil === 'profissional'
      ? (data.especialidade || data.category || data.categoria || especialidades[0] || '-')
      : '-';

    // Buscar status REAL do Stripe API (não do Firebase)
    let stripeAccountStatus = 'Não vinculada';
    const stripeAccountId = 
      data.stripeAccountId || 
      data.stripeStatus?.accountId || 
      data.stripe_account_id;
    
    if (stripeAccountId) {
      stripeAccountStatus = await getStripeAccountStatus(stripeAccountId);
    }

    const jobsCliente = jobsByClient.get(doc.id) || { created: 0, completed: 0, cancelled: 0 };
    const jobsProfissional = jobsByProfessional.get(doc.id) || { accepted: 0, completed: 0, cancelled: 0 };

    const ratingsProf = ratingsByProfessional.get(doc.id);
    const ratingsUser = ratingsByUser.get(doc.id);

    return {
      id: doc.id,
      nome,
      email: data.email || '',
      telefone: data.telefone || data.phone || '',
      perfil: data.perfil === 'profissional' ? 'profissional' : 'cliente',
      porcentagemPerfil: data.porcentagemPerfil || 0,
      stripeAccountStatus,
      ativo: typeof data.ativo === 'boolean' ? data.ativo : null,
      createdAt: data.createdAt || null,
      cidade: data.cidade || '',
      estado: data.estado || '',
      especialidades,
      especialidade,

      jobsCriados: jobsCliente.created,
      jobsConcluidos: data.perfil === 'profissional' ? jobsProfissional.completed : jobsCliente.completed,
      jobsAceitos: jobsProfissional.accepted,
      jobsCancelados: data.perfil === 'profissional' ? jobsProfissional.cancelled : jobsCliente.cancelled,

      pagamentosRealizados: paymentsByUser.get(doc.id) || 0,

      avaliacaoMedia: data.perfil === 'profissional' && ratingsProf && ratingsProf.count > 0
        ? ratingsProf.sum / ratingsProf.count
        : null,
      avaliacoesTotal: data.perfil === 'profissional'
        ? (ratingsProf?.count || 0)
        : (ratingsUser?.count || 0),

      ticketsTotal: ticketsByUser.get(doc.id) || 0,
    } as AdminUserRow;
  });

  // Aguardar todas as promessas do Stripe
  let users = await Promise.all(usersPromises);

  // Filtro client-side por searchTerm
  if (searchTerm) {
    users = users.filter(
      (u: AdminUserRow) => u.nome.toLowerCase().includes(searchTerm) || u.email.toLowerCase().includes(searchTerm)
    );
  }

  // Ordenar por email client-side (evita índice composto no Firestore)
  users.sort((a: AdminUserRow, b: AdminUserRow) => a.email.localeCompare(b.email));

  // Limitar ao pageSize após filtros e ordenação
  users = users.slice(0, pageSize);

  const nextCursor =
    snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : undefined;

  return {
    users,
    nextCursor,
  };
}
