import type { EstadoCita, Sexo, TipoAtencion, Cliente } from '@/types/index.ts';

export interface ConteoClientes {
  clientesNuevos: number;
  clientesRecurrentes: number;
  totalClientesUnicos: number;
}

/**
 * Reflejo de tu ConteoEstadoDTO.
 * Representa la cantidad de citas por cada estado.
 */
export interface ConteoEstado {
  estado: EstadoCita;
  cantidad: number;
}

/**
 * Reflejo de tu ConteoPorDiaDTO.
 * Representa la cantidad de citas para cada día de la semana.
 */
export interface ConteoPorDia {
  dia: string;
  total: number;
}

/**
 * Reflejo de tu ConteoPorSexoDTO.
 * Representa el conteo de clientes por sexo.
 */
export interface ConteoPorSexo {
  sexo: Sexo;
  total: number;
}

/**
 * Reflejo de tu ConteoTipoAtencionDTO.
 * Contiene el rendimiento por tipo de atención.
 */
export interface ConteoTipoAtencion {
  tipo: TipoAtencion | null; // El tipo puede ser nulo
  cantidad: number;
  total: number;
}

/**
 * Reflejo de tu HoraPicoDTO.
 * Representa la cantidad de citas por franja horaria.
 */
export interface HoraPico {
  dia: string;
  horario: string;
  totalCitas: number;
}

/**
 * Reflejo de tu RendimientoSedeDTO.
 * Contiene el rendimiento comparativo entre sedes.
 */
export interface RendimientoSede {
  nombreSede: string;
  totalCitas: number;
  citasCompletadas: number;
  totalFacturado: number;
}

/**
 * Reflejo de tu TopClienteDTO.
 * Representa a un cliente y el total de sus citas.
 */
export interface TopCliente {
  cliente: Cliente;
  totalCitas: number;
}
