<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { handleLoginCallback } from '@/services/authService';
const router = useRouter();

onMounted(async () => {
  // Cuando esta página carga, llamamos a la función que maneja el callback
  const redirectTo = await handleLoginCallback();
  // Una vez que tenemos el token, redirigimos al usuario a la página que quería ver
  router.push(redirectTo);
});
</script>
<template>
  <div class="container">
    <h2>Procesando autenticación...</h2>
    <p>Por favor, espere..</p>
  </div>
</template>
