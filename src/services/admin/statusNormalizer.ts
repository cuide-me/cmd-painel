/**
 * ═══════════════════════════════════════════════════════
 * JOB STATUS NORMALIZER
 * ═══════════════════════════════════════════════════════
 * Normaliza status de jobs de múltiplas versões (PT/EN)
 * para status padrão
 */

export type NormalizedJobStatus = 
  | 'pending'      // Criado, aguardando profissional
  | 'matched'      // Match realizado (profissional atribuído)
  | 'active'       // Serviço em andamento
  | 'completed'    // Concluído
  | 'cancelled';   // Cancelado

/**
 * Mapeamento de todos os status possíveis → status normalizado
 * Baseado na auditoria real do Firestore
 */
const STATUS_MAP: Record<string, NormalizedJobStatus> = {
  // Pending (job criado, sem profissional)
  'pending': 'pending',
  'pendente': 'pending',
  'open': 'pending',
  
  // Matched (profissional atribuído)
  'matched': 'matched',
  'proposta_aceita': 'matched',
  'accepted': 'matched',
  
  // Active (serviço em andamento)
  'active': 'active',
  'in_progress': 'active',
  
  // Completed (serviço concluído)
  'completed': 'completed',
  'concluido': 'completed',
  
  // Cancelled (cancelado)
  'cancelled': 'cancelled',
  'cancelado': 'cancelled',
};

/**
 * Normaliza status de um job
 */
export function normalizeJobStatus(status: string): NormalizedJobStatus {
  if (!status) {
    console.warn('[StatusNormalizer] Status vazio. Usando "pending" como fallback.');
    return 'pending';
  }

  const normalized = STATUS_MAP[status.toLowerCase()];
  
  if (!normalized) {
    console.warn(`[StatusNormalizer] Status desconhecido: "${status}". Usando "pending" como fallback.`);
    return 'pending';
  }
  
  return normalized;
}

/**
 * Verifica se job está concluído
 * Considera tanto o status quanto a flag attendanceRegistered
 */
export function isJobCompleted(job: any): boolean {
  // Flag explícita de atendimento registrado
  if (job.attendanceRegistered === true) {
    return true;
  }
  
  // Verificar status
  if (!job.status) return false;
  
  const normalized = normalizeJobStatus(job.status);
  return normalized === 'completed';
}

/**
 * Verifica se job está cancelado
 */
export function isJobCancelled(job: any): boolean {
  if (!job.status) return false;
  
  const normalized = normalizeJobStatus(job.status);
  return normalized === 'cancelled';
}

/**
 * Verifica se job está ativo (pending, matched ou active)
 */
export function isJobActive(job: any): boolean {
  if (!job.status) return false;
  
  const normalized = normalizeJobStatus(job.status);
  return ['pending', 'matched', 'active'].includes(normalized);
}

/**
 * Verifica se job tem profissional atribuído
 */
export function hasJobProfessional(job: any): boolean {
  return !!(job.professionalId || job.specialistId);
}

/**
 * Obtém label em português para o status
 */
export function getJobStatusLabel(status: NormalizedJobStatus): string {
  const labels: Record<NormalizedJobStatus, string> = {
    pending: 'Pendente',
    matched: 'Match Realizado',
    active: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  
  return labels[status];
}

/**
 * Filtra jobs por status normalizado
 */
export function filterJobsByStatus(jobs: any[], status: NormalizedJobStatus | 'all'): any[] {
  if (status === 'all') return jobs;
  
  return jobs.filter(job => {
    const normalized = normalizeJobStatus(job.status);
    return normalized === status;
  });
}

/**
 * Conta jobs por status
 */
export function countJobsByStatus(jobs: any[]): Record<NormalizedJobStatus, number> {
  const counts: Record<NormalizedJobStatus, number> = {
    pending: 0,
    matched: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  };
  
  jobs.forEach(job => {
    const status = normalizeJobStatus(job.status);
    counts[status]++;
  });
  
  return counts;
}

/**
 * Normaliza status de ticket
 */
export type NormalizedTicketStatus = 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO';

const TICKET_STATUS_MAP: Record<string, NormalizedTicketStatus> = {
  'a_fazer': 'A_FAZER',
  'open': 'A_FAZER',
  'novo': 'A_FAZER',
  
  'em_atendimento': 'EM_ATENDIMENTO',
  'in_progress': 'EM_ATENDIMENTO',
  
  'concluido': 'CONCLUIDO',
  'resolved': 'CONCLUIDO',
  'closed': 'CONCLUIDO',
  'fechado': 'CONCLUIDO',
};

export function normalizeTicketStatus(status: string): NormalizedTicketStatus {
  if (!status) return 'A_FAZER';
  
  const normalized = TICKET_STATUS_MAP[status.toLowerCase()];
  return normalized || 'A_FAZER';
}
