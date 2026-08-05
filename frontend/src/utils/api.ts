const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:5000/api";

// Simple cookie parser (zero dependencies)
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const setToken = (token: string) => {
  // Store token in cookie for 30 days
  document.cookie = `auth_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}`;
};

export const removeToken = () => {
  document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

// Minimalist fetch wrapper that auto-attaches the Bearer token
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getCookie('auth_token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }

  return data;
};
