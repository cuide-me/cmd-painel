export function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function containsText(value: string | undefined, term: string | undefined): boolean {
  if (!term) return true;
  if (!value) return false;

  return value.toLowerCase().includes(term.toLowerCase());
}

export function getDisplayName(data: Record<string, unknown> | undefined): string {
  if (!data) return 'Nao informado';

  const firstName = data.nome || data.displayName || data.name;
  const lastName = data.sobrenome || data.lastName;

  if (firstName && lastName) return `${firstName} ${lastName}`;
  return typeof firstName === 'string' && firstName ? firstName : 'Nao informado';
}