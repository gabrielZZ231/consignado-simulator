import type { PublicUser, UserRole } from '../types/auth.types';
import { getApiBaseUrl, SimulationApiError } from './simulation.api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers ?? {})
  };

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    throw new SimulationApiError(
      body?.error?.message ?? 'Não foi possível concluir a operação.',
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const login = (email: string, password: string) =>
  request<{ user: PublicUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const logout = () =>
  request<void>('/api/auth/logout', {
    method: 'POST'
  });

export const listUsers = () => request<{ users: PublicUser[] }>('/api/admin/users');

export const createUser = (input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) =>
  request<{ user: PublicUser }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(input)
  });

export const toggleUserStatus = (id: string) =>
  request<{ user: PublicUser }>(`/api/admin/users/${id}/status`, {
    method: 'PATCH'
  });
