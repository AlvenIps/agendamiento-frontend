import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore} from '@/stores/auth';
import { refreshToken } from '@/services/authService.ts';


const apiClient: AxiosInstance = axios.create({
  // el Reverse Proxy redirige esto al contenedor Docker del backend
  baseURL: import.meta.env.VITE_API_CLIENT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      console.log('token encontrado');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No se encontró token. La petición se enviará sin autorización.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if(error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
          originalRequest.headers['Authorization'] = `Bearer` + newAccessToken;
          return apiClient(originalRequest);
        }
      } catch (e) {
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
