<template>
  <!--
    Este es el modal de Bootstrap. Usamos :class para mostrarlo dinámicamente
    cuando la prop 'isVisible' sea verdadera.
  -->
  <div class="modal fade" :class="{ 'show': isVisible, 'd-block': isVisible }" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title blue-alven">Agregar Persona a la Cita</h5>
          <button type="button" class="btn-close" @click="cerrar" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <!-- PASO 1: Formulario de Verificación -->
          <div v-if="!clienteVerificado">
            <div class="mb-3">
              <label for="identificacionModal" class="form-label">Número de Identificación</label>
              <input type="text" class="form-control" id="identificacionModal" v-model="paciente.numeroIdentificacion" placeholder="Buscar paciente...">
            </div>
            <button class="btn green-alven w-100" @click="verificar" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span v-else>Verificar</span>
            </button>
          </div>

          <!-- PASO 2: Formulario para completar datos -->
          <div v-if="clienteVerificado">
            <div v-if="esNuevoCliente" class="alert alert-info p-2">
              <small>Cliente no encontrado. Por favor, completa los datos requeridos.</small>
            </div>

            <!-- Campos que solo aparecen si el cliente es nuevo -->
            <template v-if="esNuevoCliente">
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Nombres</label>
                  <input class="form-control" v-model="paciente.nombres" placeholder="Nombres del paciente" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Apellidos</label>
                  <input class="form-control" v-model="paciente.apellidos" placeholder="Apellidos del paciente" required>
                </div>
                <!-- Puedes agregar más campos para nuevos clientes aquí si lo necesitas -->
              </div>
            </template>

            <!-- Campos que siempre se deben llenar para la cita -->
            <div class="mt-3">
              <div class="mb-3">
                <label class="form-label">Exámenes a Realizar</label>
                <textarea class="form-control" v-model="paciente.examenes" rows="2" required></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Tipo de Atención</label>
                <select class="form-select" v-model="paciente.tipoAtencion" required>
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


            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cerrar">Cancelar</button>
          <button type="button" class="btn blue-alven" @click="guardar" :disabled="!puedeGuardar">
            Agregar a la Cita
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Backdrop de Bootstrap para oscurecer el fondo cuando el modal está activo -->
  <div v-if="isVisible" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { ClienteEnGrupo } from '@/types';
import { verificarCliente } from '@/services/citasService';
import { useInputFilter } from '@/composables/useInputFilter.ts';



// --- PROPS Y EMITS ---
// 'isVisible' controla si el modal se muestra o no desde el componente padre.
const props = defineProps<{ isVisible: boolean }>();
// 'close' le dice al padre que cierre el modal.
// 'guardar' envía el objeto del nuevo paciente al padre.
const emit = defineEmits(['close', 'guardar']);

// --- ESTADO INTERNO DEL MODAL ---
const initialState: Partial<ClienteEnGrupo> = {
  tipoIdentificacion: 'CC',
  numeroIdentificacion: '',
  nombres: '',
  apellidos: '',
  examenes: '',
  tipoAtencion: 'PARTICULAR',
  ordenMedicaFile: null,
};
const paciente = reactive({ ...initialState });
const soloNumerosRegex = /[^0-9]/g; // Solo permite números
const soloLetrasRegex = /[^a-zA-Z\sñÑáéíóúÁÉÍÓÚ]/g; // solo permite letras
useInputFilter(paciente, 'numeroIdentificacion', soloNumerosRegex);
useInputFilter(paciente, 'nombres', soloLetrasRegex);
useInputFilter(paciente, 'apellidos', soloLetrasRegex);

const isLoading = ref(false);
const errorMessage = ref('');
const clienteVerificado = ref(false); // Nos dice si ya se hizo la búsqueda
const esNuevoCliente = ref(false);   // Nos dice el resultado de la búsqueda

// Una computed property para habilitar/deshabilitar el botón de guardar.
const puedeGuardar = computed(() => {
  // Solo se puede guardar si ya se verificó el cliente y llenó los campos de la cita.
  return clienteVerificado.value && paciente.examenes && paciente.tipoAtencion;
});

// --- MÉTODOS ---
async function verificar() {
  if (!paciente.numeroIdentificacion) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const existe = await verificarCliente(paciente.numeroIdentificacion);
    esNuevoCliente.value = !existe;
    clienteVerificado.value = true; // Marcamos que la verificación ya se completó
  } catch (error) {
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}


function guardar() {
  // Validación extra: si es un cliente nuevo, debe tener nombre y apellido.
  if (esNuevoCliente.value && (!paciente.nombres || !paciente.apellidos)) {
    errorMessage.value = 'Nombres y apellidos son requeridos para nuevos pacientes.';
    return;
  }
  // Emitimos el evento 'guardar' con una copia del objeto 'paciente'.
  emit('guardar', { ...paciente });
  cerrar(); // Cerramos el modal después de guardar
}

// Resetea el estado del modal a sus valores iniciales.
function resetState() {
  Object.assign(paciente, initialState);
  isLoading.value = false;
  errorMessage.value = '';
  clienteVerificado.value = false;
  esNuevoCliente.value = false;
}

function cerrar() {
  emit('close');
}

// Observador: cada vez que el modal se hace visible, reseteamos su estado.
watch(() => props.isVisible, (visible) => {
  if (visible) {
    resetState();
  }
});
</script>

<style scoped>
/* Las clases de Bootstrap se encargan de la mayoría de los estilos. */
.d-block {
  display: block;
}
.blue-alven {
  color: #003566;
}
.green-alven {
  background-color: #238636;
  color: white;
}
.green-alven:hover {
  background-color: #2a9d41;
}
</style>
