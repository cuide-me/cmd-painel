export interface AdminUserRow {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  perfil: 'profissional' | 'cliente';
  porcentagemPerfil: number;
  stripeAccountStatus: string;
  ativo?: boolean | null;
  createdAt?: string | Date | null;
  cidade?: string;
  estado?: string;
  especialidades?: string[];
  especialidade?: string;

  // Jobs (agregado)
  jobsCriados?: number;
  jobsConcluidos?: number;
  jobsAceitos?: number;
  jobsCancelados?: number;

  // Pagamentos (agregado)
  pagamentosRealizados?: number;

  // Avaliacoes (agregado)
  avaliacaoMedia?: number | null;
  avaliacoesTotal?: number;

  // Tickets (agregado)
  ticketsTotal?: number;

  // Customer data (for both clientes and profissionais)
  stripeCustomerId?: string;
  subscriptionStatus?: string; // active, canceled, past_due, trialing, etc.
  subscriptionPlan?: string; // Basic, Pro, Enterprise, etc.
  mrr?: number; // Monthly Recurring Revenue
  paymentMethod?: string; // card, boleto, pix, etc.
  lastPaymentDate?: string;
  nextBillingDate?: string;

  // Verificação e Documentos
  statusVerificacao?: 'verificado' | 'pendente' | 'reprovado';
  documentosCertificados?: string[]; // URLs Firebase Storage ou links
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
