import { getStoredToken } from './authApi'
import { isLocalToken } from './localAuth'
import { ApiUnavailableError, isApiUnavailableError, parseApiResponse } from './validation'

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getStoredToken()

  if (isLocalToken(token)) {
    throw new ApiUnavailableError()
  }

  const headers = new Headers(init.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const res = await fetch(input, { ...init, headers })
    return parseApiResponse(res)
  } catch (err) {
    if (isApiUnavailableError(err)) {
      throw new ApiUnavailableError()
    }
    throw err
  }
}
