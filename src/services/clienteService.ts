import apiClient from '@/services/apiClient.ts'
import type { Cliente, ClienteAgenda, CitaUpdate, ClienteUpdate } from '@/types'

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
    console.error(`Debe especificar un id para la persona a buscar`);
  }
  try {
    const response = await apiClient.get<Cliente>(`/clientes/${identificacion}`);
    return response.data;
  } catch (e) {
    console.error(`Error al obtener el cliente con identificación ${identificacion}:`,e);
    throw e;
  }
}

export async function updateCliente(identificacion: string, updateData: ClienteUpdate): Promise<Cliente> {
  if (!identificacion || identificacion === '') {
    throw new Error('Debe especificar un id para la persona a actualizar');
  }
  try {
    const response = await apiClient.patch<Cliente>(`/clientes/${identificacion}`, updateData);
    return response.data;
  } catch (e) {
    console.error(`Error al actualizar el cliente con identificación ${identificacion}:`,e);
    throw e;
  }
}
