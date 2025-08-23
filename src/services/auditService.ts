import apiClient from '@/services/apiClient.ts';
import type { AuditLogPage, AuditLogParams } from '@/types/indexAudit.ts';
import { extraerErrorApi } from '@/utils/errorUtils.ts'



export async function getAuditLogs(params: AuditLogParams): Promise<AuditLogPage> {
  try {
    const response = await apiClient.get<AuditLogPage>('/audit/logs', { params });
    return response.data;
  } catch (error) {
    const specificMessage = extraerErrorApi(error, 'Error al traer los logs');
    throw new Error(specificMessage);
  }
}

export async function exportAuditLogs(params: AuditLogParams): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>('/audit/exportar', {
      params,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(extraerErrorApi(error, 'No se pudo generar el reporte.'));
  }
}
