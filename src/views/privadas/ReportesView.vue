<script setup lang="ts">
import { ref, watch } from 'vue';
import { getHistorialCliente } from '@/services/reportsService.ts';
import type { HistoriaClienteCompleto } from '@/types/indexReports.ts';
import { isAxiosError } from 'axios';

const searchId = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const historialReporte = ref<HistoriaClienteCompleto | null>(null);
const currentPage = ref(0); // pagina actual

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
    if (isAxiosError(error) && error.response?.status === 404) {
      errorMessage.value = `No se encontró ningún cliente con la identificación "${searchId.value}".`;
    } else {
      errorMessage.value = "Ocurrió un error al generar el reporte.";
    }
  } finally {
    isLoading.value = false;
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
</script>

<template>
  <div >
    <h2 class="mb-4">Panel de Reportes</h2>

    <!-- (4) Panel de Búsqueda -->
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

    <div v-else-if="historialReporte" class="card">
      <div class="card-header">
        <h5>Historial para: <strong>{{ historialReporte.nombreCompleto }}</strong></h5>
        <p class="mb-0 text-muted">{{ historialReporte.tipoIdentificacion }} {{ historialReporte.numeroIdentificacion }}</p>
      </div>
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
            <td>{{ cita.valorServicio || 0 }}</td>
            <td>{{ cita.valorCopago || 0 }}</td>
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
  </div>
</template>

<style scoped>
.green-alven {
  color: #238636;
}
</style>
