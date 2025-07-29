<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { handleLogoutCallback } from '@/services/authService';

const router = useRouter();

onMounted(async () => {
  await handleLogoutCallback();
  router.push({ name: 'login' });
});
</script>

<template>
  <div>Cerrando sesión...</div>
</template>
