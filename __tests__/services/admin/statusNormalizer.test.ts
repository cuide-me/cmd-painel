import { getEffectiveJobStatus, normalizeJobStatus } from '@/services/admin/statusNormalizer';

describe('job status normalization', () => {
  it('normalizes legacy status aliases regardless of casing, accents, or spaces', () => {
    expect(normalizeJobStatus('EM ANDAMENTO')).toBe('active');
    expect(normalizeJobStatus('Concluido')).toBe('completed');
    expect(normalizeJobStatus('CANCELED')).toBe('cancelled');
  });

  it('treats registered attendance as completed even when the legacy status is stale', () => {
    expect(getEffectiveJobStatus({ status: 'pending', attendanceRegistered: true })).toBe('completed');
  });
});