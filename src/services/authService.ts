import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import { useAuthStore } from '@/stores/auth.ts';
import { CLIENT_ID, SCOPES_STRING } from '@/services/authConstants.ts';
import apiClient from '@/services/apiClient.ts';

const authorityUrl = import.meta.env.VITE_API_BASE_URL;
const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI;

const postLogoutRedirectUri = redirectUri ? new URL(redirectUri).origin + '/signin' : 'https://app.alvenips.com/signin';

const settings = {
  authority: authorityUrl,
  client_id: CLIENT_ID,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: SCOPES_STRING,
  post_logout_redirect_uri: postLogoutRedirectUri,
  extraQueryParams: {
    access_type: 'offline',
    prompt: 'consent'
  },
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

const userManager = new UserManager(settings);

/**
* Inicia el flujo de login. La librería se encarga de PKCE.
*/
export function login() {
  return userManager.signinRedirect();
}

/**
 * Procesa el callback después de un login exitoso.
 */
export async function handleLoginCallback(): Promise<string> {
  try {
    const user: User | null = await userManager.signinRedirectCallback();
    if (!user) {
      throw new Error("El objeto de usuario es nulo después del callback.");
    }
    const authStore = useAuthStore();
    authStore.setToken(user.access_token, user.refresh_token);

    // Devolvemos la ruta a la que el usuario debe ser redirigido.
    const state = user.state as { redirectPath?: string };
    return state?.redirectPath || '/panel';

  } catch (error) {
    console.error("Error en el callback de login:", error);
    return '/signin?error=true';
  }
}

export async function refreshToken(): Promise<string | null> {
  const authStore = useAuthStore();
  if (!authStore.refreshToken) {
    console.error("No hay refresh token disponible. Cerrando sesión.");
    logout();
    return null;
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', authStore.refreshToken);
  params.append('client_id', CLIENT_ID);

  try {
    const response = await apiClient.post(`${authorityUrl}/oauth2/token`, params);
    const { access_token, refresh_token } = response.data;
    authStore.setToken(access_token, refresh_token);
    return access_token;
  } catch (error) {
    console.error("Fallo al refrescar el token. El refresh token puede haber expirado. Cerrando sesión.", error);
    logout();
    throw error;
  }
}
// cierra la sesión del usuario
export function logout() {
  const authStore = useAuthStore();
  authStore.logout(); // se limpia el store de Pinia
  window.location.href = `${authorityUrl}/logout`;
}

export async function handleLogoutCallback() {
  await userManager.signoutRedirectCallback();
}

