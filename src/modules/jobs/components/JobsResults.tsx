import { Badge, Button, Card, EmptyState, Section, Table } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { AdminJobRow } from '@/services/admin/jobs';

interface JobsResultsProps {
  jobs: AdminJobRow[];
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function getStatusBadge(job: AdminJobRow) {
  if (job.status === 'cancelled') return <Badge variant="error">Cancelado</Badge>;
  if (job.status === 'completed') return <Badge variant="success">Concluido</Badge>;
  if (job.status === 'active') return <Badge variant="info">Ativo</Badge>;
  if (job.status === 'matched') return <Badge variant="info">Match</Badge>;
  return <Badge variant="warning">Pendente</Badge>;
}

function getCriticalityBadge(job: AdminJobRow) {
  if (!job.isCritical) return <Badge variant="neutral">Normal</Badge>;

  return (
    <div className="flex flex-col">
      <Badge variant="error">Critico</Badge>
      <span className="text-[10px] text-red-600">{job.criticalReason || 'Aging elevado'}</span>
    </div>
  );
}

export function JobsResults({
  jobs,
  totalJobs,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: JobsResultsProps) {
  return (
    <Section title={`Jobs (${totalJobs})`}>
      <Table
        headers={['ID', 'Cliente', 'Profissional', 'Especialidade', 'Bairro/Regiao', 'Criado', 'Aging', 'Status', 'Criticidade']}
        rows={jobs.map(job => [
          job.id,
          job.clienteNome || 'Nao informado',
          job.profissionalNome || 'Nao informado',
          job.especialidade || job.tipo || 'Nao informado',
          `${job.bairro || 'Nao informado'} / ${job.regiao || 'Nao informado'}`,
          job.createdAt ? formatDate(job.createdAt) : 'Nao informado',
          `${job.agingHours.toFixed(1)}h`,
          getStatusBadge(job),
          getCriticalityBadge(job),
        ])}
        compact
      />

      {totalJobs === 0 && (
        <EmptyState
          icon="🔍"
          title="Nenhum job encontrado"
          description="Ajuste os filtros para ampliar os resultados"
        />
      )}

      {totalPages > 1 && (
        <Card padding="md" className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <p className="text-slate-600" aria-live="polite">
              Pagina {currentPage} de {totalPages} ({totalJobs} jobs)
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onPreviousPage}
                disabled={currentPage === 1}
                className="min-w-24"
              >
                ← Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onNextPage}
                disabled={currentPage === totalPages}
                className="min-w-24"
              >
                Proxima →
              </Button>
            </div>
          </div>
        </Card>
      )}
    </Section>
  );
}