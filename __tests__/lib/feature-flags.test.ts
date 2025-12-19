/**
 * Feature Flags Tests
 */

import { FEATURES, isFeatureEnabled, enableFeature, disableFeature, getIntegrationsStatus, isTorreV2Ready } from '@/lib/feature-flags';

describe('Feature Flags', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.FEATURE_TORRE_V2;
    delete process.env.FEATURE_GA4;
    delete process.env.FEATURE_STRIPE;
  });

  describe('isFeatureEnabled', () => {
    it('should return a boolean for any feature', () => {
      const result = isFeatureEnabled(FEATURES.TORRE_V2);
      expect(typeof result).toBe('boolean');
    });

    it('should handle runtime overrides', () => {
      enableFeature(FEATURES.GA4);
      expect(isFeatureEnabled(FEATURES.GA4)).toBe(true);
      
      disableFeature(FEATURES.GA4);
      expect(isFeatureEnabled(FEATURES.GA4)).toBe(false);
    });

    it('should handle invalid feature name', () => {
      expect(isFeatureEnabled('INVALID_FEATURE' as any)).toBe(false);
    });
  });

  describe('enableFeature / disableFeature', () => {
    it('should enable feature', () => {
      enableFeature(FEATURES.GA4);
      expect(isFeatureEnabled(FEATURES.GA4)).toBe(true);
    });

    it('should disable feature', () => {
      disableFeature(FEATURES.TORRE_V2);
      expect(isFeatureEnabled(FEATURES.TORRE_V2)).toBe(false);
    });
  });

  describe('getIntegrationsStatus', () => {
    it('should return status of all integrations', () => {
      const status = getIntegrationsStatus();
      
      expect(status).toHaveProperty('firebase');
      expect(status).toHaveProperty('ga4');
      expect(status).toHaveProperty('stripe');
      expect(status.firebase).toHaveProperty('enabled');
      expect(status.firebase).toHaveProperty('configured');
    });
  });

  describe('isTorreV2Ready', () => {
    it('should return false if core features are disabled', () => {
      disableFeature(FEATURES.TORRE_V2);
      const result = isTorreV2Ready();
      expect(result.ready).toBe(false);
      expect(result.missingIntegrations.length).toBeGreaterThan(0);
    });

    it('should return true if all required integrations are enabled', () => {
      enableFeature(FEATURES.TORRE_V2);
      const result = isTorreV2Ready();
      expect(result).toHaveProperty('ready');
      expect(result).toHaveProperty('missingIntegrations');
      expect(result).toHaveProperty('warnings');
    });

    it('should list missing integrations', () => {
      disableFeature(FEATURES.TORRE_V2);
      const { ready, missingIntegrations } = isTorreV2Ready();
      
      expect(ready).toBe(false);
      expect(missingIntegrations.length).toBeGreaterThan(0);
    });
  });
});
