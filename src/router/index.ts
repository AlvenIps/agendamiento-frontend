import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore} from '@/stores/auth.ts' // store de Pinia

// componentes de vistas
import AgendarCitaView  from '@/views/publicas/AgendarCitaView.vue'
import LoginView from '@/views/privadas/LoginView.vue'
import AuthCallbackView from '@/views/privadas/AuthCallbackView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import DashboardHomeView from '@/views/privadas/DashboardHomeView.vue'
import PanelClientesView from '@/views/privadas/PanelClientesView.vue'
import LogoutCallbackView from '@/views/privadas/LogoutCallbackView.vue'
import EstadisticasView from '@/views/privadas/EstadisticasView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'agendar' },
    },
    {
      path: '/agendar',
      name: 'agendar',
      component: AgendarCitaView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackView,
    },
    // rutas privadas
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true }, // con esto se marca como privada
      children: [
        {
          path: '',
          name: 'dashboard-home',
          component: DashboardHomeView,
        },
        {
          path: '/clientes',
          name: 'clientes',
          component: PanelClientesView
        },
        {
          path: '/estadisticas',
          name: 'estadisticas',
          component: EstadisticasView
        }
      ]
    },
    {
      path: '/logout/callback',
      name: 'logout-callback',
      component: LogoutCallbackView
    }
  ],
})
// guard de nav
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const necesitaAuthenticacion = to.meta.requiresAuth;

  // se comprueba si la ruta es privada y si el usuario está autenticado
  if (necesitaAuthenticacion && !authStore.isLoggedIn) {
    // si no se cumple, se redirige a la pagina de login
    console.log('Acceso denegado. Redirigiendo al login..');
    next({ name: 'login' });
  } else {
    // sino, lo dejamos pasar
    next();
  }
})

export default router
