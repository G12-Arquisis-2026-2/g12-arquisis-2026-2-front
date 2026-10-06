// src/services/httpClient.ts
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

type TokenGetter = () => Promise<string | undefined>;
type UnauthorizedHandler = () => Promise<void> | void;

let currentTokenGetter: TokenGetter | null = null;
let currentUnauthorizedHandler: UnauthorizedHandler | null = null;

export const setTokenGetter = (getter: TokenGetter | null) => {
  currentTokenGetter = getter;
};

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  currentUnauthorizedHandler = handler;
};

// 1. Interceptor de Request: inyecta el token Bearer
export const registerAuthInterceptor = (): number => {
  return apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (currentTokenGetter) {
        try {
          const token = await currentTokenGetter();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error al resolver token en interceptor de Axios:', error);
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// 2. Interceptor de Response: detecta 401 y dispara el re-login
export const registerResponseInterceptor = (): number => {
  return apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        if (currentUnauthorizedHandler) {
          await currentUnauthorizedHandler();
        }
      }
      return Promise.reject(error);
    }
  );
};

// Limpieza de interceptores
export const ejectInterceptors = (reqId: number, resId: number) => {
  apiClient.interceptors.request.eject(reqId);
  apiClient.interceptors.response.eject(resId);
};