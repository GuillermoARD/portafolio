import type { ApiResult, Certificate, Project, SkillGroup } from '../types';
import type { ContactValues } from './validateContact';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

// Las imágenes subidas (/uploads/...) viven en el back, que puede estar en otro dominio.
export function assetUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${API_URL}${url}` : url;
}

export async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<ApiResult<T>> {
  const { token, headers, ...rest } = init;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        ...(rest.body && !(rest.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
    });
    const data = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (data && typeof data === 'object' && 'ok' in data) {
      return data.ok ? data : { ...data, status: res.status };
    }
    return { ok: false, status: res.status, error: `Error del servidor (${res.status}). Inténtalo más tarde.` };
  } catch {
    return { ok: false, error: 'No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.' };
  }
}

export const sendContact = (values: ContactValues) =>
  request<{ mode: string }>('/api/contact', { method: 'POST', body: JSON.stringify(values) });

export const getProjects = () => request<{ projects: Project[] }>('/api/projects');

export const getSkills = () => request<{ skillGroups: SkillGroup[] }>('/api/skills');

export const getCertificates = () => request<{ certificates: Certificate[] }>('/api/certificates');

// "2025-03" → "marzo 2025"
export function formatMonth(value: string | null): string {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}
