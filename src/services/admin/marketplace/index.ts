/**
 * Marketplace Validation - Main Index
 * Aggregates all marketplace health metrics
 */

import { getSupplyDemandRatio } from './supplyDemand';
import { getMatchQuality } from './matchQuality';
import { getGeographicCoverage } from './geographicCoverage';
import { getSpecialtyBalance } from './specialtyBalance';
import type { MarketplaceValidationData } from './types';

export async function getMarketplaceValidation(): Promise<MarketplaceValidationData> {
  const [supplyDemandRatio, matchQuality, geographicCoverage, specialtyBalance] = await Promise.all([
    getSupplyDemandRatio(),
    getMatchQuality(),
    getGeographicCoverage(),
    getSpecialtyBalance()
  ]);

  return {
    supplyDemandRatio,
    matchQuality,
    geographicCoverage,
    specialtyBalance,
    timestamp: new Date().toISOString()
  };
}

export * from './types';
