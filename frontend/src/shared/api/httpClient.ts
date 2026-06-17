import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearStoredSession, readStoredSession, storeSession } from '../auth/tokenStorage';
import { buildApiUrl, env } from '../config/env';
import type { ApiResponse, AuthTokens } from '../types/api';

const httpClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url?.startsWith('/')) {
    config.url = buildApiUrl(config.url);
    config.baseURL = undefined;
  }

  const session = readStoredSession();
  if (session.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const session = readStoredSession();

    if (status !== 401 || originalRequest._retry || !session.refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = axios
        .post<ApiResponse<Omit<AuthTokens, 'user'>>>(buildApiUrl('/auth/refresh'), {
          refreshToken: session.refreshToken,
        })
        .then((response) => {
          const updatedSession = {
            accessToken: response.data.data.accessToken,
            refreshToken: response.data.data.refreshToken,
            user: session.user,
          };
          storeSession(updatedSession);
          return updatedSession.accessToken;
        })
        .catch(() => {
          clearStoredSession();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const accessToken = await refreshPromise;
    if (!accessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return httpClient(originalRequest);
  },
);

export { httpClient };
