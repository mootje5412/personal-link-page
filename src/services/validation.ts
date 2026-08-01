const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/
const API_KEY_RE = /^vp_[A-Za-z0-9_-]{41,61}$/

export class ApiUnavailableError extends Error {
  constructor() {
    super('API unavailable')
    this.name = 'ApiUnavailableError'
  }
}

export function validateUsername(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Kullanıcı adı gerekli.'
  }

  if (trimmed.length < 3 || trimmed.length > 32) {
    return 'Kullanıcı adı 3-32 karakter olmalı.'
  }

  if (!USERNAME_RE.test(trimmed)) {
    return 'Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) içerebilir.'
  }

  return null
}

export function validateApiKey(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'API anahtarı gerekli.'
  }

  if (!trimmed.startsWith('vp_')) {
    return 'Anahtar vp_ ile başlamalıdır.'
  }

  if (!API_KEY_RE.test(trimmed)) {
    return 'Geçersiz API anahtarı formatı. Kayıt sırasında aldığınız anahtarı eksiksiz yapıştırın.'
  }

  return null
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text()

  if (!text.trim()) {
    throw new ApiUnavailableError()
  }

  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    throw new ApiUnavailableError()
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ApiUnavailableError()
  }

  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? 'Bir hata oluştu.')
  }

  return data as T
}

export function isApiUnavailableError(err: unknown) {
  return err instanceof ApiUnavailableError || (err instanceof TypeError && err.message === 'Failed to fetch')
}
