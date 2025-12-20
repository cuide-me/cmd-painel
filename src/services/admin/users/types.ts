export interface AdminUserRow {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string;
  perfil: 'profissional' | 'cliente';
  porcentagemPerfil: number;
  stripeAccountStatus: string;
  // Customer data (for both clientes and profissionais)
  stripeCustomerId?: string;
  subscriptionStatus?: string; // active, canceled, past_due, trialing, etc.
  subscriptionPlan?: string; // Basic, Pro, Enterprise, etc.
  mrr?: number; // Monthly Recurring Revenue
  paymentMethod?: string; // card, boleto, pix, etc.
  lastPaymentDate?: string;
  nextBillingDate?: string;
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
