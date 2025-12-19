/**
 * ────────────────────────────────────────────────────────────────────────────
 * FEATURE FLAGS - Controle de Rollout
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Sistema de feature flags para controlar funcionalidades e integrações.
 * Permite rollout gradual e desabilitação rápida em caso de problemas.
 * 
 * USAGE:
 * ```ts
 * import { isFeatureEnabled, FEATURES } from '@/lib/feature-flags';
 * 
 * if (isFeatureEnabled(FEATURES.TORRE_V2)) {
 *   // Torre v2 está habilitado
 * }
 * ```
 */

// ────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

export const FEATURES = {
  // Core features
  TORRE_V2: 'TORRE_V2_ENABLED',
  
  // Integrations
  GA4: 'GA4_ENABLED',
  STRIPE: 'STRIPE_ENABLED',
  STRIPE_WEBHOOKS: 'STRIPE_WEBHOOKS_ENABLED',
  
  // Modules
  GROWTH_MODULE: 'GROWTH_MODULE_ENABLED',
  FINANCE_MODULE: 'FINANCE_MODULE_ENABLED',
  OPS_MODULE: 'OPS_MODULE_ENABLED',
  QUALITY_MODULE: 'QUALITY_MODULE_ENABLED',
  
  // Advanced features
  ALERTS: 'ALERTS_ENABLED',
  COHORTS: 'COHORTS_ENABLED',
  CASH_FLOW: 'CASH_FLOW_ENABLED',
  
  // Experimental
  REAL_TIME_UPDATES: 'REAL_TIME_UPDATES_ENABLED',
  EXPORT_REPORTS: 'EXPORT_REPORTS_ENABLED',
  EMAIL_NOTIFICATIONS: 'EMAIL_NOTIFICATIONS_ENABLED',
} as const;

export type FeatureFlag = typeof FEATURES[keyof typeof FEATURES];

// ────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT-BASED DEFAULTS
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  // Core - enabled by default in production
  [FEATURES.TORRE_V2]: process.env.NEXT_PUBLIC_TORRE_V2_ENABLED === 'true' || 
                        process.env.NODE_ENV === 'development',
  
  // Integrations - require explicit env vars
  [FEATURES.GA4]: Boolean(
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID &&
    process.env.GA4_PROPERTY_ID
  ),
  [FEATURES.STRIPE]: Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ),
  [FEATURES.STRIPE_WEBHOOKS]: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  
  // Modules - enabled if Torre v2 is enabled
  [FEATURES.GROWTH_MODULE]: process.env.NEXT_PUBLIC_GROWTH_MODULE_ENABLED !== 'false',
  [FEATURES.FINANCE_MODULE]: process.env.NEXT_PUBLIC_FINANCE_MODULE_ENABLED !== 'false',
  [FEATURES.OPS_MODULE]: process.env.NEXT_PUBLIC_OPS_MODULE_ENABLED !== 'false',
  [FEATURES.QUALITY_MODULE]: process.env.NEXT_PUBLIC_QUALITY_MODULE_ENABLED !== 'false',
  
  // Advanced features
  [FEATURES.ALERTS]: process.env.NEXT_PUBLIC_ALERTS_ENABLED !== 'false',
  [FEATURES.COHORTS]: process.env.NEXT_PUBLIC_COHORTS_ENABLED !== 'false',
  [FEATURES.CASH_FLOW]: process.env.NEXT_PUBLIC_CASH_FLOW_ENABLED !== 'false',
  
  // Experimental - disabled by default
  [FEATURES.REAL_TIME_UPDATES]: process.env.NEXT_PUBLIC_REAL_TIME_UPDATES_ENABLED === 'true',
  [FEATURES.EXPORT_REPORTS]: process.env.NEXT_PUBLIC_EXPORT_REPORTS_ENABLED === 'true',
  [FEATURES.EMAIL_NOTIFICATIONS]: process.env.NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED === 'true',
};

// ────────────────────────────────────────────────────────────────────────────
// RUNTIME FLAGS (can be overridden)
// ────────────────────────────────────────────────────────────────────────────

let runtimeFlags: Partial<Record<FeatureFlag, boolean>> = {};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  // Check runtime override first
  if (feature in runtimeFlags) {
    return runtimeFlags[feature]!;
  }
  
  // Fall back to default
  return DEFAULT_FLAGS[feature] ?? false;
}

/**
 * Enable a feature at runtime (for testing/debugging)
 */
export function enableFeature(feature: FeatureFlag): void {
  runtimeFlags[feature] = true;
  console.log(`[Feature Flags] Enabled: ${feature}`);
}

/**
 * Disable a feature at runtime (for testing/debugging)
 */
export function disableFeature(feature: FeatureFlag): void {
  runtimeFlags[feature] = false;
  console.log(`[Feature Flags] Disabled: ${feature}`);
}

/**
 * Reset runtime overrides
 */
export function resetRuntimeFlags(): void {
  runtimeFlags = {};
  console.log('[Feature Flags] Runtime flags reset');
}

/**
 * Get all feature flags status
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags: Partial<Record<FeatureFlag, boolean>> = {};
  
  for (const feature of Object.values(FEATURES)) {
    flags[feature] = isFeatureEnabled(feature);
  }
  
  return flags as Record<FeatureFlag, boolean>;
}

/**
 * Get integration status (for health checks)
 */
export function getIntegrationsStatus() {
  return {
    ga4: {
      enabled: isFeatureEnabled(FEATURES.GA4),
      configured: Boolean(
        process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID &&
        process.env.GA4_PROPERTY_ID
      ),
      requiresAuth: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_B64),
    },
    stripe: {
      enabled: isFeatureEnabled(FEATURES.STRIPE),
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      webhooks: isFeatureEnabled(FEATURES.STRIPE_WEBHOOKS),
    },
    firebase: {
      enabled: true, // Always enabled
      configured: Boolean(
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL
      ),
    },
  };
}

/**
 * Check if Torre v2 can be fully operational
 */
export function isTorreV2Ready(): {
  ready: boolean;
  missingIntegrations: string[];
  warnings: string[];
} {
  const missingIntegrations: string[] = [];
  const warnings: string[] = [];
  
  // Check core feature flag
  if (!isFeatureEnabled(FEATURES.TORRE_V2)) {
    return {
      ready: false,
      missingIntegrations: ['Torre v2 feature flag disabled'],
      warnings: [],
    };
  }
  
  // Check critical integrations
  const integrations = getIntegrationsStatus();
  
  if (!integrations.firebase.configured) {
    missingIntegrations.push('Firebase (CRITICAL)');
  }
  
  if (!integrations.ga4.configured) {
    warnings.push('GA4 not configured - growth metrics will be limited');
  }
  
  if (!integrations.stripe.configured) {
    warnings.push('Stripe not configured - financial metrics will be limited');
  }
  
  return {
    ready: missingIntegrations.length === 0,
    missingIntegrations,
    warnings,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// DEVELOPMENT HELPERS
// ────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Expose to window for debugging in browser console
  (window as any).__featureFlags = {
    check: isFeatureEnabled,
    enable: enableFeature,
    disable: disableFeature,
    reset: resetRuntimeFlags,
    getAll: getAllFeatureFlags,
    integrations: getIntegrationsStatus,
    torreV2Ready: isTorreV2Ready,
  };
  
  console.log('[Feature Flags] Debug helpers available at window.__featureFlags');
}

// ────────────────────────────────────────────────────────────────────────────
// LOGGING
// ────────────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  console.log('[Feature Flags] Initialized:', getAllFeatureFlags());
  
  const torreStatus = isTorreV2Ready();
  if (!torreStatus.ready) {
    console.warn('[Feature Flags] Torre v2 NOT READY:', torreStatus);
  } else if (torreStatus.warnings.length > 0) {
    console.warn('[Feature Flags] Torre v2 warnings:', torreStatus.warnings);
  } else {
    console.log('[Feature Flags] Torre v2 READY ✅');
  }
}
