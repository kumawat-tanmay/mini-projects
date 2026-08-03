import { apiFetch } from '@/utils/api';
import type { Prompt } from './types';

export const fetchPrompts = async (): Promise<Prompt[]> => {
  const data = await apiFetch(`/prompt-store`);
  return data.prompts;
};

export const createPrompt = async (
  promptData: Partial<Pick<Prompt, 'title' | 'content' | 'tags'>>
): Promise<Prompt> => {
  const data = await apiFetch('/prompt-store', {
    method: 'POST',
    body: JSON.stringify(promptData),
  });
  return data.prompt;
};

export const updatePrompt = async (
  id: string,
  updates: Partial<Pick<Prompt, 'title' | 'content' | 'tags'>>
): Promise<Prompt> => {
  const data = await apiFetch(`/prompt-store/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.prompt;
};

export const deletePrompt = async (id: string): Promise<void> => {
  await apiFetch(`/prompt-store/${id}`, {
    method: 'DELETE',
  });
};

export const deleteAllPrompts = async (): Promise<void> => {
  await apiFetch('/prompt-store', {
    method: 'DELETE',
  });
};

export const extractTextFromFile = async (file: File): Promise<Prompt> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // We can't use our apiFetch helper because FormData requires the browser to set the Content-Type header with the boundary
  // so we have to manually fetch with the token
  
  // Minimal manual token extraction
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };
  
  const token = getCookie('auth_token');
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  // We don't set Content-Type; browser handles it for FormData
  const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:5000/api";
  
  const res = await fetch(`${API_URL}/prompt-store/extract`, {
    method: 'POST',
    headers,
    body: formData
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.prompt;
};
