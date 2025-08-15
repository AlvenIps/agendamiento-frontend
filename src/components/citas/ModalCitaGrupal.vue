<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { ClienteEnGrupo } from '@/types';
import { verificarCliente } from '@/services/citasService';
import { useInputFilter } from '@/composables/useInputFilter';

// --- DEFINICIÓN DE PROPS Y EMITS ---
// Este componente no necesita props, pero sí emite eventos al padre.
const emit = defineEmits(['close', 'confirm']);

// --- ESTADO DEL COMPONENTE ---
const personas = reactive<Partial<ClienteEnGrupo>[]>([{}]); // Empezamos con una persona
const verificacionStatus = reactive<Record<number, 'verificado' | 'nuevo' | 'pendiente'>>({ 0: 'pendiente' });
const isLoading = ref(false);

// --- LÓGICA DE VALIDACIÓN EN TIEMPO REAL ---
const soloNumerosRegex = /\D/g;
const soloLetrasRegex = /[^a-zA-Z\sñÑáéíóúÁÉÍÓÚ]/g;
// Aplicamos los filtros a medida que se añaden personas (esto es más avanzado)

// --- MÉTODOS ---
function agregarPersona() {
  if (personas.length < 2) {
    personas.push({});
    verificacionStatus[personas.length - 1] = 'pendiente';
  }
}

function eliminarPersona(index: number) {
  personas.splice(index, 1);
  delete verificacionStatus[index];
}

async function handleVerificarCliente(index: number) {
  const persona = personas[index];
  if (!persona.numeroIdentificacion) {
    alert('Por favor, ingrese un número de identificación.');
    return;
  }
  isLoading.value = true;
  try {
    const existe = await verificarCliente(persona.numeroIdentificacion);
    if (existe) {
      verificacionStatus[index] = 'verificado';
      // En un caso real, aquí podrías llamar a otro servicio para obtener los datos del cliente
      // y rellenar los campos deshabilitados.
      alert(`Cliente ${persona.numeroIdentificacion} encontrado.`);
    } else {
      verificacionStatus[index] = 'nuevo';
    }
  } catch (error) {
    alert('Error al verificar el cliente.');
  } finally {
    isLoading.value = false;
  }
}

function handleConfirmarGrupo() {
  // Aquí iría la validación final para asegurar que todos los campos requeridos están llenos
  // ...

  // Emitimos el evento 'confirm' con la lista de personas al componente padre
  emit('confirm', personas);
}
</script>

<template>
  <div class="modal fade show" tabindex="-1" style="display: block;">
    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Agregar Personas a la Cita</h5>
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>
        <div class="modal-body">
          <p class="text-muted">
            Puede agregar hasta 2 personas adicionales. Todos deben ser atendidos en la misma dirección y horario.
          </p>

          <!-- Usamos un v-for para renderizar el formulario de cada persona -->
          <div v-for="(persona, index) in personas" :key="index" class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>Persona {{ index + 2 }}</span>
              <button v-if="index > 0" @click="eliminarPersona(index)" class="btn btn-sm btn-outline-danger">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
            <div class="card-body">
              <!-- Paso 1: Verificación -->
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label">Tipo de Identificación</label>
                  <select class="form-select" v-model="persona.tipoIdentificacion" :disabled="verificacionStatus[index] !== 'pendiente'">
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <!-- ... otras opciones -->
                  </select>
                </div>
                <div class="col-md-8">
                  <label class="form-label">Número de Identificación</label>
                  <div class="input-group">
                    <input type="text" class="form-control" v-model="persona.numeroIdentificacion" :disabled="verificacionStatus[index] !== 'pendiente'">
                    <button class="btn btn-secondary" @click="handleVerificarCliente(index)" :disabled="verificacionStatus[index] !== 'pendiente' || isLoading">
                      <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                      <span v-else>Verificar</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Paso 2: Datos Adicionales (si es nuevo o verificado) -->
              <div v-if="verificacionStatus[index] === 'nuevo'" class="alert alert-info">
                <p class="fw-bold">Cliente no encontrado. Por favor, complete los siguientes datos:</p>
                <!-- Aquí iría el formulario completo para un cliente nuevo -->
                <div class="row g-3">
                  <!-- Nombres, Apellidos, Exámenes, Tipo de Atención, etc. -->
                </div>
              </div>
              <div v-else-if="verificacionStatus[index] === 'verificado'" class="alert alert-success">
                <p class="fw-bold">✓ Cliente verificado.</p>
                <!-- Aquí solo pediríamos los datos de la cita para este cliente -->
                <div class="row g-3">
                  <!-- Exámenes, Tipo de Atención, Orden Médica -->
                </div>
              </div>
            </div>
          </div>

          <!-- Botón para añadir otra persona -->
          <div v-if="personas.length < 2" class="d-grid">
            <button @click="agregarPersona" class="btn btn-outline-primary">
              <i class="bi bi-plus-circle-fill me-2"></i>
              Agregar otra persona
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="emit('close')">Cancelar</button>
          <button type="button" class="btn btn-primary" @click="handleConfirmarGrupo">Confirmar Grupo</button>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
</template>
