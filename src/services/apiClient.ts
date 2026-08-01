import { getStoredToken } from './authApi'

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getStoredToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(input, { ...init, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Bir hata oluştu.')
  }

  return data
}
