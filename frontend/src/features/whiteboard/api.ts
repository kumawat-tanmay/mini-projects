import { apiFetch } from '@/utils/api';

export interface WhiteboardData {
  _id: string;
  userId: string;
  canvasData: any;
  updatedAt: string;
}

export interface SaveResponse {
  success: boolean;
  updatedAt: string;
}

export const fetchWhiteboard = async (): Promise<WhiteboardData> => {
  return apiFetch('/whiteboard');
};

export const updateWhiteboard = async (canvasData: any): Promise<SaveResponse> => {
  return apiFetch('/whiteboard', {
    method: 'PUT',
    body: JSON.stringify({ canvasData }),
  });
};

export const clearWhiteboard = async (): Promise<{ success: boolean; message: string }> => {
  return apiFetch('/whiteboard', {
    method: 'DELETE',
  });
};
