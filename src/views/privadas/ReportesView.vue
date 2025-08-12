<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getHistorialCliente, exportarReporteCitasExcel } from '@/services/reportsService.ts';
import type { HistoriaClienteCompleto } from '@/types/indexReports.ts';
import { useAuthStore } from '@/stores/auth.ts';
const authStore = useAuthStore();
import { LISTA_SEDES } from '@/config/sedes.ts';
import { formatCurrency } from '@/utils/formatter.ts';

const searchId = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const historialReporte = ref<HistoriaClienteCompleto | null>(null);
const currentPage = ref(0); // pagina actual

// ESTADO PARA REPORTE DE EXCEL
const reporteFechaInicio = ref('');
const reporteFechaFin = ref('');
const reporteSede = ref('');
const isExporting = ref(false);

async function handleSearch(page = 0) {
  if (!searchId.value.trim()) {
    alert("Por favor, ingrese un número de identificación para buscar.");
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;
  currentPage.value = page;

  try {
    // (3) Llamamos a la función de nuestro nuevo servicio
    const data = await getHistorialCliente(searchId.value, page, 10);
    historialReporte.value = data;
  } catch (error) {
    console.error(`Error al buscar el historial para ${searchId.value}:`, error);
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}

async function handleExportarReporte() {
  if (!reporteFechaInicio.value || !reporteFechaFin.value) {
    alert("Por favor, selecciona un rango de fechas para el reporte.");
    return;
  }
  isExporting.value = true;
  try {
    const blob = await exportarReporteCitasExcel(
      reporteFechaInicio.value,
      reporteFechaFin.value,
      reporteSede.value,
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Reporte_citas_${reporteFechaInicio.value}_a_${reporteFechaFin.value}.xlsx`;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (e) {
    alert((e as Error).message);
  } finally {
    isExporting.value = false;
  }
}

watch(searchId, (newValue) => {
  // Usamos una expresión regular para encontrar y reemplazar todos los caracteres
  // que NO son dígitos (\D).
  const soloNumeros = newValue.replace(/\D/g, '');

  // Actualizamos el valor solo si ha cambiado, para evitar un bucle infinito.
  if (searchId.value !== soloNumeros) {
    searchId.value = soloNumeros;
  }
});
// fechas por defecto a cargar, HACE 30 DIAS
onMounted(() => {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - 30);
  const finStr = fin.toISOString().split('T')[0];
  const inicioStr = inicio.toISOString().split('T')[0];

  reporteFechaInicio.value = inicioStr;
  reporteFechaFin.value = finStr;
});
</script>

<template>
  <div >
    <h2 class="mb-4 green-alven">Panel de Reportes</h2>
    <!-- SECCIÓN 1 Para el Reporte de Excel --- -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Reporte de Citas por Período (Excel)</h5>
        <p class="card-subtitle mb-3 text-muted">
          Genera un reporte en formato Excel con el detalle de las citas en un rango de fechas.
        </p>
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-4">
            <label for="reporteFechaInicio" class="form-label fw-bold">Fecha de Inicio</label>
            <input type="date" id="reporteFechaInicio" class="form-control" v-model="reporteFechaInicio">
          </div>
          <div class="col-12 col-md-4">
            <label for="reporteFechaFin" class="form-label fw-bold">Fecha de Fin</label>
            <input type="date" id="reporteFechaFin" class="form-control" v-model="reporteFechaFin">
          </div>
          <div v-if="authStore.isAuditor" class="col-12 col-md-4">
            <label for="reporteSede" class="form-label fw-bold">Sede (Opcional)</label>
            <select id="reporteSede" class="form-select" v-model="reporteSede">
              <option value="">Todas las sedes</option>
              <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
            </select>
          </div>
        </div>
        <div class="mt-3 text-end">
          <button class="btn btn-success" @click="handleExportarReporte" :disabled="isExporting">
            <span v-if="isExporting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <i v-else class="bi bi-file-earmark-excel-fill me-2"></i>
            Generar y Descargar
          </button>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 2 Panel de Búsqueda -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Historial de Citas por Cliente</h5>
        <div class="d-flex gap-2">
          <input
            type="text"
            class="form-control"
            placeholder="Ingrese número de identificación..."
            v-model="searchId"
            @keyup.enter="handleSearch(0)"
          />
          <button class="btn btn-primary" @click="handleSearch(0)" :disabled="isLoading">
            <span v-if="isLoading && currentPage === 0" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span v-else>Generar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- (5) Sección de Resultados -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Generando reporte...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="historialReporte" class="card">
      <div class="card-header">
        <h5>Historial para: <strong>{{ historialReporte.nombreCompleto }}</strong></h5>
        <p class="mb-0 text-muted">{{ historialReporte.tipoIdentificacion }} {{ historialReporte.numeroIdentificacion }}</p>
      </div>
      <div v-if="historialReporte.historialCitas.content.length > 0">
        <div class="card-body table-responsive">
          <p class="text-muted">
            Mostrando {{ historialReporte.historialCitas.numberOfElements }} de {{ historialReporte.historialCitas.totalElements }} citas.
            Página {{ historialReporte.historialCitas.number + 1 }} de {{ historialReporte.historialCitas.totalPages }}.
          </p>
          <table class="table table-striped table-hover">
            <thead class="table-dark">
            <tr>
              <th>ID Cita</th>
              <th>Fecha y Hora</th>
              <th>Estado</th>
              <th>Tipo Atención</th>
              <th>Exámenes</th>
              <th>Estado Resultados</th>
              <th>Valor Servicio</th>
              <th>Valor Copago</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="cita in historialReporte.historialCitas.content" :key="cita.idCita">
              <td>{{ cita.idCita }}</td>
              <td><span class="green-alven">{{ cita.fechaHoraCita }}</span></td>
              <td><span class="badge bg-info">{{ cita.estadoCita }}</span></td>
              <td>{{ cita.tipoAtencion || 'N/A' }}</td>
              <td>{{ cita.examenes }}</td>
              <td><span class="badge bg-secondary">{{ cita.estadoResultados }}</span></td>
              <td>{{ formatCurrency(cita.valorServicio) }}</td>
              <td>{{ formatCurrency(cita.valorCopago) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- (6) Controles de Paginación -->
        <div class="card-footer d-flex justify-content-end gap-2">
          <button
            class="btn btn-secondary"
            :disabled="historialReporte.historialCitas.first"
            @click="handleSearch(currentPage - 1)">
            Anterior
          </button>
          <button
            class="btn btn-secondary"
            :disabled="historialReporte.historialCitas.last"
            @click="handleSearch(currentPage + 1)">
            Siguiente
          </button>
        </div>
      </div>
      <div v-else class="card-body">
        <div class="alert alert-info text-center m-0">
          Este cliente no tiene un historial de citas para mostrar.
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.green-alven {
  color: #238636;
}
</style>
