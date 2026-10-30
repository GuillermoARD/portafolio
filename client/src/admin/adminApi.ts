import { request } from '../lib/api';
import type { ApiResult, SkillLogoData } from '../types';

const TOKEN_KEY = 'admin-token';

export function loadToken(): string | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: number };
    return expiresAt > Date.now() ? token : null;
  } catch {
    return null;
  }
}

export function saveToken(token: string, expiresAt: number) {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
  } catch {
    // Sin almacenamiento: la sesión dura hasta recargar la página.
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // nada que limpiar
  }
}

export const login = (username: string, password: string) =>
  request<{ token: string; expiresAt: number }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

// Cliente con sesión: avisa con onUnauthorized cuando el token deja de valer.
export function createAdminClient(token: string, onUnauthorized: () => void) {
  async function call<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    const result = await request<T>(`/api/admin${path}`, { ...init, token });
    if (!result.ok && result.status === 401) onUnauthorized();
    return result;
  }

  return {
    me: () => call<{ user: string }>('/me'),
    brandLogo: (name: string) => call<{ logo: SkillLogoData | null }>(`/brand-logo?name=${encodeURIComponent(name)}`),
    list: <T>(resource: string) => call<{ items: T[] }>(`/${resource}`),
    create: <T>(resource: string, body: unknown) =>
      call<{ item: T }>(`/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
    update: <T>(resource: string, id: number, body: unknown) =>
      call<{ item: T }>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (resource: string, id: number) => call<object>(`/${resource}/${id}`, { method: 'DELETE' }),
    upload: (file: File) => {
      const form = new FormData();
      form.append('image', file);
      return call<{ url: string }>('/upload', { method: 'POST', body: form });
    },
  };
}

export type AdminClient = ReturnType<typeof createAdminClient>;

// "Node.js, Express , Zod" → ['Node.js', 'Express', 'Zod']
export const splitList = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
