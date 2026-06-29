import { httpClient } from '../../../shared/api/httpClient';
import type { ApiResponse, Label, LabelDetail, PaginatedLabels } from '../../../shared/types/api';
import type { LabelFormValues } from '../schemas/labelSchemas';

export interface LabelFiltersState {
  externalReference: string;
  receiver: string;
  createdBy: string;
  status: string;
  startDate: string;
  endDate: string;
}

export async function listLabels(filters: LabelFiltersState): Promise<PaginatedLabels> {
  const params = new URLSearchParams();
  if (filters.externalReference) params.append('externalReference', filters.externalReference);
  if (filters.receiver) params.append('receiver', filters.receiver);
  if (filters.createdBy) params.append('createdBy', filters.createdBy);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
  if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());
  params.append('page', '1');
  params.append('limit', '50');
  const response = await httpClient.get<ApiResponse<PaginatedLabels>>(`/labels?${params.toString()}`);
  return response.data.data;
}

export async function getLabel(id: string): Promise<Label> {
  const response = await httpClient.get<ApiResponse<Label>>(`/labels/${id}`);
  return response.data.data;
}

export async function getLabelDetail(id: string): Promise<LabelDetail> {
  const response = await httpClient.get<ApiResponse<LabelDetail>>(`/labels/${id}/detail`);
  return response.data.data;
}

export async function createLabel(payload: LabelFormValues): Promise<Label> {
  const response = await httpClient.post<ApiResponse<Label>>('/labels', payload);
  return response.data.data;
}

export async function bulkCreateLabels(payload: Array<LabelFormValues>): Promise<{
  created: number;
  failed: Array<{ index: number; message: string }>;
}> {
  const response = await httpClient.post<ApiResponse<{ created: number; failed: Array<{ index: number; message: string }> }>>(
    '/labels/bulk',
    { labels: payload },
  );
  return response.data.data;
}

export async function updateLabel(id: string, payload: LabelFormValues): Promise<Label> {
  const response = await httpClient.put<ApiResponse<Label>>(`/labels/${id}`, payload);
  return response.data.data;
}

export async function previewLabel(payload: LabelFormValues): Promise<string> {
  const response = await httpClient.post<ApiResponse<{ zpl: string }>>('/labels/preview', payload);
  return response.data.data.zpl;
}

export async function deleteLabel(id: string): Promise<void> {
  await httpClient.delete(`/labels/${id}`);
}

export async function bulkDeleteLabels(ids: string[]): Promise<{ deleted: number; failed: Array<{ id: string; message: string }> }> {
  const response = await httpClient.post<ApiResponse<{ deleted: number; failed: Array<{ id: string; message: string }> }>>('/labels/bulk-delete', { ids });
  return response.data.data;
}

export async function duplicateLabel(id: string): Promise<Label> {
  const response = await httpClient.post<ApiResponse<Label>>(`/labels/${id}/duplicate`);
  return response.data.data;
}

export async function getLabelZpl(id: string): Promise<string> {
  const response = await httpClient.get<ApiResponse<{ zpl: string }>>(`/labels/${id}/zpl`);
  return response.data.data.zpl;
}

export interface DownloadZplResponse {
  id: string;
  zplContent: string;
  downloaded: boolean;
  downloadCount: number;
  lastDownloadedAt: string | null;
}

export async function downloadLabelZpl(id: string, bulk = false): Promise<string> {
  const response = await httpClient.get(`/labels/${id}/download${bulk ? '?bulk=true' : ''}`, {
    responseType: 'text',
  });
  return response.data as string;
}

export async function downloadLabelZplWithMeta(id: string, bulk = false): Promise<DownloadZplResponse> {
  const response = await httpClient.get<ApiResponse<DownloadZplResponse>>(
    `/labels/${id}/download${bulk ? '?bulk=true' : ''}`,
  );
  return response.data.data;
}
