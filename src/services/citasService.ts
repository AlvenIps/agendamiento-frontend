import apiClient from '@/services/apiClient.ts';
import type { CitaRequest, CitaResponse, CitaUpdate, CitaGrupalRequest } from '@/types';
import { isAxiosError } from 'axios';
import { extraerErrorApi } from '@/utils/errorUtils.ts';


export async function verificarCliente(numeroIdentificacion: string): Promise<boolean> {
  try {
    await apiClient.get(`/clientes/verificar/${numeroIdentificacion}`);
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error("Error inesperado al verificar el cliente: ", error);
    const specificMessage = extraerErrorApi(error, 'Error al verificar el cliente.');
    throw new Error(specificMessage);
  }
}

export async function agendarNuevaCita(formData: CitaRequest): Promise<CitaResponse> {
  try {
    const dataParaEnviar = new FormData();

    const datosCita = { ...formData };
    delete datosCita.ordenMedica;
    dataParaEnviar.append('datosCita', new Blob([JSON.stringify(datosCita)], {
      type: 'application/json',
    }));
    if (formData.ordenMedica) {
      dataParaEnviar.append('ordenMedica', formData.ordenMedica);
    }
    const response = await apiClient.post<CitaResponse>('/citas', dataParaEnviar, {
      headers: { 'Content-Type': 'multipart/form-data', },
    });
    return response.data;
  } catch (error) {
    const specificMessage = extraerErrorApi(error, 'No se pudo agendar la cita.');
    throw new Error(specificMessage);
  }
}

export async function agendarCitaGrupal(dto: CitaGrupalRequest): Promise<CitaResponse[]> {
  const dataParaEnviar = new FormData();
  try {
    const datosCitaGrupal = {
      ...dto,
      clientes: dto.clientes.map(cliente => {
        const restoDelCliente = { ...cliente };
        delete restoDelCliente.ordenMedicaFile;
        return restoDelCliente;
      })
    };
    dataParaEnviar.append('datosCitaGrupal', new Blob([JSON.stringify(datosCitaGrupal)], {
      type: 'application/json',
    }));
    dto.clientes.forEach(cliente => {
      if (cliente.ordenMedicaFile) {
        dataParaEnviar.append(cliente.numeroIdentificacion, cliente.ordenMedicaFile);
      }
    });
    const response = await apiClient.post<CitaResponse[]>('/citas/grupal', dataParaEnviar, {
      headers: { 'Content-Type': 'multipart/form-data', },
      params: {
        ordenesMedicas: ''
      }
    });
    return response.data;
  } catch (error) {
    const speecificMessage = extraerErrorApi(error, 'No se pudo agendar la cita grupal..');
    throw new Error(speecificMessage);
  }
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
    const specificMessage = extraerErrorApi(error, 'No se pudo obtener la disponibilidad.');
    throw new Error(specificMessage);
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
    const specificMessage = extraerErrorApi(error, 'No se pudieron obtener las citas.');
    throw new Error(specificMessage);
  }
}

export async function getUrlOrdenMedica(id: number): Promise<string> {
  try {
    const response = await apiClient.get<{ url: string }>(`/citas/orden/${id}`);
    return response.data.url;
  } catch (error) {
    const specificMessage = extraerErrorApi(error, 'No se pudo obtener la URL de la orden.');
    throw new Error(specificMessage);
  }
}
export async function cancelarCita(id: number): Promise<CitaResponse> {
  try {
    const response = await apiClient.post<CitaResponse>(`/citas/${id}/cancelar`);
    return response.data;
  } catch(error) {
    const specificMessage = extraerErrorApi(error, 'No se pudo cancelar la cita.');
    throw new Error(specificMessage);
  }
}

export async function actualizarCita(id: number, updateDTO: CitaUpdate ): Promise<CitaResponse> {
  try {
    const response = await apiClient.patch<CitaResponse>(`/citas/${id}`, updateDTO);
    return response.data;
  } catch (error) {
    const specificMessage = extraerErrorApi(error, 'No se pudo actualizar la cita.');
    throw new Error(specificMessage);
  }
}























