<script setup lang="ts">

import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { logout } from '@/services/authService';
import logo from '@/assets/alven24x24.png';

const authStore = useAuthStore();
function handleLogout() {
  logout();
}

</script>

<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <nav class="sidebar bg-dark text-white d-flex flex-column p-3">

      <!-- Encabezado del Sidebar (con layout de CSS puro para animación fluida) -->
      <div class="sidebar-header">
        <div class="logo-title-group">
          <img :src="logo" alt="Logo Alven IPS" width="40" height="40" class="rounded-circle" />
          <span class="fs-5 fw-bold">Agendamiento</span>
        </div>
      </div>

      <!-- Menú de Navegación -->
      <ul class="nav nav-pills flex-column mb-auto">
        <hr class="text-white-50" />
        <li class="nav-item">
          <RouterLink :to="{ name: 'dashboard-home' }" class="nav-link text-white">
            <i class="bi bi-calendar-check-fill"></i>
            <span class="link-text">Agendas</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'clientes' }" class="nav-link text-white">
            <i class="bi bi-people-fill"></i>
            <span class="link-text">Clientes</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'estadisticas' }" class="nav-link text-white" v-if="authStore.isAuditor">
            <i class="bi bi-pie-chart-fill"></i>
            <span class="link-text">Estadísticas</span>
          </RouterLink>
        </li>
        <!-- Aquí irán futuros enlaces -->
      </ul>

      <!-- Sección de Usuario y Logout -->
      <div class="mt-auto">
        <hr class="text-white-50" />
        <div class="user-info">
          <img
            :src="authStore.user?.picture || logo"
            alt="Foto de perfil"
            width="40"
            height="40"
            class="rounded-circle"
          />
          <div class="user-details">
            <div class="fw-bold">{{ authStore.user?.name || 'Usuario'}}</div>
            <small class="text-white-50 text-start">{{ authStore.user?.email || 'usuario@correo.com' }}</small>
          </div>
        </div>

        <a href="#" @click.prevent="handleLogout" class="nav-link text-white">
          <i class="bi bi-box-arrow-left"></i>
          <span class="link-text">Cerrar sesión</span>
        </a>
      </div>
    </nav>

    <!-- Contenido principal dinámico -->
    <div class="container-fluid py-3">
      <div class="main-content">
        <div class="container-fluid">
          <RouterView />
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* ========================================= */
/* (1) Estilos "Mobile-First" (Por Defecto)  */
/* ========================================= */
.sidebar {
  width: 80px; /* Por defecto, el sidebar está colapsado */
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1030;
  transition: width 0.3s ease-in-out;
}

.main-content {
  min-height: 100vh;
  margin-left: 80px; /* Margen por defecto para el sidebar colapsado */
  transition: margin-left 0.3s ease-in-out;
  background-color: transparent;
}

/* Por defecto, el texto está oculto */
.link-text,
.sidebar-header span,
.user-details {
  opacity: 0;
  width: 0;
  overflow: hidden;
  transition: opacity 0.1s ease-out;
  font-size: 0.9rem;
  line-height: 1.2;
}

.logo-title-group {
  justify-content: center;
}

/* ========================================= */
/* (2) Estilos para Pantallas Grandes (Desktop) */
/* ========================================= */
@media (min-width: 992px) {
  /* En pantallas de 992px o más... */

  .sidebar {
    width: 280px; /* ...el sidebar se expande. */
  }

  .main-content {
    margin-left: 280px; /* ...y el margen del contenido se ajusta. */
  }

  /* Hacemos visible el texto de nuevo */
  .link-text,
  .sidebar-header span,
  .user-details {
    opacity: 1;
    width: auto; /* Permitimos que ocupe su espacio natural */
  }

  .logo-title-group {
    justify-content: flex-start; /* Alineamos el logo y título a la izquierda */
  }
}

/* ========================================= */
/* Estilos Generales (No cambian)            */
/* ========================================= */
.sidebar-header {
  display: flex;
  align-items: center;
  min-height: 60px;
}

.logo-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  transition: background-color 0.2s ease-in-out;
}

.nav-link:hover {
  background-color: rgba(200, 200, 200, 0.15);
}

.nav-link i {
  font-size: 1.25rem;
  min-width: 24px;
  text-align: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.mt-auto {
  margin-top: auto;
}

</style>
