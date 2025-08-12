import type { Page } from '@/types/indexReports.ts';
/**
* Representa un único registro de auditoría que viene del backend.
* Reflejo de la entidad AuditLog.java.
*/
export interface AuditLog {
  id: number;
  timestamp: string;
  usuarioEmail: string;
  accion: string;
  detalles: string;
}

export interface AuditLogParams {
  page: number;
  size: number;
  fechaInicio: string;
  fechaFin: string;
  usuarioEmail: string;
}
export type AuditLogPage = Page<AuditLog>;
