import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setupAxiosInterceptors = (
  getAccessTokenFn: () => Promise<string>
) => {
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessTokenFn();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Continúa sin token si ocurre un error
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};