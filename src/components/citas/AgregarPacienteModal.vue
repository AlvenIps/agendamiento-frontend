<template>
  <div class="modal fade" :class="{ 'show': isVisible, 'd-block': isVisible }" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title blue-alven">Agregar Persona a la Cita</h5>
          <button type="button" class="btn-close" @click="cerrar" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <!-- PASO 1: VERIFICAR CLIENTE -->
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

          <!-- PASO 2: COMPLETAR DATOS -->
          <div v-if="clienteVerificado">
            <div v-if="esNuevoCliente" class="alert alert-info p-2">
              <small>Cliente no encontrado. Por favor, completa los datos requeridos.</small>
            </div>

            <!-- --- INICIO DE LA CORRECCIÓN --- -->
            <!-- Campos que solo aparecen si el cliente es nuevo -->
            <div v-if="esNuevoCliente" class="row g-3 mb-3">
              <div class="col-md-6"><input type="text" class="form-control" v-model="paciente.nombres" placeholder="Nombres *" required></div>
              <div class="col-md-6"><input type="text" class="form-control" v-model="paciente.apellidos" placeholder="Apellidos *" required></div>
              <div class="col-md-6"><input type="email" class="form-control" v-model="paciente.email" placeholder="Email *" required></div>
              <div class="col-md-6"><input type="tel" class="form-control" v-model="paciente.celular" placeholder="Celular *" required></div>
              <div class="col-md-6">
                <input type="date" class="form-control" v-model="paciente.fechaNacimiento" required>
                <small class="form-text text-muted">Fecha de Nacimiento *</small>
              </div>
            </div>
            <!-- --- FIN DE LA CORRECCIÓN --- -->

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

              <div>
                <label class="form-label">Orden Médica (Opcional)</label>
                <input class="form-control" type="file" @change="onFileChange" accept="image/*">
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
  <div v-if="isVisible" class="modal-backdrop fade show"></div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { ClienteEnGrupo } from '@/types';
import { verificarCliente } from '@/services/citasService';

const props = defineProps<{ isVisible: boolean }>();
const emit = defineEmits(['close', 'guardar']);

const initialState: Partial<ClienteEnGrupo> = {
  tipoIdentificacion: 'CC',
  numeroIdentificacion: '',
  nombres: '',
  apellidos: '',
  email: '',
  celular: '',
  fechaNacimiento: '',
  examenes: '',
  tipoAtencion: 'PARTICULAR',
  ordenMedicaFile: null,
};
const paciente = reactive({ ...initialState });

const isLoading = ref(false);
const errorMessage = ref('');
const clienteVerificado = ref(false);
const esNuevoCliente = ref(false);

const puedeGuardar = computed(() => {
  if (!clienteVerificado.value || !paciente.examenes || !paciente.tipoAtencion) {
    return false;
  }
  if (esNuevoCliente.value) {
    if (!paciente.nombres || !paciente.apellidos || !paciente.email || !paciente.celular || !paciente.fechaNacimiento) {
      return false;
    }
  }
  return true;
});

async function verificar() {
  if (!paciente.numeroIdentificacion) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const existe = await verificarCliente(paciente.numeroIdentificacion);
    esNuevoCliente.value = !existe;
    clienteVerificado.value = true;
  } catch (error) {
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    paciente.ordenMedicaFile = target.files[0];
  }
}

function guardar() {
  emit('guardar', { ...paciente, _clienteNuevo: esNuevoCliente.value });
  cerrar();
}

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

watch(() => props.isVisible, (visible) => {
  if (visible) {
    resetState();
  }
});
</script>

<style scoped>
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
