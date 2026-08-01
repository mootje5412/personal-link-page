export type AuthUser = {
  id: number
  username: string
  email: string | null
  keyPrefix?: string
  createdAt?: string
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export type RegisterResponse = AuthResponse & {
  apiKey: string
  message?: string
}

export type TermsInfo = {
  version: string
  title: string
  summary: string
}

const TOKEN_KEY = 'veripanel_token'
const USER_KEY = 'veripanel_user'

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Bir hata oluştu.')
  }
  return data as T
}

export async function fetchTerms(): Promise<TermsInfo> {
  const res = await fetch('/api/auth/terms')
  return parseJson<TermsInfo>(res)
}

export async function register(
  username: string,
  acceptedTerms: boolean,
  email?: string
): Promise<RegisterResponse> {
  const body: Record<string, string | boolean> = {
    username,
    acceptedTerms,
    termsVersion: '1.0',
  }
  if (email?.trim()) body.email = email.trim()

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<RegisterResponse>(res)
}

export async function login(apiKey: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: apiKey.trim() }),
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
