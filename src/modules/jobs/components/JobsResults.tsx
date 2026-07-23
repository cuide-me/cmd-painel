import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Section, Table } from '@/components/admin/AdminLayout';
import { formatDate } from '@/lib/admin/formatters';
import type { AdminJobRow, UpdateJobOperationalInput } from '@/services/admin/jobs';

interface JobsResultsProps {
  jobs: AdminJobRow[];
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canManageOperational: boolean;
  onSaveOperational: (jobId: string, input: UpdateJobOperationalInput) => Promise<void>;
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

function isOverdue(dueAt: string | null): boolean {
  return Boolean(dueAt && new Date(dueAt).getTime() < Date.now());
}

function OperationalCell({ job, onManage }: { job: AdminJobRow; onManage: () => void }) {
  const { operational } = job;
  if (operational.status === 'resolved') {
    return <Badge variant="success">Resolvido</Badge>;
  }

  if (operational.status === 'in_progress') {
    return (
      <div className="space-y-1">
        <Badge variant="info">Em acompanhamento</Badge>
        <p className="max-w-44 truncate text-xs text-slate-600">{operational.ownerName || 'Sem responsavel'}</p>
        {operational.dueAt ? <p className={`text-xs ${isOverdue(operational.dueAt) ? 'font-semibold text-rose-700' : 'text-slate-500'}`}>{isOverdue(operational.dueAt) ? 'Prazo vencido: ' : 'Prazo: '}{formatDate(operational.dueAt)}</p> : null}
        {operational.updatedAt ? <p className="text-xs text-slate-500">Atualizado: {formatDate(operational.updatedAt)}</p> : null}
        <button type="button" onClick={onManage} className="text-xs font-semibold text-[#176172] hover:text-[#1195a8]">Atualizar</button>
      </div>
    );
  }

  return <Badge variant="neutral">Sem acompanhamento</Badge>;
}

export function JobsResults({
  jobs,
  totalJobs,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  canManageOperational,
  onSaveOperational,
}: JobsResultsProps) {
  const [selectedJob, setSelectedJob] = useState<AdminJobRow | null>(null);
  const [nextAction, setNextAction] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [status, setStatus] = useState<UpdateJobOperationalInput['status']>('in_progress');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openOperationalForm = (job: AdminJobRow) => {
    setSelectedJob(job);
    setNextAction(job.operational.nextAction || '');
    setDueAt(job.operational.dueAt ? job.operational.dueAt.slice(0, 10) : '');
    setStatus(job.operational.status === 'resolved' ? 'resolved' : 'in_progress');
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedJob) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveOperational(selectedJob.id, {
        nextAction: nextAction.trim() || null,
        dueAt: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
        status,
      });
      setSelectedJob(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Nao foi possivel atualizar a fila.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={`Jobs (${totalJobs})`}>
      <Table
        headers={['ID', 'Cliente', 'Profissional', 'Especialidade', 'Bairro/Regiao', 'Criado', 'Aging', 'Status', 'Criticidade', 'Operacao']}
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
          canManageOperational ? (
            <div className="space-y-2" key={`${job.id}-operational`}>
              <OperationalCell job={job} onManage={() => openOperationalForm(job)} />
              {job.operational.status === 'unassigned' ? (
                <button type="button" onClick={() => openOperationalForm(job)} className="text-xs font-semibold text-[#176172] hover:text-[#1195a8]">Assumir fila</button>
              ) : null}
            </div>
          ) : <OperationalCell job={job} onManage={() => undefined} />,
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

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173842]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="operational-dialog-title">
          <div className="w-full max-w-lg rounded-xl border border-[#b7dde1] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#176172]">Fila operacional</p>
                <h3 id="operational-dialog-title" className="mt-1 text-lg font-semibold text-[#173842]">Acompanhamento do atendimento</h3>
                <p className="mt-1 text-sm text-[#587078]">{selectedJob.clienteNome || 'Cliente nao informado'} · {selectedJob.id}</p>
              </div>
              <button type="button" onClick={() => setSelectedJob(null)} className="rounded-md px-2 py-1 text-sm font-semibold text-[#587078] hover:bg-slate-100" aria-label="Fechar acompanhamento">Fechar</button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="rounded-lg border border-[#b7dde1] bg-[#effafa] p-3 text-sm text-[#173842]">O responsavel sera registrado a partir da sua sessao.</p>
              <label className="block text-sm font-medium text-[#173842]">Proxima acao
                <textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-[#b7dde1] px-3 py-2 text-sm" placeholder="Ex.: ligar para a familia e confirmar disponibilidade" />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#173842]">Prazo
                  <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#b7dde1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium text-[#173842]">Estado
                  <select value={status} onChange={(event) => setStatus(event.target.value as UpdateJobOperationalInput['status'])} className="mt-1.5 w-full rounded-lg border border-[#b7dde1] bg-white px-3 py-2 text-sm">
                    <option value="in_progress">Em acompanhamento</option>
                    <option value="resolved">Resolvido</option>
                  </select>
                </label>
              </div>
              {saveError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{saveError}</p> : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedJob(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar acompanhamento'}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}