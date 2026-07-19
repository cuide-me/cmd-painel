import { NextRequest } from 'next/server';

const createCustomToken = jest.fn();
const getFirebaseAdmin = jest.fn();

jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ createCustomToken }),
}));

jest.mock('@/lib/server/firebaseAdmin', () => ({
  getFirebaseAdmin,
}));

import { POST } from '@/app/api/admin/auth/login/route';

function loginRequest(body: unknown, ip: string) {
  return new NextRequest('http://localhost/api/admin/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-real-ip': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/auth/login', () => {
  const originalAdminPassword = process.env.ADMIN_PASSWORD;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    process.env.ADMIN_PASSWORD = 'correct-password';
    createCustomToken.mockResolvedValue('firebase-custom-token');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  afterAll(() => {
    if (originalAdminPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalAdminPassword;
    }
  });

  it('rejects a request without a password before accessing Firebase', async () => {
    const response = await POST(loginRequest({}, '203.0.113.1'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Password required',
      message: 'Senha é obrigatória',
    });
    expect(getFirebaseAdmin).not.toHaveBeenCalled();
  });

  it('reports a configuration error when the password is unavailable', async () => {
    delete process.env.ADMIN_PASSWORD;

    const response = await POST(loginRequest({ password: 'anything' }, '203.0.113.2'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Server configuration error',
      message: 'Erro de configuração do servidor',
    });
    expect(getFirebaseAdmin).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without issuing a Firebase token', async () => {
    const response = await POST(loginRequest({ password: 'wrong-password' }, '203.0.113.3'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid password',
      message: 'Senha incorreta',
    });
    expect(createCustomToken).not.toHaveBeenCalled();
  });

  it('blocks the sixth invalid attempt for the same address', async () => {
    const ip = '203.0.113.5';

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await POST(loginRequest({ password: 'wrong-password' }, ip));
      expect(response.status).toBe(401);
    }

    const blockedResponse = await POST(loginRequest({ password: 'wrong-password' }, ip));

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get('Retry-After')).toEqual(expect.any(String));
    await expect(blockedResponse.json()).resolves.toMatchObject({
      error: 'Too many attempts',
      retryAfter: expect.any(Number),
    });
    expect(createCustomToken).not.toHaveBeenCalled();
  });

  it('issues the existing admin token claims after a valid password', async () => {
    const response = await POST(loginRequest({ password: 'correct-password' }, '203.0.113.4'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'Login realizado com sucesso',
      firebaseCustomToken: 'firebase-custom-token',
    });
    expect(getFirebaseAdmin).toHaveBeenCalledTimes(1);
    expect(createCustomToken).toHaveBeenCalledWith('admin-panel-user', {
      admin: true,
      role: 'admin',
    });
  });
});