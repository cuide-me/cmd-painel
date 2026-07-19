import { NextRequest } from 'next/server';

const verifyIdToken = jest.fn();
const getFirebaseAdmin = jest.fn();
const getFirestore = jest.fn();

jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore,
}));

jest.mock('@/lib/server/firebaseAdmin', () => ({
  getFirebaseAdmin,
}));

import { requireAdminPermission } from '@/lib/server/auth';

function requestWithToken(token?: string) {
  return new NextRequest('http://localhost/api/admin/jobs', {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

function mockFirestoreAdminProfile() {
  getFirestore.mockReturnValue({
    collection: () => ({
      doc: () => ({
        get: async () => ({ data: () => ({ isAdmin: true }) }),
      }),
    }),
  });
}

describe('requireAdminPermission', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('returns 401 without a bearer token before initializing Firebase', async () => {
    const result = await requireAdminPermission(requestWithToken(), 'jobs.read');

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(401);
      await expect(result.error.json()).resolves.toEqual({
        error: 'unauthorized',
        message: 'Missing authentication token',
      });
    }
    expect(getFirebaseAdmin).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid Firebase token', async () => {
    verifyIdToken.mockRejectedValue(Object.assign(new Error('expired'), { code: 'auth/id-token-expired' }));

    const result = await requireAdminPermission(requestWithToken('expired-token'), 'jobs.read');

    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(401);
      await expect(result.error.json()).resolves.toEqual({
        error: 'unauthorized',
        message: 'Invalid or expired token',
      });
    }
  });

  it('preserves full access for the existing admin claim', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'admin-panel-user', admin: true, role: 'admin' });

    const result = await requireAdminPermission(requestWithToken('valid-admin-token'), 'metrics.write');

    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.uid).toBe('admin-panel-user');
      expect(result.role).toBe('admin');
    }
  });

  it('uses the admin profile fallback but still enforces the role permission matrix', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'operations-user', role: 'operations' });
    mockFirestoreAdminProfile();

    const readResult = await requireAdminPermission(requestWithToken('operations-token'), 'jobs.read');
    const writeResult = await requireAdminPermission(requestWithToken('operations-token'), 'metrics.write');

    expect('error' in readResult).toBe(false);
    if (!('error' in readResult)) {
      expect(readResult.role).toBe('operations');
    }

    expect('error' in writeResult).toBe(true);
    if ('error' in writeResult) {
      expect(writeResult.error.status).toBe(403);
      await expect(writeResult.error.json()).resolves.toEqual({
        error: 'forbidden',
        message: 'Permission denied',
      });
    }
  });
});