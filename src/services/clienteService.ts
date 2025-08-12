import apiClient from '@/services/apiClient.ts';
import type { Cliente, ClienteAgenda, ClienteUpdate } from '@/types';
import { extraerErrorApi } from '@/utils/errorUtils.ts';
import { isAxiosError } from 'axios';

export async function mostrarClientesPorFecha (fechaCita: string): Promise<ClienteAgenda[]> {
  if(!fechaCita || fechaCita === ''){
    console.error("La fecha debe ser definida para ejecutar esta consulta")
  }
  try {
    const url = `/clientes?fechaCita=${fechaCita}`;
    const response = await apiClient.get<ClienteAgenda[]>(url);

    return response.data;
  } catch (e) {
    console.error(`Ha ocurrido un error obteniendo la lista de clientes para esta fecha ${fechaCita}:`,e);
    throw e;
  }
}

export async function buscarCliente(identificacion: string): Promise<Cliente> {
  if (!identificacion || identificacion === '') {
    throw new Error('Debe especificar una identificación para buscar.');
  }
  try {
    const response = await apiClient.get<Cliente>(`/clientes/${identificacion}`);
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`No se encontró ningún cliente con la identificación "${identificacion}".`);
    }
    const specificMessage = extraerErrorApi(error, 'Error al buscar el cliente.');
    throw new Error(specificMessage);
  }
}

export async function updateCliente(identificacion: string, updateData: ClienteUpdate): Promise<Cliente> {
  if (!identificacion || identificacion === '') {
    throw new Error('Debe especificar un id para la persona a actualizar');
  }
  try {
    const response = await apiClient.patch<Cliente>(`/clientes/${identificacion}`, updateData);
    return response.data;
  } catch (error) {
    const specificMessage = extraerErrorApi(error, 'No se pudo actualizar el cliente.');
    throw new Error(specificMessage);
  }
}
