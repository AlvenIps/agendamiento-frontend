import type { EstadoCita, EstadoResultados, TipoAtencion } from '@/types/index.ts';

export interface HistoriaCitaCliente {
  idCita: number;
  estadoCita: EstadoCita;
  tipoAtencion: TipoAtencion | null;
  fechaHoraCita: string;
  examenes: string;
  estadoResultados: EstadoResultados;
  valorServicio: number | null;
  valorCopago: number | null;
}
export interface HistoriaClienteCompleto {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombreCompleto: string;
  historialCitas: Page<HistoriaCitaCliente>;
}

export interface Page<T> {
  content: T[]; // La lista de items para la página actual
  totalPages: number;
  totalElements: number;
  number: number; // El número de la página actual (empezando en 0)
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
