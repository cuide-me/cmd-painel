import { formatCurrencyFromCentavos } from '@/modules/finance/domain/money';

describe('formatCurrencyFromCentavos', () => {
  it('formats integer centavos as Brazilian currency', () => {
    expect(formatCurrencyFromCentavos(12345)).toBe('R$ 123,45');
  });

  it('preserves the supplied currency and keeps unavailable values explicit', () => {
    expect(formatCurrencyFromCentavos(5000, 'usd')).toContain('US$');
    expect(formatCurrencyFromCentavos(null)).toBe('Indisponivel');
  });
});