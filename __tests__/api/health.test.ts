/**
 * Health Check API Tests
 */

import { GET } from '@/app/api/health/integrations/route';
import { NextRequest } from 'next/server';

// Mock Firebase Admin
jest.mock('@/lib/server/firebaseAdmin', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ empty: false })),
      })),
    })),
  })),
}));

// Mock feature flags
jest.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: jest.fn((feature: string) => {
    if (feature === 'FIREBASE') return true;
    if (feature === 'GA4') return false;
    if (feature === 'STRIPE') return false;
    return false;
  }),
  FEATURES: {
    FIREBASE: 'FIREBASE',
    GA4: 'GA4',
    STRIPE: 'STRIPE',
    TORRE_V2: 'TORRE_V2',
  },
  getIntegrationsStatus: jest.fn(() => ({
    firebase: true,
    ga4: false,
    stripe: false,
  })),
  isTorreV2Ready: jest.fn(() => ({
    ready: true,
    missingIntegrations: [],
  })),
}));

describe('Health Check API', () => {
  it('should return healthy status when all integrations are OK', async () => {
    const request = new NextRequest('http://localhost:3000/api/health/integrations');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.integrations).toBeDefined();
    expect(data.integrations.firebase).toBeDefined();
  });

  it('should include timestamp', async () => {
    const request = new NextRequest('http://localhost:3000/api/health/integrations');
    const response = await GET(request);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should include integration status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health/integrations');
    const response = await GET(request);
    const data = await response.json();

    expect(data.integrations.firebase).toHaveProperty('status');
    expect(data.integrations.firebase).toHaveProperty('configured');
    expect(data.integrations.firebase).toHaveProperty('enabled');
  });

  it('should include Torre v2 readiness', async () => {
    const request = new NextRequest('http://localhost:3000/api/health/integrations');
    const response = await GET(request);
    const data = await response.json();

    expect(data.torreV2).toBeDefined();
    expect(data.torreV2).toHaveProperty('ready');
    expect(data.torreV2).toHaveProperty('missingIntegrations');
  });

  it('should have no-store cache header', async () => {
    const request = new NextRequest('http://localhost:3000/api/health/integrations');
    const response = await GET(request);

    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('no-store');
  });
});
