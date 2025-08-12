export function formatCurrency(value: number | null | undefined): string {
  if (!value) {
    return '---';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0, // sin centavos
    maximumFractionDigits: 0, //sin centavos
  }).format(value);
}
