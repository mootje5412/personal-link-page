export type AuthUser = {
  id: number
  username: string
  email: string | null
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

const TOKEN_KEY = 'apex_token'
const USER_KEY = 'apex_user'

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Bir hata oluştu.')
  }
  return data as T
}

export async function register(
  username: string,
  password: string,
  email?: string
): Promise<AuthResponse> {
  const body: Record<string, string> = { username, password }
  if (email?.trim()) body.email = email.trim()

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<AuthResponse>(res)
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return parseJson<AuthResponse>(res)
}

export function saveSession({ user, token }: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
