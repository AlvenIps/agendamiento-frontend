<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import axios from 'axios';
import type { CitaRequest, CitaResponse, ClienteEnGrupo, CitaGrupalRequest, FormaPago, Sexo, TipoAtencion } from '@/types';
import { agendarNuevaCita, verificarCliente, getAvailableTimes, agendarCitaGrupal } from '@/services/citasService.ts';
import { useInputFilter } from '@/composables/useInputFilter.ts';
import html2canvas from 'html2canvas';
import { LISTA_SEDES } from '@/config/sedes.ts';
import AgregarPacienteModal from '@/components/citas/AgregarPacienteModal.vue';
import Swal from 'sweetalert2';

// --- CONTANTES PARA SELECTS DINÁMICOS ---
const TIPOS_DE_ATENCION: TipoAtencion[] = [
  'PARTICULAR', 'SURA_PREPAGADA', 'COOMEVA_PREPAGADA', 'SEGUROS_BOLIVAR_PREPAGADA','COLMEDICA_PREPAGADA',
  'FOMAG', 'SOLO_TOMA_DE_MUESTRA', 'INYECTOLOGIA', 'SUERO_VITAMINADO'
];
const FORMA_PAGO: FormaPago[] = [
  'EFECTIVO', 'TRANSFERENCIA', 'DATAFONO', 'NO_DEFINIDO'
];

// --- ESTADO ---
const initialDatosCompartidos = {
  nombreSede: '',
  fechaHoraCita: '',
  direccionCita: '',
  barrio: '',
  formaPago: '' as FormaPago,
  observaciones: '',
};
const datosCompartidos = reactive({ ...initialDatosCompartidos });
const pacientes = ref<ClienteEnGrupo[]>([]);
const verificacionData = reactive({
  tipoIdentificacion: 'CC',
  numeroIdentificacion: ''
});

// (1) --- NUEVO ESTADO DEDICADO PARA ARCHIVOS ---
// Usamos un Map para asociar el ID del paciente con su archivo.
// Esto soluciona los problemas de reactividad.
const ordenesMedicasFiles = reactive(new Map<string, File>());

// --- ESTADO AUXILIAR ---
const citaAgendada = ref<CitaResponse[] | CitaResponse | null>(null);
const step = ref(1);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const maxDate = new Date().toISOString().split("T")[0];
const selectedDate = ref('');
const availableTimes = ref<string[]>([]);
const selectedTime = ref('');
const isCheckingAvailability = ref(false);
const minDate = new Date().toISOString().split("T")[0];
const confirmationCardRef = ref<HTMLElement | null>(null);
const mostrarModal = ref(false);
const mostrarModalCondiciones = ref(false);

// --- COMPUTED PROPS ---
const esGrupal = computed(() => pacientes.value.length > 1);
const puedeAgregarPersona = computed(() => pacientes.value.length < 3);

// (2) --- VALIDACIÓN ACTUALIZADA PARA USAR EL MAP DE ARCHIVOS ---
const isFormComplete = computed(() => {
  if (!datosCompartidos.barrio || !datosCompartidos.direccionCita) return false;
  if (pacientes.value.length === 0) return false;

  return pacientes.value.every(paciente => {
    if (!paciente.examenes) return false;
    if (paciente.tipoAtencion.includes('PREPAGADA') && !ordenesMedicasFiles.get(paciente.numeroIdentificacion)) {
      return false;
    }
    if (paciente._clienteNuevo) {
      if (!paciente.nombres || !paciente.apellidos || !paciente.email || !paciente.celular || !paciente.fechaNacimiento) {
        return false;
      }
    }
    return true;
  });
});


// --- WATCHERS ---
watch([selectedDate, () => datosCompartidos.nombreSede], async ([newDate, newSede]) => {
  if (!newDate || !newSede) {
    availableTimes.value = [];
    return;
  }
  isCheckingAvailability.value = true;
  availableTimes.value = [];
  selectedTime.value = '';
  errorMessage.value = null;
  try {
    let times = await getAvailableTimes(newDate, newSede);
    const hoy = new Date();
    const fechaSeleccionada = new Date(newDate + 'T00:00:00-05:00');
    if (fechaSeleccionada.toDateString() === hoy.toDateString()) {
      const horaActual = hoy.getHours();
      const minutoActual = hoy.getMinutes();
      times = times.filter(time => {
        const [hora, minuto] = time.split(':').map(Number);
        if (hora > horaActual) return true;
        if (hora === horaActual && minuto > minutoActual) return true;
        return false;
      });
    }
    availableTimes.value = times;
  } catch (error) {
    console.error("Ha ocurrido un error al cargar la disponibilidad", error)
    errorMessage.value = "No se pudo cargar la disponibilidad para la fecha seleccionada.";
    Swal.fire({
      title: "Oops!, ha ocurrido un error",
      text: "No se pudo cargar la disponibilidad para la fecha seleccionada.",
      icon: "error"
    })
    Swal.fire({

    })
  } finally {
    isCheckingAvailability.value = false;
  }
});

watch([selectedDate, selectedTime], ([newDate, newTime]) => {
  if (newDate && newTime) {
    datosCompartidos.fechaHoraCita = `${newDate}T${newTime}-05:00`;
  } else {
    datosCompartidos.fechaHoraCita = '';
  }
});

useInputFilter(verificacionData, 'numeroIdentificacion', /\D/g);

// --- MÉTODOS ---
async function handleVerification() {
  if (!verificacionData.numeroIdentificacion) {
    Swal.fire({
      title: "Falta un dato",
      text: "Por favor, ingresa un número de identificación",
      icon: 'info',
    });
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const existe = await verificarCliente(verificacionData.numeroIdentificacion);
    const primerPaciente: ClienteEnGrupo = {
      tipoIdentificacion: verificacionData.tipoIdentificacion,
      numeroIdentificacion: verificacionData.numeroIdentificacion,
      nombres: '', apellidos: '', sexo: 'OTRO', fechaNacimiento: '', email: '',
      celular: '', direccion: '', examenes: '', tipoAtencion: 'PARTICULAR',
      ordenMedicaFile: null, _clienteNuevo: !existe
    };
    pacientes.value.push(primerPaciente);
    step.value = 2;
  } catch (error) {
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}

// (3) --- LÓGICA DE ENVÍO ACTUALIZADA ---
async function handleSubmit() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    let resultado: CitaResponse | CitaResponse[];

    // Preparamos la lista de pacientes con sus archivos correspondientes del Map
    const pacientesConArchivos = pacientes.value.map(p => ({
      ...p,
      ordenMedicaFile: ordenesMedicasFiles.get(p.numeroIdentificacion) || null,
    }));

    if (esGrupal.value) {
      const payload: CitaGrupalRequest = {
        ...datosCompartidos,
        clientes: pacientesConArchivos,
      };
      resultado = await agendarCitaGrupal(payload);
    } else {
      const pacienteUnico = pacientesConArchivos[0];
      const payload: CitaRequest = {
        ...datosCompartidos,
        tipoIdentificacion: pacienteUnico.tipoIdentificacion,
        numeroIdentificacion: pacienteUnico.numeroIdentificacion,
        nombres: pacienteUnico.nombres,
        apellidos: pacienteUnico.apellidos,
        sexo: pacienteUnico.sexo,
        fechaNacimiento: pacienteUnico.fechaNacimiento,
        email: pacienteUnico.email,
        celular: pacienteUnico.celular,
        direccionCliente: pacienteUnico.direccion,
        examenes: pacienteUnico.examenes,
        tipoAtencion: pacienteUnico.tipoAtencion,
        ordenMedica: pacienteUnico.ordenMedicaFile,
      };
      resultado = await agendarNuevaCita(payload);
    }

    citaAgendada.value = resultado;
    step.value = 3;

  } catch (error) {
    console.error('Error detallado al agendar la cita:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;
      if (errorData.fechaHoraCita) {
        errorMessage.value = errorData.fechaHoraCita;
      } else if (errorData.mensaje) {
        errorMessage.value = errorData.mensaje;
      } else {
        errorMessage.value = 'Ocurrió un error de validación. Revise los datos.';
      }
    } else {
      errorMessage.value = (error as Error).message;
    }
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}

function agregarNuevoPaciente(pacienteDesdeModal: ClienteEnGrupo) {
  const existe = pacientes.value.some(p => p.numeroIdentificacion === pacienteDesdeModal.numeroIdentificacion);
  if (existe) {
    Swal.fire({
      title: "Revise sus datos",
      text: "Esta persona ya ha sido agregada a la cita.",
      icon: "info",
    })
    return;
  }
  if (puedeAgregarPersona.value) {
    pacientes.value.push(pacienteDesdeModal);
    mostrarModal.value = false;
  }
}
// MANEJAR FLUJO DEL AVISO
function iniciarAgregarPersona() {
  mostrarModalCondiciones.value = true;
}
function confirmarYProceder() {
  mostrarModalCondiciones.value = false;
  mostrarModal.value = true;
}

function eliminarPaciente(index: number) {
  const pacienteId = pacientes.value[index].numeroIdentificacion;
  ordenesMedicasFiles.delete(pacienteId); // También eliminamos el archivo del Map
  pacientes.value.splice(index, 1);
}

// (4) --- MANEJO DE ARCHIVOS ACTUALIZADO ---
function handlePacienteFileUpload(event: Event, pacienteId: string) {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    ordenesMedicasFiles.set(pacienteId, target.files[0]);
  } else {
    ordenesMedicasFiles.delete(pacienteId);
  }
}

// (5) --- RESETEO ACTUALIZADO ---
function resetForm() {
  datosCompartidos.nombreSede = initialDatosCompartidos.nombreSede;
  datosCompartidos.fechaHoraCita = initialDatosCompartidos.fechaHoraCita;
  datosCompartidos.direccionCita = initialDatosCompartidos.direccionCita;
  datosCompartidos.barrio = initialDatosCompartidos.barrio;
  datosCompartidos.formaPago = initialDatosCompartidos.formaPago;
  datosCompartidos.observaciones = initialDatosCompartidos.observaciones;
  pacientes.value = [];
  ordenesMedicasFiles.clear(); // Limpiamos el Map de archivos
  verificacionData.tipoIdentificacion = 'CC';
  verificacionData.numeroIdentificacion = '';
  selectedDate.value = '';
  selectedTime.value = '';
  step.value = 1;
  errorMessage.value = null;
  citaAgendada.value = null;
}

async function handleDownloadImage() {
  await nextTick();
  if (!confirmationCardRef.value) return;
  try {
    const canvas = await html2canvas(confirmationCardRef.value, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `recordatorio-cita.png`;
    link.click();
  } catch (e) {
    console.error("Error al generar la imagen", e);
  }
}

function handleSendToWhatsapp() {
  const numeroAtencion = '573015030080';
  const mensaje = 'Hola Alven IPS, les envío el recordatorio de cita para recibir la cotización. ¡Gracias!';
  const url = `https://wa.me/${numeroAtencion}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}
// --- NUEVA FUNCIÓN DE FORMATO DE HORA ---
function formatTime(timeString: string): string {
  const [hour, minute] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hour, 10));
  date.setMinutes(parseInt(minute, 10));
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

const soloNumeros = (event: Event) => {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/\D/g, '');
};
const soloLetras = (event: Event) => {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/[^a-zA-Z\sñÑáéíóúÁÉÍÓÚ]/g, '');
};
</script>

<template>
  <div class="container my-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-lg border-0" style="background-color: #f8f9fa">
          <div class="card-body p-3 p-md-4">
            <div class="d-flex justify-content-center">
              <div style="max-width: 500px;">
                <img class="img-fluid" alt="Alven Care" src="https://res.cloudinary.com/dusy4drbp/image/upload/v1756670377/alven-care-removebg-preview_oihctq.png" />
              </div>
            </div>
            <h1 class="text-center blue-alven mb-4">
              Bienvenido a <span class="red-alven">Alven Care</span>, nuestro nuevo sistema de agendamiento.
            </h1>
            <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

            <!-- PASO 1 -->
            <div v-if="step === 1">
              <form @submit.prevent="handleVerification">
                <div class="row g-2">
                  <div class="col-lg-3">
                    <label for="tipoIdentificacion" class="form-label">Tipo iden.</label>
                    <select id="tipoIdentificacion" class="form-select" v-model="verificacionData.tipoIdentificacion" required>
                      <option value="CC">CC</option><option value="TI">TI</option><option value="RC">RC</option><option value="CE">CE</option><option value="MS">MS</option><option value="CN">CN</option><option value="PA">PA</option><option value="PE">PE</option><option value="AS">AS</option><option value="PT">PT</option>
                    </select>
                  </div>
                  <div class="col-md-9 mb-3">
                    <label for="identificacion" class="form-label">Número de Identificación</label>
                    <input type="text" class="form-control" id="identificacion" v-model="verificacionData.numeroIdentificacion" placeholder="Ingresa tu número sin puntos ni comas">
                  </div>
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn green-alven btn-lg d-inline-flex justify-content-center align-items-center gap-2" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm"></span><span v-else>Siguiente</span><i v-if="!isLoading" class="bi bi-arrow-right-circle-fill"></i>
                  </button>
                </div>
              </form>
            </div>

            <!-- PASO 2 -->
            <div v-else-if="step === 2">
              <form @submit.prevent="handleSubmit">
                <h4 class="mb-3">Personas para la Cita ({{ pacientes.length }}/3)</h4>
                <div class="list-group mb-4">
                  <div v-for="(paciente, index) in pacientes" :key="paciente.numeroIdentificacion" class="list-group-item">
                    <h6>{{ index + 1 }}. Paciente: {{ paciente.numeroIdentificacion }}</h6>
                    <div v-if="paciente._clienteNuevo" class="row g-3 mb-3">
                      <div class="col-md-6"><input type="text" class="form-control" v-model="paciente.nombres" placeholder="Nombres *" @input="soloLetras" required></div>
                      <div class="col-md-6"><input type="text" class="form-control" v-model="paciente.apellidos" placeholder="Apellidos *" @input="soloLetras" required></div>
                      <div class="col-md-6"><input type="email" class="form-control" v-model="paciente.email" placeholder="Email *" required></div>
                      <div class="col-md-6"><input type="tel" class="form-control" v-model="paciente.celular" placeholder="Celular *" @input="soloNumeros" required></div>
                      <div class="col-md-6">
                        <input type="date" class="form-control" v-model="paciente.fechaNacimiento" :max="maxDate" required>
                        <small class="form-text text-muted">Fecha de Nacimiento *</small>
                      </div>
                    </div>
                    <div class="row g-2">
                      <div class="col-12">
                        <label class="form-label">Exámenes a Realizar <span class="text-danger">*</span></label>
                        <textarea class="form-control" v-model="paciente.examenes" placeholder="Ej: Glucosa, Colesterol..." rows="2" required></textarea>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Tipo de Atención</label>
                        <select class="form-select" v-model="paciente.tipoAtencion" required>
                          <option v-for="tipo in TIPOS_DE_ATENCION" :key="tipo" :value="tipo">
                            {{ tipo.replace(/_/g, ' ') }}
                          </option>
                        </select>
                      </div>
                      <!-- (6) --- TEMPLATE ACTUALIZADO PARA USAR EL MAP DE ARCHIVOS --- -->
                      <div class="col-md-6">
                        <label class="form-label">
                          Orden Médica
                          <span v-if="paciente.tipoAtencion.includes('PREPAGADA')" class="text-danger fw-bold">* (Obligatoria)</span>
                        </label>
                        <div class="input-group">
                          <input
                            class="form-control"
                            type="file"
                            @change="e => handlePacienteFileUpload(e, paciente.numeroIdentificacion)"
                            accept="image/*"
                            :required="paciente.tipoAtencion.includes('PREPAGADA')"
                          >
                        </div>
                        <div v-if="ordenesMedicasFiles.get(paciente.numeroIdentificacion)" class="mt-1">
                          <small class="text-success">
                            <i class="bi bi-check-circle-fill"></i> Archivo: {{ ordenesMedicasFiles.get(paciente.numeroIdentificacion)?.name }}
                          </small>
                        </div>
                        <div v-else-if="paciente.tipoAtencion.includes('PREPAGADA')">
                          <small class="text-danger">
                            <i class="bi bi-exclamation-circle-fill"></i> Se requiere un archivo.
                          </small>
                        </div>
                      </div>
                    </div>
                    <button v-if="index > 0" type="button" class="btn btn-sm btn-outline-danger mt-2" @click="eliminarPaciente(index)">Eliminar Persona</button>
                  </div>
                </div>
                <div class="d-grid mb-4">
                  <button type="button" class="btn btn-outline-secondary" @click="iniciarAgregarPersona" :disabled="!puedeAgregarPersona">
                    <i class="bi bi-plus-circle-fill me-2"></i>Añadir otra persona ({{ pacientes.length }}/3)
                  </button>
                </div>
                <hr class="my-4">
                <h4 class="mb-3">Datos de la Cita (común para todos)</h4>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Sede de Atención</label>
                    <select class="form-select" v-model="datosCompartidos.nombreSede" required>
                      <option disabled value="">Elige una sede...</option>
                      <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Elige un día</label>
                    <input type="date" class="form-control" v-model="selectedDate" :min="minDate" required>
                  </div>
                  <div class="col-md-12" v-if="selectedDate && datosCompartidos.nombreSede">
                    <hr class="my-3"><label class="form-label">Horarios Disponibles para el {{ selectedDate }}:</label>
                    <div v-if="isCheckingAvailability" class="text-center"><div class="spinner-border spinner-border-sm text-success"></div><span class="ms-2">Buscando...</span></div>
                    <div v-else-if="availableTimes.length > 0" class="d-flex flex-wrap gap-2">
                      <button v-for="time in availableTimes" :key="time" type="button" class="btn" :class="selectedTime === time ? 'bton-green-alven' : 'bton-vacio-alven'" @click="selectedTime = time">{{ formatTime(time) }}</button>
                    </div>
                    <div v-else class="alert alert-warning p-2">No hay horarios disponibles.</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Barrio <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" v-model="datosCompartidos.barrio" required>
                  </div>
                  <div class="col-md-8">
                    <label class="form-label">Dirección de recogida <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" v-model="datosCompartidos.direccionCita" required>
                  </div>
                  <div class="col-md-12">
                    <label class="form-label">Forma de Pago <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="datosCompartidos.formaPago" required>
                      <option disabled value="">Seleccione una forma de pago...</option>
                      <option v-for="forma in FORMA_PAGO" :key="forma" :value="forma">
                        {{ forma.replace(/_/g, ' ') }}
                      </option>
                    </select>
                  </div>
                </div>
                <hr class="my-4">
                <div class="d-grid">
                  <button type="submit" class="btn blue-alven btn-lg" :disabled="isLoading || !datosCompartidos.fechaHoraCita || !isFormComplete">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                    <span v-else><b>{{ esGrupal ? 'Agendar Cita Grupal' : 'Agendar Cita' }}</b></span>
                  </button>
                </div>
              </form>
            </div>

            <!-- PASO 3 -->
            <div v-else-if="step === 3 && citaAgendada" class="text-center">
              <div class="mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" class="bi bi-check2-circle text-success" viewBox="0 0 16 16"><path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0"/><path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/></svg></div>
              <h2 class="fw-bold text-primary">¡Cita Agendada con Éxito!</h2>
              <p class="text-muted">Guarda este recordatorio y envíalo a nuestro WhatsApp para recibir la cotización.</p>
              <div class="card mt-4 text-start" ref="confirmationCardRef">
                <div v-if="!Array.isArray(citaAgendada)">
                  <div class="card-header fw-bold"><span class="green-alven text-center">Recordatorio de Cita: <span class="text-primary">ALVEN IPS</span></span></div>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Paciente:</strong> {{ (citaAgendada as CitaResponse).nombreCompletoCliente }}</li>
                    <li class="list-group-item"><strong>Identificación:</strong> {{ (citaAgendada as CitaResponse).tipoIdentificacion }} {{ (citaAgendada as CitaResponse).numeroIdentificacionCliente }}</li>
                    <li class="list-group-item"><strong>Fecha y Hora:</strong> {{ (citaAgendada as CitaResponse).fechaHoraCita }}</li>
                    <li class="list-group-item"><strong>Dirección:</strong> {{ (citaAgendada as CitaResponse).direccionCita }}, {{ (citaAgendada as CitaResponse).barrio }}</li>
                    <li class="list-group-item"><strong>Sede de Atención:</strong> {{ (citaAgendada as CitaResponse).nombreSede }}</li>
                    <li class="list-group-item"><strong>Exámenes:</strong> {{ (citaAgendada as CitaResponse).examenes }}</li>
                    <li class="list-group-item"><strong>Orden Médica:</strong> {{ ordenesMedicasFiles.has((citaAgendada as CitaResponse).numeroIdentificacionCliente) ? 'Sí' : 'No' }}</li>
                  </ul>
                </div>
                <div v-else>
                  <div class="card-header fw-bold">Recordatorio de Cita Grupal</div>
                  <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Fecha y Hora:</strong> {{ (citaAgendada as CitaResponse[])[0].fechaHoraCita }}</li>
                    <li class="list-group-item"><strong>Dirección:</strong> {{ (citaAgendada as CitaResponse[])[0].direccionCita }}</li>
                    <li class="list-group-item"><strong>Sede de Atención:</strong> {{ (citaAgendada as CitaResponse[])[0].nombreSede }}</li>
                    <li class="list-group-item">
                      <strong>Pacientes:</strong>
                      <ul class="mt-2">
                        <li v-for="cita in (citaAgendada as CitaResponse[])" :key="cita.id">
                          {{ cita.nombreCompletoCliente }} (Exámenes: {{ cita.examenes }}, Orden: {{ ordenesMedicasFiles.has(cita.numeroIdentificacionCliente) ? 'Sí' : 'No' }})
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="d-grid justify-content-center mt-4 gap-2">
                <button @click="handleDownloadImage" class="btn btn-primary"><i class="bi bi-download me-2"></i>Descargar</button>
                <button @click="handleSendToWhatsapp" class="btn btn-success"><i class="bi bi-whatsapp me-2"></i>Enviar a WhatsApp</button>
                <button @click="resetForm" class="btn btn-secondary">Agendar otra Cita</button>
              </div>
            </div>
          </div>
          <div class=" row justify-content-center">
            <img src="https://res.cloudinary.com/dusy4drbp/image/upload/v1756668913/alven-acredit-removebg-preview_l8zhqe.png" alt="Certificación"
                 class="img-fluid"
                 style="bottom: 1rem; right: 1rem; width: 150px; height: auto;">
          </div>
        </div>
      </div>
    </div>
  </div>


  <AgregarPacienteModal
    :is-visible="mostrarModal"
    @close="mostrarModal = false"
    @guardar="agregarNuevoPaciente"
  />
  <div class="modal fade" :class="{ 'show': mostrarModalCondiciones, 'd-block': mostrarModalCondiciones }" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Aviso de Citas Grupales</h5>
          <button type="button" class="btn-close" @click="mostrarModalCondiciones = false"></button>
        </div>
        <div class="modal-body">
          <p>Por favor, ten en cuenta las siguientes condiciones:</p>
          <ol>
            <li>Solo se permiten citas grupales para personas que estarán en el <strong>mismo lugar y a la misma hora</strong>.</li>
            <li>Se pueden agregar hasta <strong>2 personas más</strong> (para un total de 3).</li>
          </ol>
          <p class="mt-3"><strong>Nota:</strong> Esta opción es perfecta para familiares que necesiten varios estudios y que estén en el mismo domicilio.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="mostrarModalCondiciones = false">Cancelar</button>
          <button type="button" class="btn btn-primary" @click="confirmarYProceder">Entendido, Continuar</button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="mostrarModalCondiciones" class="modal-backdrop fade show"></div>

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
* { font-family: 'Roboto', sans-serif; }
p { font-size: 25px; }
.green-alven { color: #238636; }
.blue-alven { color: #003566; }
.red-alven { color: #C03437; }
.bton-green-alven {
  background-color: #238636 !important;
  color: #f0f2f5;
  border-radius: 8px;
  padding: 0.375rem 0.75rem;
  min-width: 90px;
  text-align: center;
  border: 1px solid #238636;
}
.bton-vacio-alven {
  background-color: transparent;
  color: #238636;
  border: 1px solid #238636;
  border-radius: 8px;
  padding: 0.375rem 0.75rem;
  min-width: 90px;
  text-align: center;
}
</style>
