export * from './types';
export * from './getPipelineData';

/**
 * Placeholder para getPipelineOverview
 * TODO: Implementar agregação real
 */
export async function getPipelineOverview() {
  return {
    totalRequests: 0,
    openRequests: 0,
    proposalsSent: 0,
    acceptedProposals: 0,
    hires7d: 0,
    hires30d: 0,
  };
}
