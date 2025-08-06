import apiClient from '@/services/apiClient.ts';
import type { HistoriaClienteCompleto } from '@/types/indexReports.ts';

export async function getHistorialCliente(numeroIdentificacion: string, page: number, size: number): Promise<HistoriaClienteCompleto> {
  try{
    const params = {
      page: page,
      size: size,
    };
    const response = await apiClient.get<HistoriaClienteCompleto>(
      `/reports/historial/${numeroIdentificacion}`, { params});
    return response.data;
  } catch (e) {
    console.error(`Error al obtener el historial para el cliente ${numeroIdentificacion}`, e);
    throw e;
  }

}
