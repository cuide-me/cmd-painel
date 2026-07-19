import { redactSensitiveData } from '@/lib/observability/redact';

describe('redactSensitiveData', () => {
  it('redacts credential and PII fields recursively', () => {
    const sanitized = redactSensitiveData({
      authorization: 'Bearer super-secret-token',
      profile: {
        email: 'family@example.com',
        phone: '+55 11 99999-9999',
      },
      headers: {
        cookie: 'session=secret',
      },
    });

    expect(sanitized).toEqual({
      authorization: '[REDACTED]',
      profile: {
        email: '[REDACTED]',
        phone: '[REDACTED]',
      },
      headers: {
        cookie: '[REDACTED]',
      },
    });
  });

  it('redacts sensitive values embedded in strings while retaining operational metadata', () => {
    const sanitized = redactSensitiveData({
      message: 'Contact family@example.com with Bearer private-token',
      requestId: 'request-42',
      durationMs: 120,
      status: 200,
    });

    expect(sanitized).toEqual({
      message: 'Contact [REDACTED_EMAIL] with Bearer [REDACTED]',
      requestId: 'request-42',
      durationMs: 120,
      status: 200,
    });
  });
});