<template>
    <div class="row justify-content-center">
      <div class="col-lg-12">
        <div class="card shadow-lg border-0" style="background-color: #f8f9fa">
          <div class="card-body p-2">
            <div class="d-flex justify-content-center">
              <h2 class="card-tittle text-center fw-bold mb-3 blue-alven">Agendas</h2>
            </div>
            <div>
              <h2 class="mb-3 green-alven">Agenda de Citas</h2>
              <!-- Panel de Controles -->
              <div class="card mb-3 overflow-auto">
                <div class="card-body filter-panel-body flex-wrap flex-lg-row align-items-center gap-3">
                  <!-- Botones de Filtro Rápido -->
                  <div class="btn-group" role="group">
                    <button
                      type="button"
                      class="btn"
                      :class="activeFilter === 'today' ? 'btn-primary' : 'btn-outline-primary'"
                      @click="fetchCitas('today')">
                      Citas Hoy
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="activeFilter === 'tomorrow' ? 'btn-primary' : 'btn-outline-primary'"
                      @click="fetchCitas('tomorrow')">
                      Citas Mañana
                    </button>
                  </div>
                  <div class="row g-2 align-items-end">
                    <!-- Selector de Fecha Específica -->
                    <div class="col-12 col-md-auto">
                      <label for="date-filter" class="form-label mb-0">Buscar por fecha:</label>
                      <input
                        type="date"
                        id="date-filter"
                        class="form-control"
                        style="width: auto;"
                        v-model="selectedDate"
                        @change="handleDateChange"
                      />
                    </div>
                    <!-- Selector de filtro de estado de cita-->
                    <div class="col-12 col-md-auto">
                      <label for="status-filter" class="form-label mb-0">Filtrar por estado:</label>
                      <select
                        id="status-filter"
                        class="form-select"
                        style="width: auto;"
                        v-model="selectedStatus"
                        @change="fetchCitas(activeFilter)"
                      >
                        <option value="">Todos..</option>
                        <option value="AGENDADA">Agendada</option>
                        <option value="CANCELADA">Cancelada</option>
                        <option value="COMPLETADA">Completada</option>
                        <option value="NO_ASISTIO">No Asistió</option>
                      </select>
                    </div>
                    <!-- FILTRO DE SEDE SOLO PARA AUDITORES-->
                    <div v-if="authStore.isAuditor" class="col-12 col-md-auto g-2">
                      <label for="sede-filter" class="form-label mb-0">Filtrar por sede:</label>
                      <select id="sede-filter" class="form-select" style="width: auto" v-model="selectedSede">
                        <option value="">Todas..</option>
                        <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">
                          {{ sede.nombre }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Estado de Carga -->
              <div v-if="isLoading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando citas...</p>
              </div>

              <!-- Estado de Error -->
              <div v-else-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>

              <!-- Tabla de Citas -->
              <div v-else-if="citasFiltradas.length > 0" class="table-responsive">
                <table class="table table-striped table-hover align-middle">
                  <thead class="table-dark">
                  <tr>
                    <th>Hora</th>
                    <th v-if="authStore.isAuditor">Sede</th>
                    <th>Paciente</th>
                    <th>Identificación</th>
                    <th>Exámenes</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  <!-- Usamos v-for para crear una fila por cada cita en nuestro array -->
                  <tr v-for="cita in citasFiltradas" :key="cita.id">
                    <td><span class="green-alven">{{ cita.fechaHoraCita }}</span></td>
                    <td v-if="authStore.isAuditor">{{ cita.nombreSede }}</td>
                    <td>{{ cita.nombreCompletoCliente }}</td>
                    <td>{{ cita.tipoIdentificacion }} {{ cita.numeroIdentificacionCliente }}</td>
                    <td><span style="font-size: 15px">{{ cita.examenes }}</span></td>
                    <td><span class="badge" :class="getBadgeClassForStatus(cita.estado)">{{ cita.estado }}</span></td>
                    <td class="text-center g-2">
                      <button @click="openDetailsModal(cita)" class="btn btn-sm btn-outline-primary" title="Detalles"><i class="bi bi-info-circle-fill"></i></button>
                      <button v-if="cita.fotoPublicId" @click="handleVerOrden(cita)" class="btn btn-sm btn-outline-info" title="Ver"><i class="bi bi-eye-fill"></i></button>
                      <template v-if="cita.nombreSede === authStore.user?.sede">
                        <button @click="openEditModal(cita)" class="btn btn-sm btn-outline-warning" title="Reagendar"><i class="bi bi-pencil-fill"></i></button>
                        <button v-if="cita.estado === 'AGENDADA'" @click="handleCancelarCita(cita.id)" class="btn btn-sm btn-outline-danger" title="Cancelar"><i class="bi bi-trash-fill"></i></button>
                        <button v-if="cita.estado === 'AGENDADA'" @click="marcarComoCompletada(cita.id)" class="btn btn-sm btn-outline-success" title="Marcar como Cmpletada">
                          <i class="bi bi-check-lg"></i>
                        </button>
                        <button v-if="cita.estado === 'AGENDADA'" @click="marcarComoNoAsistio(cita.id)" class="btn btn-sm btn-outline-secondary" title="Marcar como No Asistió">
                          <i class="bi bi-person-x-fill"></i>
                        </button>
                      </template>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
              <!--  Mensaje si no hay citas -->
              <div v-else class="alert alert-secondary text-center">
                No hay citas para mostrar para la fecha seleccionada.
              </div>
            </div>
          </div>
        </div>

      </div>
      <!-- MODAL DE EDICION -->
      <div v-if="isEditModalVisible">
        <!-- (2) El div del modal usa las clases de Bootstrap. La clase 'show' y el display 'block' lo hacen visible. -->
        <div class="modal fade show" tabindex="-1" style="display: block;">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title text-primary">Editar Cita #{{ citaParaEditar?.id }}</h5>
                <button type="button" class="btn-close" @click="closeEditModal"></button>
              </div>
              <div class="modal-body">
                <p><strong>Paciente:</strong> {{ citaParaEditar?.nombreCompletoCliente }}</p>
                <p><strong>Sede:</strong> {{ citaParaEditar?.nombreSede }}</p>
                <hr>

                <!-- SECCION DE REAGENDAMIENTO -->
                <div class="mb-3">
                  <h6 class="green-alven"><strong>Reagendar Cita</strong></h6>
                  <div class="row g-2 align-items-end">
                    <div class="col-md-6">
                      <label for="reagendarFecha" class="form-label">1. Elige la nueva fecha:</label>
                      <input
                        type="date"
                        id="reagendarFecha"
                        class="form-control"
                        v-model="reagendarFechaSeleccionada"
                        :disabled="!['AGENDADA', 'NO_ASISTIO'].includes(citaParaEditar?.estado || '')"
                      />
                    </div>
                    <div class="col-md-6" v-if="reagendarFechaSeleccionada">
                      <label class="form-label">2. Elige un horario disponible:</label>
                      <div v-if="isReagendarLoading" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>
                      <div v-else-if="reagendarHorariosDisponibles.length > 0" class="d-flex flex-wrap gap-2">
                        <button
                          v-for="time in reagendarHorariosDisponibles"
                          :key="time"
                          type="button"
                          class="btn btn-sm"
                          :class="reagendarHoraSeleccionada === time ? 'btn-success' : 'btn-outline-success'"
                          @click="reagendarHoraSeleccionada = time">
                          {{ time }}
                        </button>
                      </div>
                      <div v-else class="text-muted small">No hay horarios disponibles para este día.</div>
                    </div>
                  </div>
                </div>
                <!-- SECCION DE COTIZACION -->
                <div v-if="authStore.isAdmin || authStore.isAuditor" class="mt-4">
                  <hr>
                  <h6 class="green-alven"><strong>Datos de Cotización y Facturación</strong></h6>
                  <div class="row g-3">
                    <div class="col-md-5">
                      <label for="valorServicio" class="form-label">Valor del Servicio</label>
                      <input type="text" id="valorServicio" class="form-control" v-model="valorServicioFormatted" placeholder="Ej: 50000" required>
                    </div>
                    <div class="col-md-7">
                      <label for="valorCopago" class="form-label">Valor Copago (si aplica)
                        <span v-if="arePrepagadaFieldsRequired" class="text-danger fw-bold">*</span>
                      </label>
                      <input type="text" id="valorCopago" class="form-control" v-model="valorCopagoFormatted" placeholder="Ej: 15000">
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="numAutorizacion" class="form-label">Número de Autorización (si aplica)
                        <span v-if="arePrepagadaFieldsRequired" class="text-danger fw-bold">*</span>
                      </label>
                      <input type="text" id="numAutorizacion" class="form-control" v-model="editFormData.numeroAutorizacion">
                    </div>
                    <div class="col-12 col-md-6">
                      <label for="estadoResultados" class="form-label">Estado de Resultados</label>
                      <select id="estadoResultados" class="form-select" v-model="editFormData.estadoResultados">
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PARCIAL">Parcial</option>
                        <option value="ENTREGADOS">Entregados</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="handleConfirmUpdate"
                  :disabled="isSaveDisabled"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- (3) El 'backdrop' es el fondo oscuro semitransparente que va detrás del modal -->
        <div class="modal-backdrop fade show"></div>

      </div>
      <!-- AQUI -->
      <!-- Modal de Detalles -->
      <div v-if="isDetailsModalVisible" class="modal fade show" tabindex="-1" style="display: block;">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-primary">Detalles de la Cita #{{ citaParaDetalles?.id }}</h5>
              <button type="button" class="btn-close" @click="closeDetailsModal"></button>
            </div>
            <div v-if="citaParaDetalles" class="modal-body">
              <h6 class="green-alven"><strong>Datos del Paciente</strong></h6>
              <ul class="list-group list-group-flush mb-3">
                <li class="list-group-item"><strong>Nombre:</strong> {{ citaParaDetalles.nombreCompletoCliente }}</li>
                <li class="list-group-item"><strong>Identificación:</strong> {{ citaParaDetalles.tipoIdentificacion }} {{ citaParaDetalles.numeroIdentificacionCliente }}</li>
              </ul>

              <h6 class="green-alven"><strong>Detalles del Agendamiento</strong></h6>
              <ul class="list-group list-group-flush mb-3">
                <li class="list-group-item"><strong>Fecha y Hora:</strong> {{ citaParaDetalles.fechaHoraCita }}</li>
                <li class="list-group-item"><strong>Dirección:</strong> {{ citaParaDetalles.direccionCita }}, {{ citaParaDetalles.barrio }}</li>
                <li class="list-group-item"><strong>Exámenes:</strong> {{ citaParaDetalles.examenes }}</li>
                <li class="list-group-item"><strong>Tipo de Atención:</strong> <span class="red-alven">{{ citaParaDetalles.tipoAtencion }}</span></li>
                <li class="list-group-item"><strong>Forma de Pago:</strong> {{ citaParaDetalles.formaPago }}</li>
                <li v-if="citaParaDetalles.observaciones" class="list-group-item"><strong>Observaciones:</strong> {{ citaParaDetalles.observaciones }}</li>
              </ul>

              <div v-if="citaParaDetalles.valorServicio || citaParaDetalles.valorCopago || citaParaDetalles.numeroAutorizacion">
                <h6 class="text-success">Datos de Cotización</h6>
                <ul class="list-group list-group-flush">
                  <li v-if="citaParaDetalles.valorServicio" class="list-group-item"><strong>Valor Servicio:</strong> {{ formatCurrency(citaParaDetalles.valorServicio) }}</li>
                  <li v-if="citaParaDetalles.valorCopago" class="list-group-item"><strong>Valor Copago:</strong> {{ formatCurrency(citaParaDetalles.valorCopago) }}</li>
                  <li v-if="citaParaDetalles.numeroAutorizacion" class="list-group-item"><strong>N° Autorización:</strong> {{ citaParaDetalles.numeroAutorizacion }}</li>

                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDetailsModal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="isDetailsModalVisible" class="modal-backdrop fade show"></div>
    </div>

</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue'
import {
  getCitasPorFecha,
  getUrlOrdenMedica,
  cancelarCita,
  actualizarCita,
  getAvailableTimes
} from '@/services/citasService.ts';
import type { CitaResponse, CitaUpdate } from '@/types';
import { useInputFilter } from '@/composables/useInputFilter.ts';
import { useAuthStore } from '@/stores/auth.ts';
import { LISTA_SEDES } from '@/config/sedes.ts';
import { formatCurrency } from '@/utils/formatter';

const authStore = useAuthStore();

const todasLasCitas = ref<CitaResponse[]>([]); // lista de citas de la API
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
// ESTADO PARA LOS FILTROS
const activeFilter = ref('today'); // el filtro que está activo
const selectedDate = ref('');
const selectedStatus = ref(''); // estado de cita para filtro
const selectedSede = ref(''); // filtro para la sede

const citasFiltradas = computed(() => {
  return todasLasCitas.value.filter(cita => {
    const sedeMatch = !selectedSede.value || cita.nombreSede === selectedSede.value;
    const estadoMatch = !selectedStatus.value || cita.estado === selectedStatus.value;
    return sedeMatch && estadoMatch;
  });
});

// constantes para logica de reagenda, cancelar y generar url de orden
const isEditModalVisible = ref(false); // vista del modal
const citaParaEditar = ref<CitaResponse | null>(null); // guarda la cita que estamos editando
const editFormData = reactive<CitaUpdate>({});
const isEditLoading = ref(false);
// variables solos del modal de REAGENDAMIENTO
const reagendarFechaSeleccionada = ref('');
const reagendarHorariosDisponibles = ref<string[]>([]);
const reagendarHoraSeleccionada = ref('');
const isReagendarLoading = ref(false);
// variables para el modal de DETALLES
const isDetailsModalVisible = ref(false);
const citaParaDetalles = ref<CitaResponse | null>(null);

// Definimos los patrones de limpieza que necesitamos.
const soloNumerosRegex = /[^0-9]/g; // Solo permite números
const alfanumericoRegex = /[^a-zA-Z0-9]/g; // Permite letras y números
useInputFilter(editFormData, 'valorServicio', soloNumerosRegex);
useInputFilter(editFormData, 'valorCopago', soloNumerosRegex);
useInputFilter(editFormData, 'numeroAutorizacion', alfanumericoRegex);

watch(reagendarFechaSeleccionada, async (newDate) => {
  if (!newDate || !citaParaEditar.value) {
    reagendarHorariosDisponibles.value = [];
    return;
  }
  isReagendarLoading.value = true;
  reagendarHorariosDisponibles.value = []; //limpiamos horarios anteriores
  reagendarHoraSeleccionada.value = '';
  try {
    const sede = citaParaEditar.value.nombreSede;
    const times = await getAvailableTimes(newDate, sede);
    reagendarHorariosDisponibles.value = times;
  } catch (e) {
    console.error('Error obteniendo disponibilidad para reagendar: ',e);
  } finally {
    isReagendarLoading.value = false;
  }
});

// propiedad computada que vigila los camboos en el modal de EDICION DE CITA
const isSaveDisabled = computed(() => {
  // El botón siempre está deshabilitado si se está procesando una petición.
  if (isEditLoading.value) {
    return true;
  }
  if (!citaParaEditar.value) {
    return true;
  }
  // Condición 1: ¿Se ha seleccionado una nueva fecha y hora para reagendar?
  const hasReagendado = reagendarFechaSeleccionada.value && reagendarHoraSeleccionada.value;
  const normalize = (value: any) => (value === null || value === undefined) ? '' : String(value);

  // Comparamos el estado actual del formulario (editFormData) con el estado original (citaParaEditar).
  const hasFormDataChanged =
    normalize(editFormData.valorServicio) !== normalize(citaParaEditar.value.valorServicio) ||
    normalize(editFormData.valorCopago) !== normalize(citaParaEditar.value.valorCopago) ||
    normalize(editFormData.numeroAutorizacion) !== normalize(citaParaEditar.value.numeroAutorizacion) ||
    normalize(editFormData.estadoResultados) !== normalize(citaParaEditar.value.estadoResultados);


  // El botón debe estar DESHABILITADO si NO se ha reagendado Y NO ha cambiado ningún dato del formulario.
  return !hasReagendado && !hasFormDataChanged;
});
// Nueva propiedad computada para la validación de TIPO DE ATENCION
// Devuelve 'true' si la cita que se está editando es de tipo prepagada.
const arePrepagadaFieldsRequired = computed(() => {
  if (!citaParaEditar.value || !citaParaEditar.value.tipoAtencion) {
    return false;
  }
  return citaParaEditar.value.tipoAtencion.includes('PREPAGADA');
});

async function fetchCitas(filtro: string) {
  isLoading.value = true;
  errorMessage.value = null;
  activeFilter.value = filtro;

  const fechaAConsultar = (filtro !== 'today' && filtro !== 'tomorrow') ? selectedDate.value : filtro;

  if (!fechaAConsultar) {
    isLoading.value = false;
    return;
  }
  try {
    const data = await getCitasPorFecha(fechaAConsultar, selectedStatus.value);
    todasLasCitas.value = data;
  } catch (error) {
    errorMessage.value = (error as Error).message;
    todasLasCitas.value = [];
  } finally {
    isLoading.value = false;
  }
}

function getBadgeClassForStatus(estado: string): string {
  switch (estado.toUpperCase()) {
    case 'AGENDADA':
      return 'bg-success'; // Verde para agendada
    case 'CANCELADA':
      return 'bg-danger';  // Rojo para cancelada
    case 'REAGENDADA':
      return 'bg-warning text-dark'; // Amarillo para reagendada
    case 'NO_ASISTIO':
      return 'bg-secondary'; // Gris para no asistió
    default:
      return 'bg-info';      // Azul como color por defecto
  }
}

function openEditModal(cita: CitaResponse) {
  citaParaEditar.value = { ...cita };
  editFormData.valorServicio = cita.valorServicio ?? undefined;
  editFormData.valorCopago = cita.valorCopago ?? undefined;
  editFormData.numeroAutorizacion = cita.numeroAutorizacion ?? '';
  editFormData.estadoResultados = cita.estadoResultados;
  isEditModalVisible.value = true;
}

function closeEditModal() {
  isEditModalVisible.value = false;
  citaParaEditar.value = null;
  Object.keys(editFormData).forEach(key => delete editFormData[key as keyof CitaUpdate]);
  reagendarFechaSeleccionada.value = '';
  reagendarHorariosDisponibles.value = [];
  reagendarHoraSeleccionada.value = '';
  selectedDate.value = '';
}

async function handleConfirmUpdate() {
  if (!citaParaEditar.value) return;
  // si los campos de PREPAGADA aon requeridos, verificamos
  if (arePrepagadaFieldsRequired.value) {
    const copagoValido = editFormData.valorCopago != null && editFormData.valorCopago >= 0;
    const autorizacionValido = editFormData.numeroAutorizacion && editFormData.numeroAutorizacion.trim() !== '';

    if (!copagoValido || !autorizacionValido) {
      alert("Para citas de tipo PREPAGADA, el 'Valor Copago' y el 'Número de Autorización' son obligatorios." );
      return;
    }
  }
  const updatePayload: CitaUpdate = { ...editFormData };
  if (reagendarFechaSeleccionada.value && reagendarHoraSeleccionada.value) {
    const fechaLocal = new Date(`${reagendarFechaSeleccionada.value}T${reagendarHoraSeleccionada.value}`);
    updatePayload.nuevaFechaHoraCita = fechaLocal.toISOString();
  }
  if(Object.keys(updatePayload).length === 0){
    alert("No se ha realizado ningun cambio.");
    return;
  }

  isEditLoading.value = true;
  try {
    await actualizarCita(citaParaEditar.value.id, updatePayload);
    alert("Cita actualizada con éxito.");
    closeEditModal();
    //fetchCitas('today');
  } catch (error) {
    alert((error as Error).message);
  } finally {
    isEditLoading.value = false;
  }
}
// metodos para modal DETALLES
function openDetailsModal(cita: CitaResponse) {
  citaParaDetalles.value = cita;
  isDetailsModalVisible.value = true;
}
function closeDetailsModal() {
  isDetailsModalVisible.value = false;
  citaParaDetalles.value = null;
}

async function handleVerOrden(cita: CitaResponse) {
  if (!cita.fotoPublicId) {
    alert("Esta cita no tiene una orden médica adjunta.");
    return;
  }
  try {
    alert('Obteniendo enlace seguro...');
    const urlSegura = await getUrlOrdenMedica(cita.id);
    window.open(urlSegura, '_blank');
  } catch (error) {
    alert((error as Error).message);
  }
}

async function handleCancelarCita(citaId: number) {
  if (confirm("¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.")) {
    try {
      await cancelarCita(citaId);
      alert("Cita cancelada con éxito.");
      fetchCitas('today'); // Refrescamos la tabla
    } catch (error) {
      alert((error as Error).message);
    }
  }
}

async function marcarComoCompletada(citaId: number) {
  if (!confirm("¿Marcar esta cita como COMPLETADA?")) return;
  const updateDTO: CitaUpdate = {
    estado: 'COMPLETADA'
  };
  try {
    await actualizarCita(citaId, updateDTO);
    alert("Cita COMPLETADA con exito");
    //fetchCitas('today');
  } catch (error) {
    alert((error as Error).message);
  }
}
async function marcarComoNoAsistio(citaId: number) {
  if (!confirm("¿Estás seguro de que deseas marcar esta cita como NO ASISTIÓ?")) return;

  const updateDTO: CitaUpdate = { estado: 'NO_ASISTIO' };
  try {
    await actualizarCita(citaId, updateDTO);
    alert("Cita marcada como no asistió.");
    //fetchCitas('today');
  } catch (error) {
    alert((error as Error).message);
  }
}
// formatear un input.
const valorServicioFormatted = computed({
  get() {
    if (editFormData.valorServicio === undefined || editFormData.valorServicio === null) {
      return '';
    }
    return editFormData.valorServicio.toLocaleString('es-CO');
  },
  set(newValue: string) {
    // Limpia cualquier carácter que no sea un número.
    const numericValue = parseInt(newValue.replace(/\D/g, ''), 10);
    // Guarda el número puro en nuestro estado, o undefined si el campo está vacío.
    editFormData.valorServicio = isNaN(numericValue) ? undefined : numericValue;
  }
});
const valorCopagoFormatted = computed({
  get() {
    if (editFormData.valorCopago === undefined || editFormData.valorCopago === null) {
      return '';
    }
    return editFormData.valorCopago.toLocaleString('es-CO');
  },
  set(newValue: string) {
    const numericValue = parseInt(newValue.replace(/\D/g, ''), 10);
    editFormData.valorCopago = isNaN(numericValue) ? undefined : numericValue;
  }
});

// cada que el usuario cambia la fecha en el calendario
function handleDateChange() {
  if (selectedDate.value) {
    fetchCitas(selectedDate.value);
  }
}


onMounted(() => {
  fetchCitas('today');
});
</script>

<style scoped>
.green-alven {
  color: #238636;
}
.blue-alven {
  color: #003566;
}
.red-alven {
  color: #C03437;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.filter-panel-body {
  min-width: 440px;
}
</style>
