import { httpClient } from '../../../shared/api/httpClient';
import type { ApiResponse, DashboardStats } from '../../../shared/types/api';

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await httpClient.get<ApiResponse<DashboardStats>>('/dashboard');
  return response.data.data;
}
