export function formatCurrencyFromCentavos(value: number | null, currency = 'BRL'): string {
  if (value === null) return 'Indisponivel';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value / 100);
}