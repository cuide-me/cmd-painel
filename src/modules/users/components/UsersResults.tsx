import { Badge, Button, Card, EmptyState, Section, Table } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { AdminUserRow } from '@/services/admin/users';

type UserProfileFilter = 'all' | 'profissional' | 'cliente';

interface UsersResultsProps {
  users: AdminUserRow[];
  profileFilter: UserProfileFilter;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function formatNumberOrNA(value?: number | null) {
  return value === null || value === undefined ? 'Nao disponivel' : value;
}

function formatDateOrNA(value?: string | Date | null) {
  return value ? formatDate(value) : 'Nao disponivel';
}

function formatStatusBadge(active?: boolean | null) {
  if (active === true) return <Badge variant="success">Ativo</Badge>;
  if (active === false) return <Badge variant="error">Inativo</Badge>;
  return <Badge variant="neutral">Nao disponivel</Badge>;
}

function formatVerificationBadge(status?: string) {
  if (status === 'verificado') return <Badge variant="success">Verificado</Badge>;
  if (status === 'reprovado') return <Badge variant="error">Reprovado</Badge>;
  if (status === 'pendente') return <Badge variant="warning">Pendente</Badge>;
  return <Badge variant="neutral">Nao definido</Badge>;
}

function formatCertificates(documents?: string[]) {
  if (!documents || documents.length === 0) return '-';

  return (
    <div className="flex flex-col gap-1">
      {documents.map((document, index) => (
        <a
          key={index}
          href={document}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[150px] truncate text-xs text-blue-600 underline hover:text-blue-800"
          title={document}
        >
          📄 Cert {index + 1}
        </a>
      ))}
    </div>
  );
}

function formatRating(average?: number | null, total?: number) {
  if (!average || !total) return 'Nao disponivel';
  return `${average.toFixed(1)} (${total})`;
}

function getTableHeaders(profileFilter: UserProfileFilter) {
  if (profileFilter === 'profissional') {
    return ['ID', 'Nome', 'Tipo', 'Bairro', 'Cidade', 'Estado', 'Status', 'Verificacao', 'Cadastro', 'Jobs Aceitos', 'Jobs Concluidos', 'Cancelamentos', 'Avaliacao', 'Stripe', 'Certificados'];
  }

  if (profileFilter === 'cliente') {
    return ['ID', 'Nome', 'Bairro', 'Cidade', 'Estado', 'Status', 'Verificacao', 'Cadastro', 'Jobs Criados', 'Jobs Concluidos', 'Pagamentos', 'Avaliacoes', 'Tickets'];
  }

  return ['ID', 'Nome', 'Perfil', 'Bairro', 'Cidade', 'Estado', 'Status', 'Verificacao', 'Cadastro', 'Jobs', 'Concluidos', 'Cancelamentos', 'Avaliacao', 'Pagamentos', 'Tickets', 'Stripe', 'Certificados'];
}

function getTableRow(user: AdminUserRow, profileFilter: UserProfileFilter) {
  if (profileFilter === 'profissional') {
    const specialties = user.especialidades?.length ? user.especialidades.join(', ') : user.especialidade || '-';
    return [
      user.id,
      user.nome,
      specialties,
      user.bairro || '-',
      user.cidade || '-',
      user.estado || '-',
      formatStatusBadge(user.ativo),
      formatVerificationBadge(user.statusVerificacao),
      formatDateOrNA(user.createdAt),
      formatNumberOrNA(user.jobsAceitos),
      formatNumberOrNA(user.jobsConcluidos),
      formatNumberOrNA(user.jobsCancelados),
      formatRating(user.avaliacaoMedia, user.avaliacoesTotal),
      user.stripeAccountStatus || 'Nao disponivel',
      formatCertificates(user.documentosCertificados),
    ];
  }

  if (profileFilter === 'cliente') {
    return [
      user.id,
      user.nome,
      user.bairro || '-',
      user.cidade || '-',
      user.estado || '-',
      formatStatusBadge(user.ativo),
      formatVerificationBadge(user.statusVerificacao),
      formatDateOrNA(user.createdAt),
      formatNumberOrNA(user.jobsCriados),
      formatNumberOrNA(user.jobsConcluidos),
      formatNumberOrNA(user.pagamentosRealizados),
      formatRating(user.avaliacaoMedia, user.avaliacoesTotal),
      formatNumberOrNA(user.ticketsTotal),
    ];
  }

  const createdOrAcceptedJobs = user.perfil === 'profissional' ? user.jobsAceitos : user.jobsCriados;
  return [
    user.id,
    user.nome,
    user.perfil === 'profissional' ? 'Profissional' : 'Familia',
    user.bairro || '-',
    user.cidade || '-',
    user.estado || '-',
    formatStatusBadge(user.ativo),
    formatVerificationBadge(user.statusVerificacao),
    formatDateOrNA(user.createdAt),
    formatNumberOrNA(createdOrAcceptedJobs),
    formatNumberOrNA(user.jobsConcluidos),
    formatNumberOrNA(user.jobsCancelados),
    formatRating(user.avaliacaoMedia, user.avaliacoesTotal),
    formatNumberOrNA(user.pagamentosRealizados),
    formatNumberOrNA(user.ticketsTotal),
    user.stripeAccountStatus || 'Nao disponivel',
    formatCertificates(user.documentosCertificados),
  ];
}

export function UsersResults({
  users,
  profileFilter,
  totalUsers,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: UsersResultsProps) {
  return (
    <Section title={`Usuarios (${totalUsers})`}>
      <Table headers={getTableHeaders(profileFilter)} rows={users.map(user => getTableRow(user, profileFilter))} compact />

      {totalUsers === 0 && (
        <EmptyState icon="🔍" title="Nenhum usuário encontrado" description="Tente ajustar os filtros" />
      )}

      {totalPages > 1 && (
        <Card padding="md" className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Página {currentPage} de {totalPages} ({totalUsers} usuários)</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onPreviousPage} disabled={currentPage === 1}>
                ← Anterior
              </Button>
              <Button variant="secondary" size="sm" onClick={onNextPage} disabled={currentPage === totalPages}>
                Próxima →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </Section>
  );
}