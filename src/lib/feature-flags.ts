/**
 * Feature Flags System
 * Simple feature flag management for controlling features in production
 */

const hasFirebaseServerConfig = Boolean(
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ||
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL)
);

const hasGa4Property = Boolean(
  process.env.GA4_PROPERTY_ID ||
    process.env.GA_PROPERTY_ID ||
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID
);

export const FEATURES = {
  TORRE_V2: 'TORRE_V2',
  GA4: 'GA4',
  STRIPE: 'STRIPE',
  FIREBASE: 'FIREBASE',
} as const;

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
}

const featureFlags: Record<string, FeatureFlag> = {
  [FEATURES.TORRE_V2]: {
    name: FEATURES.TORRE_V2,
    enabled: process.env.FEATURE_TORRE_V2 === 'true' || process.env.NEXT_PUBLIC_ENABLE_TORRE_V2 === 'true',
    description: 'Enable Painel de KPI',
  },
  [FEATURES.GA4]: {
    name: FEATURES.GA4,
    enabled: process.env.FEATURE_GA4 === 'true' || hasGa4Property,
    description: 'Enable Google Analytics 4',
  },
  [FEATURES.STRIPE]: {
    name: FEATURES.STRIPE,
    enabled: process.env.FEATURE_STRIPE === 'true' || !!process.env.STRIPE_SECRET_KEY,
    description: 'Enable Stripe Integration',
  },
  [FEATURES.FIREBASE]: {
    name: FEATURES.FIREBASE,
    enabled: process.env.FEATURE_FIREBASE === 'true' || hasFirebaseServerConfig,
    description: 'Enable Firebase Integration',
  },
};

export function isFeatureEnabled(featureName: string): boolean {
  const flag = featureFlags[featureName];
  return flag ? flag.enabled : false;
}

export function enableFeature(featureName: string): void {
  if (featureFlags[featureName]) {
    featureFlags[featureName].enabled = true;
  }
}

export function disableFeature(featureName: string): void {
  if (featureFlags[featureName]) {
    featureFlags[featureName].enabled = false;
  }
}

export function getFeatureFlag(featureName: string): FeatureFlag | undefined {
  return featureFlags[featureName];
}

export function getAllFeatureFlags(): FeatureFlag[] {
  return Object.values(featureFlags);
}

export interface IntegrationsStatus {
  ga4: boolean;
  stripe: boolean;
  firebase: boolean;
}

export function getIntegrationsStatus(): IntegrationsStatus {
  return {
    ga4: isFeatureEnabled(FEATURES.GA4),
    stripe: isFeatureEnabled(FEATURES.STRIPE),
    firebase: isFeatureEnabled(FEATURES.FIREBASE),
  };
}

export function isTorreV2Ready(): boolean {
  const status = getIntegrationsStatus();
  return status.ga4 && status.stripe && status.firebase && isFeatureEnabled(FEATURES.TORRE_V2);
}
