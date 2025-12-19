/**
 * Marketplace Validation Module - Types
 * Validates supply/demand health and match quality
 */

export interface MarketplaceValidationData {
  supplyDemandRatio: SupplyDemandRatio;
  matchQuality: MatchQuality;
  geographicCoverage: GeographicCoverage;
  specialtyBalance: SpecialtyBalance;
  timestamp: string;
}

export interface SupplyDemandRatio {
  currentRatio: number; // professionals / open requests
  status: 'oversupply' | 'balanced' | 'undersupply';
  openRequests: number;
  availableProfessionals: number;
  trend: {
    change: number; // % change vs last week
    direction: 'up' | 'down' | 'stable';
  };
}

export interface MatchQuality {
  averageMatchScore: number; // 0-100
  perfectMatches: number; // 100% score
  goodMatches: number; // 80-99% score
  poorMatches: number; // <80% score
  matchCriteria: {
    specialtyMatch: number; // % with exact specialty match
    locationMatch: number; // % within 10km
    availabilityMatch: number; // % with compatible schedule
  };
}

export interface GeographicCoverage {
  coveredCities: number;
  totalRequests: number;
  requestsByCityTop5: Array<{
    city: string;
    state: string;
    requests: number;
    professionals: number;
    ratio: number;
  }>;
  uncoveredRequests: number; // requests in cities with 0 professionals
}

export interface SpecialtyBalance {
  specialties: Array<{
    name: string;
    openRequests: number;
    professionals: number;
    ratio: number;
    status: 'oversupply' | 'balanced' | 'undersupply';
  }>;
  mostDemanded: string; // specialty with most requests
  leastSupplied: string; // specialty with worst ratio
}
