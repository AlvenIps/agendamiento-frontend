<script setup lang="ts">
// (1) --- IMPORTS ---

import { Bar } from 'vue-chartjs';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement, // Específico para barras
  CategoryScale, // Eje X (categorías)
  LinearScale,   // Eje Y (valores numéricos)
  type ChartData,
  type ChartOptions
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);


defineProps<{
  chartData: ChartData<'bar'>;
  chartOptions?: ChartOptions<'bar'>;
}>();
</script>

<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>
