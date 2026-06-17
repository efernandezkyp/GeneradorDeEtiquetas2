import { httpClient } from '../../../shared/api/httpClient';
import { buildApiUrl } from '../../../shared/config/env';
import type { ApiResponse, AuthTokens, AuthUser } from '../../../shared/types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthTokens> {
  const response = await httpClient.post<ApiResponse<AuthTokens>>('/auth/login', payload);
  return response.data.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await httpClient.get<ApiResponse<AuthUser>>('/auth/me');
  return response.data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await httpClient.post('/auth/logout', { refreshToken });
}

export function getGoogleAuthUrl(): string {
  return buildApiUrl('/auth/google');
}
