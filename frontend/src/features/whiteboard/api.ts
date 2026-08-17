import { apiFetch } from '@/utils/api';

export interface WhiteboardData {
  _id: string;
  userId: string;
  canvasData: any;
  updatedAt: string;
}

export const fetchWhiteboard = async (): Promise<WhiteboardData> => {
  return apiFetch('/whiteboard');
};

export const updateWhiteboard = async (canvasData: any): Promise<WhiteboardData> => {
  return apiFetch('/whiteboard', {
    method: 'PUT',
    body: JSON.stringify({ canvasData }),
  });
};
