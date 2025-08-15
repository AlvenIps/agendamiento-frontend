<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { CitaRequest, CitaResponse } from '@/types';
import { agendarNuevaCita, verificarCliente, getAvailableTimes } from '@/services/citasService.ts';
import { useInputFilter } from '@/composables/useInputFilter.ts';
import html2canvas from 'html2canvas' // convierte html a imagen;
import { LISTA_SEDES } from '@/config/sedes.ts';
// ESTADO DEL COMPONENTE
const initialState: CitaRequest = {
  tipoIdentificacion: 'CC',
  numeroIdentificacion: '',
  nombres: '',
  apellidos: '',
  sexo: 'OTRO',
  fechaNacimiento: '',
  email: '',
  celular: '',
  direccionCliente: '',
  nombreSede: '',
  fechaHoraCita: '',
  direccionCita: '',
  barrio: '',
  examenes: '',
  tipoAtencion: 'PARTICULAR',
  formaPago: 'NO_DEFINIDO',
  observaciones: '',
  ordenMedica: null,
};

// Nuestro estado reactivo del formulario, inicializado con una copia del estado inicial.
const formData = reactive<CitaRequest>({ ...initialState });
// datos de la cita creada
const citaAgendada = ref<CitaResponse | null>(null);

const step = ref(1);
const isLoading = ref(false);
const clientExists = ref(false);
const errorMessage = ref<string | null>(null);
const maxDate = new Date().toISOString().split("T")[0];
//(3) --- NUEVO ESTADO PARA EL SELECTOR DE FECHA/HORA ---
const selectedDate = ref(''); // Guardará la fecha seleccionada (YYYY-MM-DD)
const availableTimes = ref<string[]>([]); // Guardará la lista de horarios devuelta por la API
const selectedTime = ref(''); // Guardará la hora seleccionada por el usuario
const isCheckingAvailability = ref(false); // Un 'loading' específico para la disponibilidad
const minDate = new Date().toISOString().split("T")[0]; // (4) Lógica para la fecha mínima en el calendario

const confirmationCardRef = ref<HTMLElement | null>(null); // apunta al div de recordatorio
const isOrdenMedicaRequired = computed(() => {
  return formData.tipoAtencion?.includes('PREPAGADA');
});

watch([selectedDate, () => formData.nombreSede], async ([newDate, newSede]) => {
  if (!newDate || !newSede) {
    availableTimes.value = [];
    return;
  }
  isCheckingAvailability.value = true;
  availableTimes.value = []; // Limpiamos los horarios anteriores
  selectedTime.value = '';   // Reseteamos la hora seleccionada
  errorMessage.value = null;

  try {
    // Llamamos a nuestro servicio con los nuevos valores
    const times = await getAvailableTimes(newDate, newSede);
    availableTimes.value = times;
  } catch (error) {
    console.error("Ha ocurrido un error al cargar la disponibilidad", error)
    errorMessage.value = "No se pudo cargar la disponibilidad para la fecha seleccionada.";
  } finally {
    isCheckingAvailability.value = false;
  }
});

// --- NUEVO "WATCHER" PARA CONSTRUIR LA FECHA FINAL ---
watch([selectedDate, selectedTime], ([newDate, newTime]) => {
  if (newDate && newTime) {
    // Combinamos la fecha y la hora para crear el string ISO que espera OffsetDateTime
    // El "-05:00" es crucial para la zona horaria de Colombia (COT)
    formData.fechaHoraCita = `${newDate}T${newTime}-05:00`;
  } else {
    // Si falta algún dato, reseteamos la fecha final
    formData.fechaHoraCita = '';
  }
});
// -- Observador que limpia el input en tiempo real
// 2. Define los patrones de limpieza
const soloNumerosRegex = /\D/g;
const soloLetrasRegex = /[^a-zA-Z\sñÑáéíóúÁÉÍÓÚ]/g;
useInputFilter(formData, 'numeroIdentificacion', soloNumerosRegex);
useInputFilter(formData, 'celular', soloNumerosRegex);
useInputFilter(formData, 'nombres', soloLetrasRegex);
useInputFilter(formData, 'apellidos', soloLetrasRegex);

// METODOS DEL COMPONENTE
async function handleVerification() {
  if (!formData.numeroIdentificacion) {
    errorMessage.value = 'Por favor, ingresa un número de identificación.';
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const existe = await verificarCliente(formData.numeroIdentificacion);
    clientExists.value = existe;
    step.value = 2; // siguiente paso del formulario
  } catch (error) {
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}
async function handleSubmit() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const citaCreada = await agendarNuevaCita(formData);
    citaAgendada.value = citaCreada;
    step.value = 3;
  } catch (error) {
    console.error('Error al agendar la cita:', error);
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}

function handleFileUpload(event: Event) {
  errorMessage.value = null;
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    formData.ordenMedica = null;
    return;
  }
  const file = target.files[0];
  // validacion de tipo de archivo
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Por favor, selecciona solo archivo de imagen (JPG, JPEG, PNG, WEBP)';
    target.value = '';
    formData.ordenMedica = null;
    return;
  }
  const fileSizeInMB = file.size / 1024 / 1024;
  if (fileSizeInMB > 9) {
    errorMessage.value = `El archivo es demasiado grande (${fileSizeInMB.toFixed(2)} MB).
    El tamaño máximo permitido es 10 MB.`;
    target.value = '';
    formData.ordenMedica = null;
    return;
  }
  formData.ordenMedica = file;
}

function resetForm() { // restaura el objeto formData
  Object.assign(formData, initialState);
  step.value = 1;
  clientExists.value = false;
  errorMessage.value = null;
  citaAgendada.value = null;
  const fileInput = document.getElementById('ordenMedica') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}
// metodos para imagen de recordatorio
async function handleDownloadImage() {
  await nextTick();
  if (!confirmationCardRef.value) {
    console.error("No se pudo encontrar el elemento del recordatorio.");
    return;
  }
  try {
    const canvas = await html2canvas(confirmationCardRef.value, {
      scale: 2,
      useCORS: true
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png'); // convierte foto a url de datos
    link.download = `recordatorio-${citaAgendada.value?.id}.png`;
    link.click();
  } catch (e) {
    console.error("Error al generar la imagen", e);
    alert("No se pudo generar la imagen del recordatorio.");
  }
}
function handleSendToWhatsapp() {
  const numeroAtencion = '573015030080';
  const mensaje = 'Hola Alven IPS, les envío el recordatorio de cita para recibir la cotización. ¡Gracias!';
  const url = `https://wa.me/${numeroAtencion}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}
</script>

<template>
  <div class="container my-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-lg border-0" style="background-color: #f8f9fa">
          <div class="card-body p-4 p-md-5">
            <div class="d-flex justify-content-center">
              <div style="max-width: 500px;">
                <img
                  class="img-fluid"
                  alt="Logo de Alven IPS"
                  src="https://res.cloudinary.com/dusy4drbp/image/upload/v1751953986/alven_qmy1gr.png"

                  sizes="(max-width: 800px) 90vw, 400px" />
              </div>
            </div>

            <h1 class="card-title text-center fw-bold mb-3 blue-alven">Agendamiento de Tomas de Muestras a Domicilio</h1>
            <p class="text-center text-muted mb-4">
              Bienvenido a <span class="red-alven">nuestro nuevo sistema de agendamiento.</span> Por favor, sigue los pasos para agendar la toma de tus muestras desde la comodidad de tu hogar.
            </p>

            <!-- (8) Mostramos un mensaje de error si existe -->
            <div v-if="errorMessage" class="alert alert-danger">
              {{ errorMessage }}
            </div>

            <!-- --- PASO 1: VERIFICACIÓN DE IDENTIFICACIÓN --- -->
            <!-- (9) Usamos 'v-if' para mostrar esta sección solo si estamos en el paso 1 -->
            <div v-if="step === 1">
              <form @submit.prevent="handleVerification">
                <div class="row g-2">
                  <div class="col-lg-3">
                    <label for="tipoIdentificacion" class="form-label">Tipo iden.</label>
                    <select
                      id="tipoIdentificacion"
                      class="form-select"
                      v-model="formData.tipoIdentificacion"
                      required>
                      <!-- Opción deshabilitada que actúa como placeholder -->
                      <option disabled value="">Seleccione..</option>
                      <option value="CC">CC</option>
                      <option value="TI">TI</option>
                      <option value="RC">RC</option>
                      <option value="CE">CE</option>
                      <option value="MS">MS</option>
                      <option value="CN">CN</option>
                      <option value="PA">PA</option>
                      <option value="PE">PE</option>
                      <option value="AS">AS</option>
                      <option value="PT">PT</option>
                    </select>
                  </div>
                  <div class="col-md-9 mb-3">
                    <label for="identificacion" class="form-label">Número de Identificación</label>
                    <!-- (10) 'v-model' enlaza este input con la propiedad 'numeroIdentificacion' de nuestro estado -->
                    <input type="text" class="form-control" id="identificacion" v-model="formData.numeroIdentificacion" placeholder="Ingresa tu número sin puntos ni comas" required>
                  </div>
                </div>

                <div class="d-grid">
                  <button type="submit" class="btn green-alven btn-lg d-inline-flex justify-content-center align-items-center gap-2" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span v-else>Siguiente</span>
                    <i v-if="!isLoading" class="bi bi-arrow-right-circle-fill"></i>
                  </button>
                </div>


              </form>
            </div>

            <!-- --- PASO 2: COMPLETAR DATOS DE CITA (Y CLIENTE SI ES NUEVO) --- -->
            <!-- (12) Usamos 'v-else-if' para mostrar esta sección si estamos en el paso 2 -->
            <div v-else-if="step === 2">
              <form @submit.prevent="handleSubmit">

                <!-- Sección de Datos del Cliente (solo para nuevos) -->
                <!-- (13) Usamos 'v-if' anidado. Esta sección solo se muestra si el cliente NO existe -->
                <div v-if="!clientExists">
                  <h4 class="mb-3">Paso 1: Completa tus Datos Personales</h4>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="nombres" class="form-label">Nombres</label>
                      <input type="text" class="form-control" id="nombres" v-model="formData.nombres" required>
                    </div>
                    <div class="col-md-6">
                      <label for="apellidos" class="form-label">Apellidos</label>
                      <input type="text" class="form-control" id="apellidos" v-model="formData.apellidos" required>
                    </div>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <!-- (1) Etiqueta principal para el grupo de opciones -->
                        <label class="form-label d-block">Sexo</label>

                        <div class="d-flex gap-3">
                          <!-- (2) Opción 1: Masculino -->
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="radio"
                              name="sexo"
                              id="sexoMasculino"
                              value="MASCULINO"
                              v-model="formData.sexo">
                            <label class="form-check-label" for="sexoMasculino">
                              M
                            </label>
                          </div>

                          <!-- (3) Opción 2: Femenino -->
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="radio"
                              name="sexo"
                              id="sexoFemenino"
                              value="FEMENINO"
                              v-model="formData.sexo">
                            <label class="form-check-label" for="sexoFemenino">
                              F
                            </label>
                          </div>

                          <!-- (4) Opción 3: Otro -->
                          <div class="form-check">
                            <input
                              class="form-check-input"
                              type="radio"
                              name="sexo"
                              id="sexoOtro"
                              value="OTRO"
                              v-model="formData.sexo">
                            <label class="form-check-label" for="sexoOtro">
                              Otro
                            </label>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label for="fechaNacimiento" class="form-label">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          class="form-control"
                          id="fechaNacimiento"
                          v-model="formData.fechaNacimiento"
                          :max="maxDate"
                          required>
                      </div>
                    </div>
                    <!-- Email y Celular -->
                    <div class="col-md-6">
                      <label for="email" class="form-label">Correo Electrónico</label>
                      <input type="email" class="form-control" id="email" v-model="formData.email" required>
                    </div>
                    <div class="col-md-6">
                      <label for="celular" class="form-label">Celular</label>
                      <input type="tel" class="form-control" id="celular" v-model="formData.celular" required>
                    </div>
                    <div class="col-md-12">
                      <label for="direccionCliente" class="form-label">Dirección de Residencia</label>
                      <input type="text" class="form-control" id="direccionCliente" v-model="formData.direccionCliente" required>
                    </div>
                  </div>

                  <hr class="my-4">
                </div>

                <!-- Sección de Datos de la Cita -->
                <h4 class="mb-3">Paso 2: Datos de tu Cita</h4>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="sede" class="form-label">Sede de Atención</label>
                    <select
                      id="nombreSede"
                      class="form-select"
                      v-model="formData.nombreSede"
                      required>
                      <!-- Opción deshabilitada que actúa como placeholder -->
                      <option disabled value="">Por favor, elige una sede...</option>
                      <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">
                        {{ sede.nombre }}
                      </option>
                    </select>
                  </div>
                  <!-- Selector de Fecha -->
                  <div class="col-md-6">
                    <label for="fechaCita" class="form-label">Elige un día para tu cita</label>
                    <!-- El v-model aquí es para nuestra variable de estado local 'selectedDate' -->
                    <input type="date" class="form-control" id="fechaCita" v-model="selectedDate" :min="minDate" required>
                  </div>
                  <div class="col-md-12" v-if="selectedDate && formData.nombreSede">
                    <hr class="my-3">
                    <label class="form-label">Horarios Disponibles para el {{ selectedDate }}:</label>
                    <!-- Indicador de Carga -->
                    <div v-if="isCheckingAvailability" class="text-center">
                      <div class="spinner-border spinner-border-sm text-success" role="status">
                        <span class="visually-hidden">Buscando horarios...</span>
                      </div>
                      <span class="ms-2">Buscando horarios...</span>
                    </div>

                    <!-- Lista de Horarios -->
                    <div v-else-if="availableTimes.length > 0" class="d-flex flex-wrap gap-2">
                      <!-- Usamos v-for para crear un botón por cada horario disponible -->
                      <button
                        v-for="time in availableTimes"
                        :key="time"
                        type="button"
                        class="btn"
                        :class="selectedTime === time ? 'bton-green-alven' : 'bton-vacio-alven'"
                        @click="selectedTime = time">
                        {{ time+' AM' }}
                      </button>
                    </div>

                    <!-- Mensaje si no hay horarios -->
                    <div v-else class="alert alert-warning p-2">
                      No hay horarios disponibles para este día. Por favor, elige otra fecha.
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label for="barrio" class="form-label">Barrio</label>
                    <input type="text" class="form-control" id="barrio" v-model="formData.barrio" required>
                  </div>

                  <div class="col-md-8">
                    <label for="direccionCita" class="form-label">Dirección de recogida
                      <small>(incluir apto, edificio, casa o demás indicaciones)</small>
                    </label>
                    <input type="text" class="form-control" id="direccionCita" v-model="formData.direccionCita" required>
                  </div>
                  <div class="col-12">
                    <label for="examenes" class="form-label">Exámenes a Realizar</label>
                    <textarea class="form-control" id="examenes" rows="3" v-model="formData.examenes" required></textarea>
                  </div>
                  <div class="col-12">
                    <label for="ordenMedica" class="form-label">
                      <span v-if="isOrdenMedicaRequired" class="text-danger fw-bold">*</span>
                      <span v-else>Adjunte Orden Médica</span>
                    </label>
                    <p class="red-alven" style="font-size: 18px">Tamaño máximo de subida: 10 MB</p>
                    <!-- (14) Usamos el evento '@change' para manejar la subida de archivos -->
                    <input class="form-control" type="file" id="ordenMedica" @change="handleFileUpload"
                           accept="image/png, image/jpeg, image/webp, image/jpg"
                           :required="isOrdenMedicaRequired"
                    >
                  </div>
                  <!-- Tipo de Atención -->
                  <div class="col-md-6">
                    <label for="tipoAtencion" class="form-label">Tipo de Atención</label>
                    <select id="tipoAtencion" class="form-select" v-model="formData.tipoAtencion" required>
                      <option value="PARTICULAR">Particular</option>
                      <option value="SURA_PREPAGADA">Sura Prepagada</option>
                      <option value="COOMEVA_PREPAGADA">Coomeva Prepagada</option>
                      <option value="SEGUROS_BOLIVAR_PREPAGADA">Seguros Bolívar Prepagada</option>
                      <option value="FOMAG">Fomag</option>
                      <option value="SOLO_TOMA_DE_MUESTRA">Solo toma de muestra</option>
                      <option value="INYECTOLOGIA">Inyectología</option>
                      <option value="SUERO_VITAMINADO">Suero Vitaminado</option>
                    </select>
                  </div>
                  <!-- Forma de Pago -->
                  <div class="col-md-6">
                    <label for="formaPago" class="form-label">Forma de Pago</label>
                    <select id="formaPago" class="form-select" v-model="formData.formaPago" required>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="DATAFONO">Datáfono</option>
                      <option value="NO_DEFINIDO">Acordar con administrador</option>
                    </select>
                  </div>

                  <!-- Observaciones -->
                  <div class="col-12">
                    <label for="observaciones" class="form-label">Observaciones (Opcional)</label>
                    <textarea class="form-control" id="observaciones" rows="3" v-model="formData.observaciones"></textarea>
                  </div>

                </div>

                <hr class="my-4">

                <div class="d-grid">
                  <button type="submit" class="btn blue-alven btn-lg d-inline-flex justify-content-center align-items-center gap-2" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    <span v-else><b>Agendar Cita</b></span>
                    <i class="bi bi-calendar-plus-fill"></i>
                  </button>
                </div>
              </form>
            </div>
            <div v-else-if="step === 3 && citaAgendada" class="text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" class="bi bi-check2-circle text-success" viewBox="0 0 16 16">
                  <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0"/>
                  <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z"/>
                </svg>
              </div>

              <h2 class="fw-bold text-primary">¡Cita Agendada con Éxito!</h2>
              <p class="text-muted">Por favor, guarda una captura de pantalla de este recordatorio.</p>
              <p class="text-center" style="color: #FB7701;">Recuerda enviar este recordatorio a nuestro equipo de Atención para que te den tu cotización completamente personalizada.</p>

              <div class="card mt-4 text-start" ref="confirmationCardRef">
                <div class="card-header fw-bold">
                  <span class="green-alven text-center">Recordatorio de Cita: <span class="text-primary">ALVEN IPS</span></span>
                </div>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"><strong>Paciente:</strong> {{ citaAgendada.nombreCompletoCliente }}</li>
                  <li class="list-group-item"><strong>Identificación:</strong> {{ citaAgendada.tipoIdentificacion }} {{ citaAgendada.numeroIdentificacionCliente }}</li>
                  <li class="list-group-item"><strong>Fecha y Hora:</strong> {{ citaAgendada.fechaHoraCita }}</li>
                  <li class="list-group-item"><strong>Dirección:</strong> {{ citaAgendada.direccionCita }}, {{ citaAgendada.barrio }}</li>
                  <li class="list-group-item"><strong>Sede de Atención:</strong> {{ citaAgendada.nombreSede }}</li>
                  <li class="list-group-item"><strong>Exámenes:</strong> {{ citaAgendada.examenes }}</li>
                  <li class="list-group-item"><strong>F. de pago:</strong> {{ citaAgendada.formaPago }}</li>
                  <li class="list-group-item"><strong>Tipo Atención:</strong> {{ citaAgendada.tipoAtencion }}</li>
                  <li class="list-group-item"><strong>Orden Médica: </strong>
                    <span :class="formData.ordenMedica ? 'text-success fw-bold' : 'text-muted'">
                      {{ formData.ordenMedica ? 'Sí' : 'No' }}
                    </span>
                  </li>
                </ul>
              </div>

              <div class="d-grid justify-content-center mt-4 gap-2">
                <button @click="handleDownloadImage" class="btn btn-primary">
                  <i class="bi bi-download me-2"></i>
                  Descargar Recordatorio como Imagen
                </button>
                <button @click="handleSendToWhatsapp" class="btn btn-success">
                  <i class="bi bi-whatsapp me-2"></i>
                  Enviar a WhatsApp para Cotización
                </button>
                <button @click="resetForm" class="btn btn-secondary">
                  Agendar otra Cita
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
* {
  font-family: 'Roboto', sans-serif;
}

p {
  font-size: 25px;
}
.green-alven {
  color: #238636;
}
.blue-alven {
  color: #003566;
}
.red-alven {
  color: #C03437;
}
.bton-green-alven {
  background-color: #238636 !important;
  color: #f0f2f5;
}
.bton-vacio-alven {
  background-color: transparent;
  color: #238636;
  border-color: #238636;
  border-radius: 50%;
  border: 2px;
}
</style>

