import { httpClient } from '../../../shared/api/httpClient';
import type { ApiResponse, PendingDispatchResponse } from '../../../shared/types/api';

export async function getPendingDispatchLabels(): Promise<PendingDispatchResponse> {
  const response = await httpClient.get<ApiResponse<PendingDispatchResponse>>(
    '/labels/pending-dispatch',
  );
  return response.data.data;
}
