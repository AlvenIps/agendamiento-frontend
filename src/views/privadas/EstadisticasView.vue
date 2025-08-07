<script setup lang="ts">
import { ref, onMounted, watch, computed, type Ref } from 'vue'
import { LISTA_SEDES } from '@/config/sedes';
// Importamos todos los servicios y tipos necesarios
import * as statsService from '@/services/estadisticasService';
import type {
  ConteoEstado, ConteoPorDia,
  HoraPico, TopCliente,
  RendimientoSede, ConteoTipoAtencion,
  ConteoClientes, ConteoPorSexo } from '@/types/indexStats';
import DoughnutChart from '@/components/charts/DoughnutChart.vue';
import BarChart from '@/components/charts/BarChart.vue';
import type { TooltipItem } from 'chart.js';

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

// ===================================================================
// --- SECCIÓN 1: ESTADO Y LÓGICA PARA MÉTRICAS HISTÓRICAS ---
// ===================================================================
const historicoSedeFilter = ref('');
const conteoPorSexo = ref<ConteoPorSexo[]>([]);
const rendimientoSedesHistorico = ref<RendimientoSede[]>([]);
const conteoEstadoHistorico = ref<ConteoEstado[]>([]);
const tipoAtencionHistorico = ref<ConteoTipoAtencion[]>([]);

async function fetchHistoricos() {
  try {
    // Estas llamadas no dependen de filtros de fecha
    const [sexoData, rendimientoData, tipoAtencionData] = await Promise.all([
      statsService.getConteoHistoricoPorSexo(),
      statsService.getRendimientoPorSedeHistorico(),
      statsService.getConteoHistoricoPorTipoAtencion(),
    ]);
    conteoPorSexo.value = sexoData;
    rendimientoSedesHistorico.value = rendimientoData;
    tipoAtencionHistorico.value = tipoAtencionData;
  } catch (error) {
    console.error("Error cargando estadísticas históricas:", error);
    errorMessage.value = "No se pudieron cargar los datos históricos.";
  }
}

// Watcher para el conteo de estado histórico que SÍ depende de la sede
watch(historicoSedeFilter, async (newSede) => {
  try {
    const estadoData = await statsService.getConteoHistoricoPorEstados(newSede || undefined);
    conteoEstadoHistorico.value = estadoData;
  } catch (error) {
    console.error("Error cargando conteo de estado histórico:", error);
  }
}, { immediate: true }); // 'immediate' lo ejecuta al cargar


// ===================================================================
// --- SECCIÓN 2: ESTADO Y LÓGICA PARA MÉTRICAS POR FECHA (GLOBAL) ---
// ===================================================================
const fechaInicioGlobal = ref('');
const fechaFinGlobal = ref('');
const topClientes = ref<TopCliente[]>([]);
const adquisicionClientes = ref<ConteoClientes | null>(null);
const rendimientoSedesGlobal = ref<RendimientoSede[]>([]);
const tipoAtencionGlobal = ref<ConteoTipoAtencion[]>([]);

async function fetchGlobalPorFechas() {
  if (!fechaInicioGlobal.value || !fechaFinGlobal.value) return;
  try {
    const params = { fechaInicio: fechaInicioGlobal.value, fechaFin: fechaFinGlobal.value };
    const [topData, adquisicionData, rendimientoData, tipoAtencionData] = await Promise.all([
      statsService.getTopClientes(params),
      statsService.getAdquisicionClientes(params),
      statsService.getRendimientoPorSede(params),
      statsService.getConteoTipoAtencion(params),
    ]);
    topClientes.value = topData;
    adquisicionClientes.value = adquisicionData;
    rendimientoSedesGlobal.value = rendimientoData;
    tipoAtencionGlobal.value = tipoAtencionData;
  } catch (error) {
    console.error("Error cargando estadísticas globales por fecha:", error);
  }
}

watch([fechaInicioGlobal, fechaFinGlobal], fetchGlobalPorFechas);


// ===================================================================
// --- SECCIÓN 3: ESTADO Y LÓGICA POR FECHA Y SEDE ---
// ===================================================================
const fechaInicioSede = ref('');
const fechaFinSede = ref('');
const sedeSeleccionada = ref('');
const conteoPorEstado = ref<ConteoEstado[]>([]);
const conteoPorDia = ref<ConteoPorDia[]>([]);
const horarioPico = ref<HoraPico[]>([]);

async function fetchPorFechaYSede() {
  if (!fechaInicioSede.value || !fechaFinSede.value) return;
  try {
    const params = {
      fechaInicio: fechaInicioSede.value,
      fechaFin: fechaFinSede.value,
      nombreSede: sedeSeleccionada.value
    };
    const [estadoData, diaData, picoData] = await Promise.all([
      statsService.getConteoPorEstado(params),
      statsService.getConteoPorDia(params),
      statsService.getHorarioPico(params)
    ]);
    conteoPorEstado.value = estadoData;
    conteoPorDia.value = diaData;
    horarioPico.value = picoData;
  } catch (error) {
    console.error("Error cargando estadísticas por sede:", error);
  }
}

watch([fechaInicioSede, fechaFinSede, sedeSeleccionada], fetchPorFechaYSede);


// --- Carga Inicial de Datos ---
onMounted(async () => {
  isLoading.value = true;

  // Seteamos fechas por defecto para los filtros de período
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - 30);
  const finStr = fin.toISOString().split('T')[0];
  const inicioStr = inicio.toISOString().split('T')[0];

  fechaInicioGlobal.value = inicioStr;
  fechaFinGlobal.value = finStr;
  fechaInicioSede.value = inicioStr;
  fechaFinSede.value = finStr;

  // Hacemos la carga inicial de todas las secciones en paralelo
  await Promise.all([
    fetchHistoricos(),
    fetchGlobalPorFechas(),
    fetchPorFechaYSede()
  ]);

  isLoading.value = false;
});

// --- PROPIEDADES COMPUTADAS PARA LOS GRÁFICOS (TU LÓGICA ORIGINAL) ---
// (Asegurándonos de que usen las variables de estado correctas)

const estadoChartData = computed(() => {
  if (!conteoPorEstado.value) return { labels: [], datasets: [] };
  const labels = conteoPorEstado.value.map(item => item.estado);
  const data = conteoPorEstado.value.map(item => item.cantidad);
  const backgroundColors = labels.map(label => {
    switch (label) {
      case 'AGENDADA': return '#198754';
      case 'COMPLETADA': return '#0d6efd';
      case 'CANCELADA': return '#dc3545';
      case 'NO_ASISTIO': return '#6c757d';
      default: return '#0dcaf0';
    }
  });
  return {
    labels: labels,
    datasets: [{ backgroundColor: backgroundColors, data: data, hoverOffset: 4 }],
  };
});

const diaChartData = computed(() => {
  if (!conteoPorDia.value) return { labels: [], datasets: [] };
  const diasOrdenados = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
  const datosOrdenados = [...conteoPorDia.value].sort((a, b) => diasOrdenados.indexOf(a.dia) - diasOrdenados.indexOf(b.dia));
  const labels = datosOrdenados.map(item => item.dia);
  const data = datosOrdenados.map(item => item.total);
  return {
    labels: labels,
    datasets: [{ label: 'Número de Citas', backgroundColor: '#238636', data: data }],
  };
});


const sexoChartData = computed(() => {
  if (!conteoPorSexo.value) return { labels: [], datasets: [] };
  const labels = conteoPorSexo.value.map(item => item.sexo);
  const data = conteoPorSexo.value.map(item => item.total);
  const backgroundColors = ['#36A2EB', '#FF6384', '#9966FF'];
  return {
    labels: labels,
    datasets: [{ backgroundColor: backgroundColors, data: data, hoverOffset: 4 }],
  };
});

// ¡CORREGIDO! Propiedad computada para el rendimiento histórico por sede
const rendimientoSedeHistoricoChartData = computed(() => {
  if (!rendimientoSedesHistorico.value) return { labels: [], datasets: [] };
  const labels = rendimientoSedesHistorico.value.map(item => item.nombreSede);
  const totalCitasData = rendimientoSedesHistorico.value.map(item => item.totalCitas);
  const completadasData = rendimientoSedesHistorico.value.map(item => item.citasCompletadas);
  return {
    labels,
    datasets: [
      { label: 'Citas Totales', data: totalCitasData, backgroundColor: '#6c757d' },
      { label: 'Citas Completadas', data: completadasData, backgroundColor: '#198754' }
    ]
  };
});

// ¡CORREGIDO! Propiedad computada para el tipo de atención histórico
const tipoAtencionHistoricoChartData = computed(() => {
  if (!tipoAtencionHistorico.value) return { labels: [], datasets: [] };
  const topTipos = tipoAtencionHistorico.value.slice(0, 7);
  const labels = topTipos.map(item => (item.tipo || 'No Definido').replace('_PREPAGADA', '').replace('_', ' '));
  const data = topTipos.map(item => item.cantidad);
  return {
    labels,
    datasets: [{
      label: 'Cantidad de Citas',
      data,
      backgroundColor: ['#0033A0', '#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'],
    }],
  };
});
// Propiedad computada para el gráfico de estado histórico
const estadoHistoricoChartData = computed(() => {
  if (!conteoEstadoHistorico.value) return { labels: [], datasets: [] };
  const labels = conteoEstadoHistorico.value.map(item => item.estado);
  const data = conteoEstadoHistorico.value.map(item => item.cantidad);
  const backgroundColors = labels.map(label => {
    switch (label) {
      case 'AGENDADA': return '#198754';
      case 'COMPLETADA': return '#0d6efd';
      case 'CANCELADA': return '#dc3545';
      case 'NO_ASISTIO': return '#6c757d';
      default: return '#0dcaf0';
    }
  });
  return { labels, datasets: [{ data, backgroundColor: backgroundColors, hoverOffset: 4 }] };
});
// --- NUEVAS PROPIEDADES COMPUTADAS ---
const rendimientoSedeGlobalChartData = computed(() => {
  if (!rendimientoSedesGlobal.value) return { labels: [], datasets: [] };
  const labels = rendimientoSedesGlobal.value.map(item => item.nombreSede);
  const totalCitasData = rendimientoSedesGlobal.value.map(item => item.totalCitas);
  const completadasData = rendimientoSedesGlobal.value.map(item => item.citasCompletadas);
  return {
    labels,
    datasets: [
      { label: 'Citas Totales', data: totalCitasData, backgroundColor: '#6c757d' },
      { label: 'Citas Completadas', data: completadasData, backgroundColor: '#198754' }
    ]
  };
});

const tipoAtencionGlobalChartData = computed(() => {
  if (!tipoAtencionGlobal.value) return { labels: [], datasets: [] };
  const topTipos = tipoAtencionGlobal.value.slice(0, 7);
  const labels = topTipos.map(item => (item.tipo || 'No Definido').replace('_PREPAGADA', '').replace('_', ' '));
  const data = topTipos.map(item => item.cantidad);
  return {
    labels,
    datasets: [{
      label: 'Cantidad de Citas',
      data,
      backgroundColor: ['#0033A0', '#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF', '#FF9F40'],
    }],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: function(context: TooltipItem<'doughnut' | 'bar'>) {
          const label = context.label || '';
          const value = context.raw as number || 0;
          const total = context.chart.data.datasets[0].data.reduce(
            (accumulator: number, currentValue) => {
              const valueToAdd = typeof currentValue === 'number' ? currentValue : 0;
              return accumulator + valueToAdd;
            }, 0);
          const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
}));
// propiedad computada para datos FINANCIEROS
const createFinancialChartOptions = (dataSource: Ref<any[]>, valueKey: string) => {
  return computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            const label = context.dataset.label || context.label || '';
            const value = context.raw as number || 0;
            // Para el dataset de 'Citas Completadas', mostramos el valor. Para otros, el conteo.
            if (context.dataset.label === 'Citas Completadas') {
              return `${label}: ${value} citas`;
            }
            return `${label}: ${value}`;
          },
          afterLabel: function(context: TooltipItem<'bar'>) {
            const dataIndex = context.dataIndex;
            // (3) Usamos la clave 'valueKey' para acceder a la propiedad dinámicamente.
            const financialValue = dataSource.value[dataIndex]?.[valueKey] || 0;

            // Solo mostramos la línea de facturado si el valor es mayor que cero.
            if (financialValue > 0) {
              // Para el gráfico de rendimiento, solo lo mostramos en la barra de "completadas"
              if (dataSource.value === rendimientoSedesGlobal.value || dataSource.value === rendimientoSedesHistorico.value) {
                if (context.dataset.label === 'Citas Completadas') {
                  return `Facturado: ${formatCurrency(financialValue)}`;
                }
              } else {
                // Para otros gráficos como el de tipo de atención, lo mostramos siempre.
                return `Total: ${formatCurrency(financialValue)}`;
              }
            }
            return '';
          }
        }
      }
    },
  }));
};
const historicoOptions = createFinancialChartOptions(rendimientoSedesHistorico, 'totalFacturado');
const globalOptions = createFinancialChartOptions(rendimientoSedesGlobal, 'totalFacturado');
const tipoAtencionHistoricoOptions = createFinancialChartOptions(tipoAtencionHistorico, 'total');
const tipoAtencionGlobalOptions = createFinancialChartOptions(tipoAtencionGlobal, 'total');

// --- NUEVA FUNCIÓN AYUDANTE para formatear moneda ---
function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}
</script>

<template>
  <div>
    <h2 class="mb-4">Panel de Estadísticas y Reportes</h2>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Calculando métricas...</p>
    </div>
    <div v-else-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-else>
      <!-- =================================================================== -->
      <!-- --- SECCIÓN 1: ANÁLISIS HISTÓRICO GLOBAL --- -->
      <!-- =================================================================== -->
      <h4 class="mb-3">Análisis Histórico Global</h4>
      <div class="card mb-5">
        <div class="card-body">
          <div class="row g-3 align-items-end mb-4">
            <div class="col-12 col-md-4">
              <label for="historicoSedeFilter" class="form-label fw-bold">Filtrar por Sede (para Conteo por Estado)</label>
              <select id="historicoSedeFilter" class="form-select" v-model="historicoSedeFilter">
                <option value="">Todas las sedes</option>
                <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
              </select>
            </div>
          </div>
          <hr>
          <div class="row g-4">
            <div class="col-12 col-md-6">
              <h5 class="card-title">Distribución por Estado</h5>
              <p class="card-subtitle mb-2 text-muted small">Sede: {{ historicoSedeFilter || 'Todas' }}</p>
              <div v-if="conteoEstadoHistorico.length > 0" class="chart-container">
                <DoughnutChart :chart-data="estadoHistoricoChartData" :chart-options="chartOptions" />
              </div>
              <div v-else class="text-muted d-flex align-items-center justify-content-center h-100">No hay datos.</div>
            </div>
            <div class="col-12 col-md-6">
              <h5 class="card-title">Distribución por Sexo</h5>
              <div v-if="conteoPorSexo.length > 0" class="chart-container">
                <DoughnutChart :chart-data="sexoChartData" :chart-options="chartOptions" />
              </div>
              <div v-else class="text-muted d-flex align-items-center justify-content-center h-100">No hay datos.</div>
            </div>
            <div class="col-12 col-md-6">
              <h5 class="card-title">Rendimiento Histórico por Sede</h5>
              <div v-if="rendimientoSedesHistorico.length > 0" class="chart-container">
                <BarChart :chart-data="rendimientoSedeHistoricoChartData" :chart-options="historicoOptions" />
              </div>
              <div v-else class="text-muted d-flex align-items-center justify-content-center h-100">No hay datos.</div>
            </div>
            <div class="col-12 col-md-6">
              <h5 class="card-title">Rendimiento Histórico por Tipo de Atención</h5>
              <div v-if="tipoAtencionHistorico.length > 0" class="chart-container" style="min-height: 350px;">
                <BarChart :chart-data="tipoAtencionHistoricoChartData" :chart-options="tipoAtencionHistoricoOptions" />
              </div>
              <div v-else class="text-muted">No hay datos.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- --- SECCIÓN 2: ANÁLISIS GLOBAL POR PERÍODO --- -->
      <!-- =================================================================== -->
      <h4 class="mb-3">Análisis Global por Período</h4>
      <div class="card mb-5">
        <div class="card-body">
          <div class="row g-3 align-items-end mb-4">
            <div class="col-12 col-md-4">
              <label for="fechaInicioGlobal" class="form-label fw-bold">Fecha de Inicio</label>
              <input type="date" id="fechaInicioGlobal" class="form-control" v-model="fechaInicioGlobal">
            </div>
            <div class="col-12 col-md-4">
              <label for="fechaFinGlobal" class="form-label fw-bold">Fecha de Fin</label>
              <input type="date" id="fechaFinGlobal" class="form-control" v-model="fechaFinGlobal">
            </div>
          </div>
          <div class="row g-4">
            <div class="col-12 col-md-6">
              <h5 class="card-title">Adquisición de Clientes</h5>
              <div v-if="adquisicionClientes" class="row text-center mt-4">
                <div class="col-4">
                  <div class="display-6 fw-bold text-success">{{ adquisicionClientes.clientesNuevos }}</div>
                  <small class="text-muted">Nuevos</small>
                </div>
                <div class="col-4">
                  <div class="display-6 fw-bold text-primary">{{ adquisicionClientes.clientesRecurrentes }}</div>
                  <small class="text-muted">Recurrentes</small>
                </div>
                <div class="col-4">
                  <div class="display-6 fw-bold">{{ adquisicionClientes.totalClientesUnicos }}</div>
                  <small class="text-muted">Total Únicos</small>
                </div>
              </div>
              <div v-else class="text-muted">No hay datos.</div>
            </div>
            <div class="col-12 col-md-6">
              <h5 class="card-title">Top 3 Clientes</h5>
              <div v-if="topClientes.length > 0" class="table-responsive">
                <table class="table table-sm table-borderless mb-0">
                  <tbody>
                  <tr v-for="(cliente, index) in topClientes" :key="cliente.cliente.numeroIdentificacion">
                    <td class="ps-0"><span class="badge bg-secondary rounded-pill">{{ index + 1 }}</span></td>
                    <td>
                      <div class="fw-bold">{{ cliente.cliente.nombres }} {{ cliente.cliente.apellidos }}</div>
                      <small class="text-muted">{{ cliente.cliente.numeroIdentificacion }}</small>
                    </td>
                    <td class="text-end pe-0">
                      <span class="fs-5 fw-bold">{{ cliente.totalCitas }}</span>
                      <small class="text-muted d-block">citas</small>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted">No hay datos.</div>
            </div>
            <div class="col-12 col-lg-6">
              <h5 class="card-title">Rendimiento por Sede (Período)</h5>
              <div v-if="rendimientoSedesGlobal.length > 0" class="chart-container">
                <BarChart :chart-data="rendimientoSedeGlobalChartData" :chart-options="globalOptions" />
              </div>
              <div v-else class="text-muted d-flex align-items-center justify-content-center h-100">No hay datos.</div>
            </div>
            <div class="col-12 col-lg-6">
              <h5 class="card-title">Citas por Tipo de Atención (Período)</h5>
              <div v-if="tipoAtencionGlobal.length > 0" class="chart-container">
                <BarChart :chart-data="tipoAtencionGlobalChartData" :chart-options="tipoAtencionGlobalOptions" />
              </div>
              <div v-else class="text-muted d-flex align-items-center justify-content-center h-100">No hay datos.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- --- SECCIÓN 3: ANÁLISIS DETALLADO POR SEDE Y PERÍODO --- -->
      <!-- =================================================================== -->
      <h4 class="mb-3">Análisis Detallado por Sede y Período</h4>
      <div class="card mb-5">
        <div class="card-body">
          <div class="row g-3 align-items-end mb-4">
            <div class="col-12 col-md-4">
              <label for="fechaInicioSede" class="form-label fw-bold">Fecha de Inicio</label>
              <input type="date" id="fechaInicioSede" class="form-control" v-model="fechaInicioSede">
            </div>
            <div class="col-12 col-md-4">
              <label for="fechaFinSede" class="form-label fw-bold">Fecha de Fin</label>
              <input type="date" id="fechaFinSede" class="form-control" v-model="fechaFinSede">
            </div>
            <div class="col-12 col-md-4">
              <label for="sede-filter" class="form-label fw-bold">Sede</label>
              <select id="sede-filter" class="form-select" v-model="sedeSeleccionada">
                <option value="">Todas las sedes</option>
                <option v-for="sede in LISTA_SEDES" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-12 col-lg-6">
              <h5 class="card-title">Distribución por Estado</h5>
              <div v-if="conteoPorEstado.length > 0" class="chart-container">
                <DoughnutChart :chart-data="estadoChartData" :chart-options="chartOptions" />
              </div>
              <div v-else class="text-muted">No hay datos.</div>
            </div>
            <div class="col-12 col-lg-6">
              <h5 class="card-title">Citas por Día de la Semana</h5>
              <div v-if="conteoPorDia.length > 0" class="chart-container">
                <BarChart :chart-data="diaChartData" :chart-options="chartOptions" />
              </div>
              <div v-else class="text-muted">No hay datos.</div>
            </div>
            <!-- WIDGET: Horario Pico -->
            <div class="col-12">
              <h5 class="card-title">Horarios Pico</h5>
              <div v-if="horarioPico.length > 0" class="table-responsive">
                <table class="table table-sm table-borderless text-center">
                  <thead>
                  <tr>
                    <th>Día</th>
                    <th>Hora Pico</th>
                    <th>Total Citas</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="pico in horarioPico" :key="pico.dia">
                    <td>{{ pico.dia }}</td>
                    <td><span class="badge bg-primary">{{ pico.horario }}</span></td>
                    <td><strong>{{ pico.totalCitas }}</strong></td>
                  </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-muted">No hay datos.</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  /* Hacemos que el contenedor se centre horizontalmente dentro de la tarjeta */
  margin-left: auto;
  margin-right: auto;
  max-width: 350px;
  min-height: 250px;
  width: 100%;
  flex-grow: 1;
  margin-top: auto;
}
</style>
