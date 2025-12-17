import { getFirestore } from 'firebase-admin/firestore';
import type { AdminUserRow, ListUsersParams, ListUsersResult } from './types';

/**
 * Normaliza o status da conta Stripe
 */
function normalizeStripeStatus(data: any): string {
  // Prioridade: stripeStatus.accountStatus > stripe_status > accountStatusConsolidado > accountStatus
  if (data.stripeStatus?.accountStatus) {
    return data.stripeStatus.accountStatus;
  }
  if (data.stripe_status) {
    return data.stripe_status;
  }
  if (data.accountStatusConsolidado) {
    return data.accountStatusConsolidado;
  }
  if (data.accountStatus) {
    return data.accountStatus;
  }
  return 'unknown';
}

/**
 * Converte status Stripe em texto amigável
 */
function friendlyStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    complete: 'Ativada',
    enabled: 'Ativada',
    verified: 'Ativada',
    pending: 'Pendente',
    restricted: 'Restrita',
    restricted_soon: 'Restrita',
    incomplete: 'Pendente',
    rejected: 'Rejeitada',
    unknown: 'Desconhecida',
  };
  return statusMap[status] || status;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let users = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const nome =
      data.nome && data.sobrenome
        ? `${data.nome} ${data.sobrenome}`
        : data.nome || data.displayName || 'Sem nome';

    // Buscar especialidade se for profissional
    const especialidade = data.perfil === 'profissional' 
      ? (data.especialidade || data.category || data.categoria || '-')
      : '-';

    return {
      id: doc.id,
      nome,
      especialidade,
      email: data.email || '',
      telefone: data.telefone || data.phone || '',
      perfil: data.perfil === 'profissional' ? 'profissional' : 'cliente',
      porcentagemPerfil: data.porcentagemPerfil || 0,
      stripeAccountStatus: friendlyStripeStatus(normalizeStripeStatus(data)),
    } as AdminUserRow;
  });

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
