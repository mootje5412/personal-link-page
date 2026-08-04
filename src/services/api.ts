import type { AuthResponse, User, Video } from '../types'

const TOKEN_KEY = 'loop_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const isForm = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data as T
}

export const api = {
  register(body: {
    username: string
    displayName: string
    email?: string
    phone?: string
    password: string
  }) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  login(body: { login: string; password: string }) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  me() {
    return request<{ user: User }>('/api/auth/me')
  },

  updateProfile(body: { displayName?: string; bio?: string; avatarUrl?: string }) {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  getFeed(limit = 20, offset = 0) {
    return request<{ videos: Video[] }>(`/api/videos/feed?limit=${limit}&offset=${offset}`)
  },

  getFollowingFeed(limit = 20, offset = 0) {
    return request<{ videos: Video[] }>(`/api/videos/following?limit=${limit}&offset=${offset}`)
  },

  getVideo(id: number) {
    return request<{ video: Video }>(`/api/videos/${id}`)
  },

  uploadVideo(file: File, caption: string, soundName?: string) {
    const form = new FormData()
    form.append('video', file)
    form.append('caption', caption)
    if (soundName) form.append('soundName', soundName)
    return request<{ video: Video }>('/api/videos', { method: 'POST', body: form })
  },

  getUser(username: string) {
    return request<{ user: User; videos: Video[] }>(`/api/users/${encodeURIComponent(username)}`)
  },

  toggleLike(videoId: number) {
    return request<{ liked: boolean }>(`/api/videos/${videoId}/like`, { method: 'POST' })
  },

  toggleFollow(username: string) {
    return request<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`, {
      method: 'POST',
    })
  },
}
