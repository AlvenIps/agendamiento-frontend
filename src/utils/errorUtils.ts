import { isAxiosError } from 'axios';

interface BackendError {
  mensaje: string;
}
export function extraerErrorApi(error: unknown, defaultMessage = 'Ocurrió un error inesperado.'): string {
  if (isAxiosError(error) && error.response?.data) {
    // si es error de Axios leemos su mensaje
    const errorData = error.response.data as BackendError;
    if (errorData.mensaje) {
      return errorData.mensaje;
    }
  }
  // Si no es un error de Axios pero es un objeto Error estándar, usamos su mensaje.
  if (error instanceof Error) {
    return error.message;
  }
  // mensaje por defecto como ultimo recurso
  return defaultMessage;
}
