export * from './types';
export * from './listUsers';

/**
 * Placeholder para getFamiliesSummary
 * TODO: Implementar agregação real
 */
export async function getFamiliesSummary() {
  return {
    total: 0,
    active30d: 0,
    withRequests: 0,
  };
}

/**
 * Placeholder para getProfessionalsSummary
 * TODO: Implementar agregação real
 */
export async function getProfessionalsSummary() {
  return {
    total: 0,
    profileComplete: 0,
    activeProposals: 0,
  };
}
