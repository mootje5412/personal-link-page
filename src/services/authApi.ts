import { localLogin, localRegister } from './localAuth'
import type { AuthResponse, AuthUser, RegisterResponse } from './authTypes'
import { isApiUnavailableError, parseApiResponse } from './validation'

export type { AuthResponse, AuthUser, RegisterResponse } from './authTypes'

const TOKEN_KEY = 'veripanel_token'
const USER_KEY = 'veripanel_user'

export async function register(username: string, acceptedTerms: boolean): Promise<RegisterResponse> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        acceptedTerms,
        termsVersion: '1.0',
      }),
    })

    return await parseApiResponse<RegisterResponse>(res)
  } catch (err) {
    if (isApiUnavailableError(err)) {
      return localRegister(username)
    }
    throw err
  }
}

export async function login(apiKey: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    })

    return await parseApiResponse<AuthResponse>(res)
  } catch (err) {
    if (isApiUnavailableError(err)) {
      return localLogin(apiKey)
    }
    throw err
  }
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
