<script setup lang="ts">
import { Doughnut} from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartData,
  type ChartOptions
} from 'chart.js';
// componentes a utilizar en los charts
ChartJS.register(Title, Tooltip, Legend, ArcElement);
// props desde EstadisticasView.vue
defineProps<{
  chartData: ChartData<'doughnut'>;
  chartOptions?: ChartOptions<'doughnut'>;
}>();
</script>
<template>
  <Doughnut :data="chartData" :options="chartOptions" />
</template>
