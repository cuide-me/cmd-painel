export interface AdminUserRow {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string;
  perfil: 'profissional' | 'cliente';
  porcentagemPerfil: number;
  stripeAccountStatus: string;
}

export interface ListUsersParams {
  pageSize?: number;
  cursor?: any;
  perfilFilter?: 'profissional' | 'cliente' | 'all';
  searchTerm?: string;
}

export interface ListUsersResult {
  users: AdminUserRow[];
  nextCursor?: any;
}
