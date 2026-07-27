const BASE_URL = import.meta.env.VITE_API_URL || '';

export function api(path: string): string {
  return `${BASE_URL}${path}`;
}

interface ApiOptions {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = api(path);
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  const token = localStorage.getItem('steam_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  });
}

export async function apiPost<T>(path: string, body: T): Promise<Response> {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
