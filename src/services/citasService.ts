import apiClient from '@/services/apiClient.ts'
import type { CitaRequest, CitaResponse, CitaUpdate } from '@/types'
import { isAxiosError } from 'axios'

export async function verificarCliente(numeroIdentificacion: string): Promise<boolean> {
  try {
    await apiClient.get(`/clientes/verificar/${numeroIdentificacion}`);
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error("Error inesperado al verificar el cliente: ", error);
    throw error;
  }
}

export async function agendarNuevaCita(formData: CitaRequest): Promise<CitaResponse> {
  const dataParaEnviar = new FormData();

  const datosCita = { ...formData };
  delete datosCita.ordenMedica;
  dataParaEnviar.append('datosCita', new Blob([JSON.stringify(datosCita)], {
    type: 'application/json',
  }));

  if (formData.ordenMedica) {
    dataParaEnviar.append('ordenMedica', formData.ordenMedica);
  }
  // hacemos la peticion POST con multipart/form-data
  const response = await apiClient.post<CitaResponse>('/citas', dataParaEnviar, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function getAvailableTimes(fecha: string, nombreSede: string): Promise<string[]> {
  // Verificamos que los datos necesarios estén presentes antes de hacer la llamada
  if (!fecha || !nombreSede) {
    return []; // Devolvemos un array vacío si no hay datos suficientes
  }

  try {
    // Construimos la URL con el formato que espera el backend
    const url = `/disponibilidad/${fecha}?nombreSede=${nombreSede}`;
    const response = await apiClient.get<string[]>(url);

    return response.data; // Si la petición es exitosa, devolvemos la lista de horarios
  } catch (error) {
    console.error(`Error obteniendo la disponibilidad para la fecha ${fecha}:`, error);
    // En caso de error, lanzamos la excepción para que el componente la maneje
    throw error;
  }
}

export async function getCitasPorFecha(fecha: string, estado?: string): Promise<CitaResponse[]> {
  try {
    // Usamos `today` y `tomorrow` como casos especiales, o la fecha para el caso general.
    let url = `/citas/${fecha}`;
    if (fecha === 'today' || fecha === 'tomorrow') {
      url = `/citas/${fecha}`;
    }
    if (estado && estado !== '') {
      url += `?estado=${estado}`;
    }
    const response = await apiClient.get<CitaResponse[]>(url);
    return response.data;

  } catch (error) {
    console.error(`Error obteniendo las citas para la fecha ${fecha}:`, error);
    // En un caso real, podríamos manejar errores específicos aquí (ej. 403 Forbidden)

    throw error;
  }
}

export async function getUrlOrdenMedica(id: number): Promise<string> {
  try {
    const response = await apiClient.get<{ url: string }>(`/citas/orden/${id}`);
    return response.data.url;
  } catch (e) {
    console.error(`Error al obtener la URL de la orden para la cita ${id}:`, e );
    throw e;
  }
}
export async function cancelarCita(id: number): Promise<CitaResponse> {
  try {
    const response = await apiClient.post<CitaResponse>(`/citas/${id}/cancelar`);
    return response.data;
  } catch(e) {
    console.error(`Error al cancelar la cita ${id}:`, e );
    throw e;
  }
}

export async function actualizarCita(id: number, updateDTO: CitaUpdate ): Promise<CitaResponse> {
  try {
    const response = await apiClient.patch<CitaResponse>(`/citas/${id}`, updateDTO);
    return response.data;
    console.log(response.data);
  } catch (e) {
    console.error(`Error al reagendar la cita ${id}:`, e );
    throw e;
  }
}























