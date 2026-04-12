import { BetaAnalyticsDataClient } from '@google-analytics/data';

type ParsedCredentials = Record<string, string>;

let cachedClient: BetaAnalyticsDataClient | null = null;
let cachedConfig: {
  propertyId: string | null;
  credentials: ParsedCredentials | null;
  error: string | null;
} | null = null;

function normalizePropertyId(rawValue?: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('properties/')) {
    return trimmed;
  }

  if (/^\d+$/.test(trimmed)) {
    return `properties/${trimmed}`;
  }

  return trimmed;
}

function parseCredentials(rawValue?: string | null): ParsedCredentials | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as ParsedCredentials;
  } catch {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      return JSON.parse(decoded) as ParsedCredentials;
    } catch {
      return null;
    }
  }
}

export function getGa4AdminConfig(): {
  propertyId: string | null;
  credentials: ParsedCredentials | null;
  enabled: boolean;
  error: string | null;
} {
  if (cachedConfig) {
    return {
      ...cachedConfig,
      enabled: Boolean(cachedConfig.propertyId && cachedConfig.credentials),
    };
  }

  const propertyId = normalizePropertyId(
    process.env.GA4_PROPERTY_ID ||
      process.env.GA_PROPERTY_ID ||
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID ||
      null
  );

  const credentials = parseCredentials(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
      process.env.GOOGLE_ANALYTICS_CREDENTIALS ||
      null
  );

  let error: string | null = null;
  if (!propertyId) {
    error = 'GA4_PROPERTY_ID nao configurado.';
  } else if (!credentials) {
    error = 'GOOGLE_APPLICATION_CREDENTIALS_JSON nao configurado ou invalido.';
  }

  cachedConfig = { propertyId, credentials, error };

  return {
    propertyId,
    credentials,
    enabled: Boolean(propertyId && credentials),
    error,
  };
}

export function getGa4AdminClient(): BetaAnalyticsDataClient {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getGa4AdminConfig();
  if (!config.enabled || !config.credentials) {
    throw new Error(config.error || 'GA4 nao configurado.');
  }

  cachedClient = new BetaAnalyticsDataClient({
    credentials: config.credentials,
  });

  return cachedClient;
}
