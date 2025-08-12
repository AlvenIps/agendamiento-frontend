<template>
  <div class="row justify-content-center">
    <div class="col-lg-12">
      <div class="card shadow-lg border-0" style="background-color: #f8f9fa">
        <div class="card-body p-2">
          <div class="d-flex justify-content-center">
            <h2 class="card-tittle text-center fw-bold mb-3 blue-alven">Clientes</h2>
          </div>
          <h2 class="mb-3 green-alven">Registro de Clientes</h2>
          <!-- Panel de Control -->
          <div class="card mb-4 overflow-auto">
            <div class="card-body filter-panel-body flex-wrap align-items-center gap-3">
              <div class="btn-group" role="group">
                <button
                  type="button"
                  class="btn"
                  :class="activeFilter === 'today' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="fetchClientes('today')">
                  Clientes Hoy
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="activeFilter === 'tomorrow' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="fetchClientes('tomorrow')">
                  Clientes Mañana
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
                <div class="col-12 col-md-auto">
                  <div v-if="authStore.isAuditor" class="align-items-center gap-2">
                    <label for="sede-filter" class="form-label mb-0">Filtrar por sede:</label>
                    <select id="sede-filter" class="form-select" style="width: auto;" v-model="selectedSedeFilter">
                      <option value="">Todas..</option>
                      <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">
                        {{ sede.nombre }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-12 col-md-auto">
                  <div class="d-flex g-2 ms-auto">
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Buscar por identificación..."
                      v-model="searchId"
                      @keyup.enter="handleSearchById"
                    />
                    <button class="btn btn-secondary" @click="handleSearchById">
                      <i class="bi bi-search"></i>
                    </button>
                  </div>
                </div>
              </div>


            </div>
          </div>
          <!-- SPINNER, TABLA, ETC -->
          <div v-if="isLoading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando clientes...</p>
          </div>

          <div v-else-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
          </div>

          <div v-else-if="clientesFiltrados.length > 0" class="table-responsive">
            <table class="table table-striped table-hover align-middle">
              <thead class="table-dark">
              <tr>
                <th>Sede</th>
                <th>Nombre Completo</th>
                <th>Identificación</th>
                <th>Email</th>
                <th>Celular</th>
                <th>Dirección</th>
                <th class="text-center">Acciones</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="cliente in clientesFiltrados" :key="cliente.numeroIdentificacion">
                <td><span class="green-alven">{{ cliente.sedeCita }}</span></td>
                <td>{{ cliente.nombres }} {{ cliente.apellidos }}</td>
                <td>{{ cliente.tipoIdentificacion }} {{ cliente.numeroIdentificacion }}</td>
                <td>{{ cliente.email }}</td>
                <td>{{ cliente.celular }}</td>
                <td>{{ cliente.direccion }}</td>
                <td class="text-center">
                  <button @click="openEditModal(cliente)" class="btn btn-sm btn-outline-warning" title="Ver Perfil del Cliente">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button @click="handleWhatsappClick(cliente)" class="btn btn-sm btn-outline-success">
                    <i class="bi bi-whatsapp"></i>
                  </button>
                  <button @click="handleEmailClick(cliente)" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-envelope-at-fill"></i>
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="alert alert-secondary text-center">
            No hay clientes con citas programadas para la fecha seleccionada.
          </div>
        </div>
      </div>
    </div>
    <!-- MODAL DE EDICION DE CLIENTE -->
    <div v-if="isEditModalVisible" class="modal fade show" tabindex="-1" style="display: block;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modal-title">Editar Cliente: {{ clienteParaEditar?.nombres }} {{ clienteParaEditar?.apellidos }}</h5>
            <button type="button" class="btn-close" @click="closeEditModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleConfirmUpdate">
              <div class="mb-3">
                <label for="editNombres" class="form-label">Nombres</label>
                <input type="text" id="editNombres" class="form-control" v-model="editFormData.nombres">
              </div>
              <div class="mb-3">
                <label for="editApellidos" class="form-label">Apellidos</label>
                <input type="text" id="editApellidos" class="form-control" v-model="editFormData.apellidos">
              </div>
              <div class="mb-3">
                <label for="editEmail" class="form-label">Email</label>
                <input type="email" id="editEmail" class="form-control" v-model="editFormData.email">
              </div>
              <div class="mb-3">
                <label for="editCelular" class="form-label">Celular</label>
                <input type="tel" id="editCelular" class="form-control" v-model="editFormData.celular">
              </div>
              <div class="mb-3">
                <label for="editDireccion" class="form-label">Dirección</label>
                <input type="text" id="editDireccion" class="form-control" v-model="editFormData.direccion">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="handleConfirmUpdate">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isEditModalVisible" class="modal-backdrop fade show"></div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { mostrarClientesPorFecha, buscarCliente, updateCliente } from '@/services/clienteService.ts';
import type { ClienteAgenda, Cliente, ClienteUpdate } from '@/types';
import { useAuthStore } from '@/stores/auth.ts';
import { LISTA_SEDES } from '@/config/sedes.ts';
import { useInputFilter } from '@/composables/useInputFilter.ts';

const authStore = useAuthStore();

const clientes = ref<ClienteAgenda[]>([]); // guarda la lista de clientes de la API
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const activeFilter = ref('today');
const selectedDate = ref('');
const selectedSedeFilter = ref('');
const searchId = ref(''); // buscador por id de cliente

// para el MODAL DE EDICION
const isEditModalVisible = ref(false);
const clienteParaEditar = ref<ClienteAgenda | null>(null);
const editFormData = reactive<ClienteUpdate>({});

// Definimos los patrones de limpieza que necesitamos.
const soloNumerosRegex = /[^0-9]/g; // Solo permite números
const soloLetrasRegex = /[^a-zA-Z\sñÑáéíóúÁÉÍÓÚ]/g;
useInputFilter(editFormData, 'nombres', soloLetrasRegex);
useInputFilter(editFormData, 'apellidos', soloLetrasRegex);
useInputFilter(editFormData, 'celular', soloNumerosRegex);




const clientesFiltrados = computed(() => {
  if (!selectedSedeFilter.value) {
    return clientes.value;
  }
  return clientes.value.filter(
    cliente => cliente.sedeCita === selectedSedeFilter.value
  );
});

async function fetchClientes(filtro: string) {

  isLoading.value = true;
  errorMessage.value = null;
  activeFilter.value = filtro;

  // funcion ayudante para obtener la fecha en el formato correcto
  const getFormattedDate = (filter: string): string => {
    const date = new Date();
    if (filter === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  let fechaConsultar: string;
  if (filtro === 'today') {
    fechaConsultar = getFormattedDate('today');
  } else if(filtro === 'tomorrow') {
    fechaConsultar = getFormattedDate('tomorrow');
  } else {
    fechaConsultar = selectedDate.value;
  }

  if (!fechaConsultar) {
    isLoading.value = false;
    clientes.value = [];
    return;
  }

  try {
    const data = await mostrarClientesPorFecha(fechaConsultar);
    clientes.value = data;
  } catch (error) {
    errorMessage.value = (error as Error).message;
    clientes.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function handleSearchById() {
  if (!searchId.value.trim()) {
    alert("Por favor, ingrese un número de identificación para buscar.");
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;
  try{
    const clienteExist: Cliente = await buscarCliente(searchId.value);
    const clienteForTabla: ClienteAgenda = {
      ...clienteExist,
      sedeCita: 'N/A'
    };
    clientes.value = [clienteForTabla]; // se reemplaza la lista de la tabla con este cliente solito
  } catch (error) {
    errorMessage.value = (error as Error).message;
    clientes.value = [];
  } finally {
    isLoading.value = false;
  }
}

watch(selectedDate, (newDate) => {
  if (newDate) {
    fetchClientes(newDate);
  }
});

// cuando el usuario coambia la fecha en el calendario
function handleDateChange() {
  if (selectedDate.value) {
    fetchClientes(selectedDate.value);
  }
}

// metodos para el MODAL DE EDICION DE CLIENTE
function openEditModal(cliente: ClienteAgenda) {
  clienteParaEditar.value = { ...cliente }; // una copia para no modificar la tabla directamente

  //lenamos el formulario con los datos actuales del cliente
  editFormData.nombres = cliente.nombres;
  editFormData.apellidos = cliente.apellidos;
  editFormData.email = cliente.email;
  editFormData.celular = cliente.celular;
  editFormData.direccion = cliente.direccion;
  isEditModalVisible.value = true;
}
function closeEditModal() {
  isEditModalVisible.value = false;
  clienteParaEditar.value = null;
  Object.keys(editFormData).forEach((key) => delete editFormData[key as keyof ClienteUpdate]);
}
async function handleConfirmUpdate() {
  if (!clienteParaEditar.value) return;
  isLoading.value = true;
  try {
    await updateCliente(clienteParaEditar.value.numeroIdentificacion, editFormData);
    alert("Cliente actualizado con éxito.");
    closeEditModal();
    fetchClientes(selectedDate.value);
  } catch (error) {
    alert((error as Error).message);
  } finally {
    isLoading.value = false;
  }
}

// METODOS PARA CONTACTO RAPIDO AL CLIENTE
function handleWhatsappClick(cliente: ClienteAgenda) {
  const numeroLimpio = cliente.celular.replace(/\D/g, '');
  const mensaje = `Hola ${cliente.nombres}, te contactamos de Laboratorios Alven IPS con respecto a tu agendamiento.`;
  const url = `https://wa.me/57${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}
function handleEmailClick(cliente: ClienteAgenda) {
  const asunto = `Información sobre tu toma de muestras en Alven IPS`;
  const cuerpo = `Estimado/a ${cliente.nombres} ${cliente.apellidos}, \n\nLe contactamos para...\n\nSaludos cordiales, \nEquipo de Alven IPS`;
  const url = `mailto:${cliente.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  window.location.href = url;
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

// se ejecuta cuando el componente se carga por primera vez
onMounted(() => {
  selectedDate.value = new Date().toISOString().split('T')[0]; // fecha de hoy por defecto
  fetchClientes('today');
})
</script>

<style scoped>
.green-alven {
  color: #238636;
}
.blue-alven {
  color: #003566;
}
.filter-panel-body {
  min-width: 400px;
}
</style>
