import apiClient from './apiClient';

import type {
  ConteoEstado,
  ConteoPorDia,
  HoraPico,
  TopCliente,
  RendimientoSede,
  ConteoTipoAtencion,
  ConteoClientes,
  ConteoPorSexo
} from '@/types/indexStats';

// interfaz para los parámetros de filtro
export interface EstadisticasParams {
  fechaInicio: string; // "YYYY-MM-DD"
  fechaFin: string;    // "YYYY-MM-DD"
  nombreSede?: string; // Opcional
}
// --- FUNCIONES PARA ESTADÍSTICAS POR PERÍODO ---

export async function getConteoPorEstado(params: EstadisticasParams): Promise<ConteoEstado[]> {
  try {
    const response = await apiClient.get<ConteoEstado[]>('/estadisticas/conteo-por-estados', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el conteo por estado:", error);
    throw error;
  }
}

export async function getConteoPorDia(params: EstadisticasParams): Promise<ConteoPorDia[]> {
  try {
    const response = await apiClient.get<ConteoPorDia[]>('/estadisticas/conteo-dia-semana', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el conteo por día:", error);
    throw error;
  }
}

export async function getHorarioPico(params: EstadisticasParams): Promise<HoraPico[]> {
  try {
    const response = await apiClient.get<HoraPico[]>('/estadisticas/horario-pico', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el horario pico:", error);
    throw error;
  }
}

export async function getTopClientes(params: { fechaInicio: string, fechaFin: string }): Promise<TopCliente[]> {
  try {
    const response = await apiClient.get<TopCliente[]>('/estadisticas/top-clientes', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el top 3 de clientes:", error);
    throw error;
  }
}

export async function getRendimientoPorSede(params: { fechaInicio: string, fechaFin: string }): Promise<RendimientoSede[]> {
  try {
    const response = await apiClient.get<RendimientoSede[]>('/estadisticas/rendimiento-sedes', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el rendimiento por sede:", error);
    throw error;
  }
}

export async function getConteoTipoAtencion(params: { fechaInicio: string, fechaFin: string }): Promise<ConteoTipoAtencion[]> {
  try {
    const response = await apiClient.get<ConteoTipoAtencion[]>('/estadisticas/conteo-tipo-atencion', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el conteo por tipo de atención:", error);
    throw error;
  }
}

export async function getAdquisicionClientes(params: { fechaInicio: string, fechaFin: string }): Promise<ConteoClientes> {
  try {
    const response = await apiClient.get<ConteoClientes>('/estadisticas/adquisicion-clientes', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener la adquisición de clientes:", error);
    throw error;
  }
}


// --- FUNCIONES PARA ESTADÍSTICAS HISTÓRICAS ---

export async function getConteoHistoricoPorTipoAtencion(): Promise<ConteoTipoAtencion[]> {
  try {
    const response = await apiClient.get<ConteoTipoAtencion[]>('/estadisticas/conteo-tipo-atencion/historico');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el conteo histórico por tipo de atención:", error);
    throw error;
  }
}

export async function getRendimientoPorSedeHistorico(): Promise<RendimientoSede[]> {
  try {
    const response = await apiClient.get<RendimientoSede[]>('/estadisticas/rendimiento-sedes/historico');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el rendimiento histórico por sede:", error);
    throw error;
  }
}

export async function getConteoHistoricoPorSexo(): Promise<ConteoPorSexo[]> {
  try {
    const response = await apiClient.get<ConteoPorSexo[]>('/estadisticas/conteo-sexo/historico');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el conteo histórico por sexo:", error);
    throw error;
  }
}

export async function getConteoHistoricoPorEstados(nombreSede?: string): Promise<ConteoEstado[]> {
  try {
    const params = nombreSede ? { nombreSede } : {};
    const response = await apiClient.get<ConteoEstado[]>('/estadisticas/conteo-por-estados/historico', { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener el conteo histórico por estados:", error);
    throw error;
  }
}
