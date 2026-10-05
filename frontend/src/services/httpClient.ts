import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setupAxiosInterceptors = (
  getAccessTokenSilently: () => Promise<string>
) => {
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessTokenSilently();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Petición continúa sin token si el usuario no ha iniciado sesión
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};