import { getFirestore } from 'firebase-admin/firestore';
import { getStripeClient } from '@/lib/server/stripe';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usersPromises = snapshot.docs.map(async (doc: any) => {
    const data = doc.data();
    const nome =
      data.nome && data.sobrenome
        ? `${data.nome} ${data.sobrenome}`
        : data.nome || data.displayName || 'Sem nome';

    // Buscar especialidade se for profissional
    const especialidade = data.perfil === 'profissional' 
      ? (data.especialidade || data.category || data.categoria || '-')
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

    return {
      id: doc.id,
      nome,
      especialidade,
      email: data.email || '',
      telefone: data.telefone || data.phone || '',
      perfil: data.perfil === 'profissional' ? 'profissional' : 'cliente',
      porcentagemPerfil: data.porcentagemPerfil || 0,
      stripeAccountStatus,
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
