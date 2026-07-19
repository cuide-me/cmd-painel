type JobFields = Record<string, unknown>;

export function getJobClientId(job: JobFields): string | undefined {
  const value = job.clientId || job.familyId || job.clienteId || job.userId;
  return value ? String(value) : undefined;
}

export function getJobProfessionalId(job: JobFields): string | undefined {
  const value = job.professionalId || job.specialistId || job.profissionalId;
  return value ? String(value) : undefined;
}

export function hasJobProfessional(job: JobFields): boolean {
  return getJobProfessionalId(job) !== undefined;
}