<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAuditLogs } from '@/services/auditService';
import type { AuditLogPage, AuditLogParams } from '@/types/indexAudit';
import { extraerErrorApi } from '@/utils/errorUtils';

// --- ESTADO DEL COMPONENTE ---
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

// Estado para los filtros
const fechaInicio = ref('');
const fechaFin = ref('');
const usuarioEmail = ref('');

const logsPage = ref<AuditLogPage | null>(null);
const currentPage = ref(0);

// --- LÓGICA / MÉTODOS ---

async function fetchLogs(page = 0) {
  isLoading.value = true;
  errorMessage.value = null;
  currentPage.value = page;

  // (1) --- ¡CORRECCIÓN DE TIPOS! ---
  // Construimos el objeto de parámetros de forma segura y explícita.
  const params: AuditLogParams = {
    page,
    size: 15,
  };

  // Añadimos los filtros solo si tienen un valor.
  // Esto asegura que nunca pasemos 'undefined' donde se espera un 'string'.
  if (fechaInicio.value) {
    // Convertimos la fecha al formato ISO completo que espera el backend
    params.fechaInicio = new Date(fechaInicio.value + 'T00:00:00-05:00').toISOString();
  }
  if (fechaFin.value) {
    params.fechaFin = new Date(fechaFin.value + 'T23:59:59-05:00').toISOString();
  }
  if (usuarioEmail.value) {
    params.usuarioEmail = usuarioEmail.value;
  }

  try {
    const data = await getAuditLogs(params);
    logsPage.value = data;
  } catch (error) {
    errorMessage.value = extraerErrorApi(error, 'No se pudieron cargar los registros de auditoría.');
  } finally {
    isLoading.value = false;
  }
}

function clearFilters() {
  fechaInicio.value = '';
  fechaFin.value = '';
  usuarioEmail.value = '';
  fetchLogs(0);
}

onMounted(() => {
  fetchLogs();
});

function formatFullDateTime(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'America/Bogota',
  }).format(date);
}
</script>

<template>
  <div>
    <h2 class="mb-4">Registro de Auditoría</h2>

    <!-- Panel de Filtros -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-12 col-md-4">
            <label for="fechaInicio" class="form-label fw-bold">Desde</label>
            <input type="date" id="fechaInicio" class="form-control" v-model="fechaInicio">
          </div>
          <div class="col-12 col-md-4">
            <label for="fechaFin" class="form-label fw-bold">Hasta</label>
            <input type="date" id="fechaFin" class="form-control" v-model="fechaFin">
          </div>
          <div class="col-12 col-md-4">
            <label for="usuarioEmail" class="form-label fw-bold">Usuario (Email)</label>
            <input type="email" id="usuarioEmail" class="form-control" v-model="usuarioEmail" placeholder="ejemplo@correo.com">
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <button class="btn btn-outline-secondary" @click="clearFilters">Limpiar Filtros</button>
          <button class="btn btn-primary" @click="fetchLogs(0)">Aplicar Filtros</button>
        </div>
      </div>
    </div>

    <!-- Sección de Resultados -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Cargando registros...</p>
    </div>
    <div v-else-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>
    <div v-else-if="logsPage && logsPage.content.length > 0" class="card">
      <div class="card-body table-responsive">
        <p class="text-muted">
          Mostrando {{ logsPage.numberOfElements }} de {{ logsPage.totalElements }} registros.
          Página {{ logsPage.number + 1 }} de {{ logsPage.totalPages }}.
        </p>
        <table class="table table-striped table-hover table-sm">
          <thead class="table-dark">
          <tr>
            <th>Fecha y Hora</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Detalles</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="log in logsPage.content" :key="log.id">
            <!-- (2) --- ¡CORRECCIÓN! Usamos la función de formateo --- -->
            <td>{{ formatFullDateTime(log.timestamp) }}</td>
            <td>{{ log.usuarioEmail }}</td>
            <td><span class="badge bg-secondary">{{ log.accion }}</span></td>
            <td>{{ log.detalles }}</td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer d-flex justify-content-end gap-2">
        <button
          class="btn btn-secondary"
          :disabled="logsPage.first"
          @click="fetchLogs(currentPage - 1)">
          Anterior
        </button>
        <button
          class="btn btn-secondary"
          :disabled="logsPage.last"
          @click="fetchLogs(currentPage + 1)">
          Siguiente
        </button>
      </div>
    </div>
    <div v-else class="alert alert-info text-center">
      No se encontraron registros de auditoría que coincidan con los filtros seleccionados.
    </div>
  </div>
</template>
