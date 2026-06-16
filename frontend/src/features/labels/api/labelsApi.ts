import { httpClient } from '../../../shared/api/httpClient';
import type { ApiResponse, Label, PaginatedLabels } from '../../../shared/types/api';
import type { LabelFormValues } from '../schemas/labelSchemas';

export interface LabelFiltersState {
  externalReference: string;
  createdBy: string;
  startDate: string;
  endDate: string;
}

export async function listLabels(filters: LabelFiltersState): Promise<PaginatedLabels> {
  const params = new URLSearchParams();
  if (filters.externalReference) params.append('externalReference', filters.externalReference);
  if (filters.createdBy) params.append('createdBy', filters.createdBy);
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

export async function createLabel(payload: LabelFormValues): Promise<Label> {
  const response = await httpClient.post<ApiResponse<Label>>('/labels', payload);
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

export async function duplicateLabel(id: string): Promise<Label> {
  const response = await httpClient.post<ApiResponse<Label>>(`/labels/${id}/duplicate`);
  return response.data.data;
}

export async function getLabelZpl(id: string): Promise<string> {
  const response = await httpClient.get<ApiResponse<{ zpl: string }>>(`/labels/${id}/zpl`);
  return response.data.data.zpl;
}
