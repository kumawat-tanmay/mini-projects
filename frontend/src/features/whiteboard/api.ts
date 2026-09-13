import { apiFetch } from '@/utils/api';

export interface WhiteboardSummary {
  _id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface WhiteboardDetail extends WhiteboardSummary {
  userId: string;
  canvasData: any;
}

export interface SaveResponse {
  success: boolean;
  updatedAt: string;
  title: string;
}

// Fetch list of all user's boards (lightweight metadata)
export const fetchBoards = async (): Promise<WhiteboardSummary[]> => {
  return apiFetch('/whiteboard');
};

// Fetch full board by ID with canvasData
export const fetchBoardById = async (id: string): Promise<WhiteboardDetail> => {
  return apiFetch(`/whiteboard/${id}`);
};

// Create a new board
export const createBoard = async (title: string = 'Untitled Board'): Promise<WhiteboardDetail> => {
  return apiFetch('/whiteboard', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
};

// Update an existing board's canvasData and/or title
export const updateBoard = async (
  id: string,
  canvasData?: any,
  title?: string
): Promise<SaveResponse> => {
  const payload: Record<string, any> = {};
  if (canvasData !== undefined) payload.canvasData = canvasData;
  if (title !== undefined) payload.title = title;

  return apiFetch(`/whiteboard/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Delete a board
export const deleteBoard = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiFetch(`/whiteboard/${id}`, {
    method: 'DELETE',
  });
};
