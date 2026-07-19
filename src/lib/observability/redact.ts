const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_FIELD_PATTERN = /password|passwd|secret|token|authorization|cookie|api[_-]?key|email|e-mail|phone|telefone|cpf|cnpj|address|endereco|document|certificate/i;

function redactString(value: string): string {
  return value
    .replace(/\bBearer\s+[^\s,]+/gi, 'Bearer [REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]');
}

function redactValue(value: unknown, seen: WeakSet<object>, depth: number): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (depth >= 10 || seen.has(value)) return REDACTED_VALUE;

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(item => redactValue(item, seen, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_FIELD_PATTERN.test(key) ? REDACTED_VALUE : redactValue(item, seen, depth + 1),
    ])
  );
}

export function redactSensitiveData<T>(value: T): T {
  return redactValue(value, new WeakSet<object>(), 0) as T;
}