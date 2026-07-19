import { getJobClientId, getJobProfessionalId, hasJobProfessional } from '@/modules/shared/domain/job-fields';

describe('job field aliases', () => {
  it('uses the first available client identifier alias', () => {
    expect(getJobClientId({ clientId: 'client-1', familyId: 'family-1' })).toBe('client-1');
    expect(getJobClientId({ familyId: 'family-1' })).toBe('family-1');
    expect(getJobClientId({ clienteId: 42 })).toBe('42');
    expect(getJobClientId({})).toBeUndefined();
  });

  it('uses the first available professional identifier alias', () => {
    expect(getJobProfessionalId({ professionalId: 'professional-1', specialistId: 'specialist-1' })).toBe('professional-1');
    expect(getJobProfessionalId({ specialistId: 'specialist-1' })).toBe('specialist-1');
    expect(getJobProfessionalId({ profissionalId: 17 })).toBe('17');
    expect(getJobProfessionalId({})).toBeUndefined();
  });

  it('identifies jobs that have a professional through any legacy alias', () => {
    expect(hasJobProfessional({ professionalId: 'professional-1' })).toBe(true);
    expect(hasJobProfessional({ specialistId: 'specialist-1' })).toBe(true);
    expect(hasJobProfessional({ profissionalId: 'professional-1' })).toBe(true);
    expect(hasJobProfessional({})).toBe(false);
  });
});