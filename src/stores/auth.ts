import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode} from 'jwt-decode';

interface UserInfo {
  email: string;
  name: string;
  picture: string | null;
  roles: string[];
  sede: string | null;
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    // variables reactivas que guardarán el estado
    const token = ref<string | null>(null);
    const refreshToken = ref<string | null>(null);
    const user = ref<UserInfo | null>(null);

    const isLoggedIn = computed(() => !!token.value && token.value.length > 0);
    const isAuditor = computed(() => user.value?.roles.includes('ROLE_AUDITOR') ?? false);
    const isAdmin = computed(() => user.value?.roles.includes('ROLE_ADMIN') ?? false);
    const isUser = computed(() => {
      if (!isLoggedIn.value) return false;
      return user.value?.roles.includes('ROLE_USER') ?? false;
    })
    // metodos que modifican el estado del store
    function setToken(accessToken: string, newRefreshToken?: string) {
      token.value = accessToken
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken;
      }
      try {
        const decoded: {
          name: string
          email: string
          picture: string
          roles: string[]
          sede: string
        } = jwtDecode(accessToken)
        user.value = {
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture || null,
          roles: decoded.roles || [],
          sede: decoded.sede || null,
        }
      } catch (e) {
        console.error('Token inválido, no se puede decodificar: ', e)
        logout()
      }
    }
    function logout() {
      token.value = null;
      refreshToken.value = null;
      user.value = null;

    }
    return { token, refreshToken, user, isLoggedIn, isAuditor, isAdmin, isUser, setToken, logout };
  },
  {
    // le dice al plugin que guarde los datos en el localstorage del navegador
    persist: true,
  }
  );
