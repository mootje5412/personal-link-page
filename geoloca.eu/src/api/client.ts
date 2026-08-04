export type User = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
  createdAt: string;
  trialEndsAt: string;
  trialActive: boolean;
};

type ApiError = { error: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data;
}

export const api = {
  me: () => request<{ user: User }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  google: (credential: string) =>
    request<{ user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};
