import { getToken } from './supabase';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

export function hasAuth(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for Supabase session key in localStorage
  return Object.keys(localStorage).some(k => k.startsWith('sb-'));
}

export function getAuthHeaders(): Record<string, string> {
  return {};
}
