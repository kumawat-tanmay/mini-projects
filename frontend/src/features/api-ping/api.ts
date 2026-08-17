import { apiFetch } from '@/utils/api';

export interface SavedRequest {
  _id: string;
  name: string;
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body: string;
  updatedAt: string;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
  error?: string;
}

export const fetchSavedRequests = async (): Promise<SavedRequest[]> => {
  return apiFetch('/api-ping');
};

export const saveRequest = async (request: Partial<SavedRequest> & { id?: string }): Promise<SavedRequest> => {
  return apiFetch('/api-ping', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export const deleteRequest = async (id: string): Promise<{ success: boolean }> => {
  return apiFetch(`/api-ping/${id}`, {
    method: 'DELETE',
  });
};

export const proxyRequest = async (request: {
  url: string;
  method: string;
  headers: { key: string; value: string }[];
  body: string;
}): Promise<ProxyResponse> => {
  return apiFetch('/api-ping/proxy', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};
