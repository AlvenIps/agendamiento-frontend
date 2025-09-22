import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

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
export function useFormatter() {
  const formatDateTime = (isoString: string): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return format(date, "dd/MM/yyyy hh:mm a", { locale: es });
  };
  return {
    formatDateTime,
  };
}
