export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const userKey = localStorage.getItem('user-api-key');
  const accessCode = localStorage.getItem('access-code');
  if (userKey) return { 'x-user-api-key': userKey };
  if (accessCode) return { 'x-access-code': accessCode };
  return {};
}

export function hasAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('user-api-key') || localStorage.getItem('access-code'));
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...getAuthHeaders(),
  };
  return fetch(url, { ...options, headers });
}
