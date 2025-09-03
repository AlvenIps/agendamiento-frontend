export type Sexo = 'MASCULINO' | 'FEMENINO' | 'OTRO';
export type EstadoCita = 'AGENDADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export type TipoAtencion =
  | 'PARTICULAR'
  | 'SURA_PREPAGADA'
  | 'COOMEVA_PREPAGADA'
  | 'SEGUROS_BOLIVAR_PREPAGADA'
  | 'FOMAG'
  | 'SOLO_TOMA_DE_MUESTRA'
  | 'INYECTOLOGIA'
  | 'SUERO_VITAMINADO'
  | 'COLMEDICA_PREPAGADA';

export type FormaPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'DATAFONO'
  | 'NO_DEFINIDO';

export type EstadoResultados = 'ENTREGADOS' | 'PENDIENTE' | 'PARCIAL';

export interface CitaRequest {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres?: string; // El '?' los hace opcionales
  apellidos?: string;
  sexo?: Sexo;
  fechaNacimiento?: string;
  email?: string;
  celular?: string;
  direccionCliente?: string;

  nombreSede: string;
  fechaHoraCita: string;
  direccionCita: string;
  barrio: string;
  examenes: string;
  ordenMedica?: File | null;

  tipoAtencion: TipoAtencion;
  formaPago: FormaPago;
  observaciones?: string;
}

// Refleja la estructura de tu CitaResponseDTO del backend
export interface CitaResponse {
  id: number;
  tipoIdentificacion: string;
  numeroIdentificacionCliente: string;
  nombreCompletoCliente: string;
  nombreSede: string;

  fechaHoraCita: string;
  direccionCita: string;
  barrio: string;
  examenes: string;
  estado: EstadoCita;
  creadaEn: string;
  fotoPublicId?: string | null;
  // --- Nuevos campos ---
  tipoAtencion: TipoAtencion;
  formaPago: FormaPago;
  observaciones?: string | null;
  valorServicio?: number | null; // En JSON BigDecimal llega como number
  valorCopago?: number | null;
  numeroAutorizacion?: string | null;
  estadoResultados: EstadoResultados;
}

export interface CitaUpdate {
  nuevaFechaHoraCita?: string;
  estado?: EstadoCita;
  // --- Nuevos campos ---
  valorServicio?: number;
  valorCopago?: number;
  numeroAutorizacion?: string;
  estadoResultados?: EstadoResultados;
}

export interface ClienteAgenda {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  sexo: Sexo;
  direccion: string;
  fechaNacimiento: string;
  email: string;
  celular: string;
  sedeCita: string;
}

export interface Cliente {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  sexo: Sexo;
  direccion: string;
  fechaNacimiento: string;
  email: string;
  celular: string;
}

export interface ClienteUpdate {
  nombres?: string;
  apellidos?: string;
  sexo?: Sexo;
  fechaNacimiento?: string;
  email?: string;
  celular?: string;
  direccion?: string;
}

export interface ClienteEnGrupo {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  examenes: string;
  tipoAtencion: TipoAtencion;
  nombres: string;
  apellidos: string;
  sexo: Sexo;
  fechaNacimiento: string;
  email: string;
  celular: string;
  direccion: string;

  ordenMedicaFile?: File | null;
  _clienteNuevo?: boolean;
}

export interface CitaGrupalRequest {
  clientes: ClienteEnGrupo[];
  nombreSede: string;
  fechaHoraCita: string;
  direccionCita: string;
  barrio: string;
  formaPago: FormaPago;
  observaciones?: string;
}



















