import apiClient from '@/services/apiClient.ts';
import type { HistoriaClienteCompleto } from '@/types/indexReports.ts';
import { extraerErrorApi } from '@/utils/errorUtils.ts';

export async function getHistorialCliente(numeroIdentificacion: string, page: number, size: number): Promise<HistoriaClienteCompleto> {
  try {
    const params = {
      page: page,
      size: size,
    };
    const response = await apiClient.get<HistoriaClienteCompleto>(
      `/reports/historial/${numeroIdentificacion}`, { params });
    return response.data;
  } catch (error) {
    const specificMessage = extraerErrorApi(error, 'Cliente no encontrado.');
    throw new Error(specificMessage);
  }
}
export async function exportarReporteCitasExcel(fechaInicio: string,
                                                fechaFin: string,
                                                nombreSede?: string): Promise<Blob> {
  try{
    const params = {
      fechaInicio, fechaFin,
      nombreSede: nombreSede || undefined,
    };
    const response = await apiClient.get(`/reports/citas-por-fecha`,
      { params, responseType: 'blob' });
    return response.data;
  } catch (e) {
    console.error("Error al exportar el reporte de citas: ", e);
    throw e;
  }

}
