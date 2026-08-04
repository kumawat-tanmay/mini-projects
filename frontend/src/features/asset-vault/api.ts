import { apiFetch } from '@/utils/api';
import type { Asset } from './types';

export const fetchAssets = async (): Promise<Asset[]> => {
  const data = await apiFetch(`/assets`);
  return data.assets;
};

export const uploadAsset = async (file: File): Promise<Asset> => {
  const formData = new FormData();
  formData.append('file', file);
  
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
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:5000/api";
  
  const res = await fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = 'Failed to upload asset';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      if (res.status === 413 || res.status === 500) {
        errorMessage = 'File is more than 10 MB and cannot be uploaded.';
      } else {
        errorMessage = 'File is more than 10 MB and cannot be uploaded.';
      }
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data.asset;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await apiFetch(`/assets/${id}`, {
    method: 'DELETE',
  });
};
