import { SearchType } from './dashboardApi'

export type SearchResult = {
  row?: number
  isim?: string
  telefon?: string
  telefon_sifirli?: string
  telefon_uluslararasi?: string
  email?: string
  tc?: string
  sehir?: string
  ilce?: string
  ulke?: string
  adres?: string
  posta_kodu?: string
  sirket?: string
  username?: string
  website?: string
  diger?: Record<string, string>
}

export type QuerySearchResponse = {
  ok: boolean
  query?: string
  found: number
  returned: number
  results: SearchResult[]
  ms: number
  detail?: string
}

const API_BASE = '/phone-api'
const REQUEST_TIMEOUT_MS = 20000

export async function queryDatabase(
  _searchType: SearchType,
  query: string,
): Promise<QuerySearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: '50',
  })

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/search?${params.toString()}`, {
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Sorgu zaman aşımına uğradı. Birkaç saniye sonra tekrar deneyin.')
    }
    throw new Error('Arama sunucusuna bağlanılamadı.')
  } finally {
    window.clearTimeout(timeout)
  }

  let data: QuerySearchResponse & { detail?: string; error?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('Arama sunucusundan geçersiz yanıt alındı.')
  }

  if (!res.ok) {
    throw new Error(data.detail ?? data.error ?? 'Sorgu başarısız.')
  }

  return data
}

export function formatSearchMessage(data: QuerySearchResponse): string {
  if (data.found <= 0) {
    return `Sonuç bulunamadı · ${data.ms}ms`
  }

  if (data.returned < data.found) {
    return `${data.found} sonuç · ${data.returned} gösteriliyor · ${data.ms}ms`
  }

  return `${data.found} sonuç bulundu · ${data.ms}ms`
}

export const RESULT_FIELD_LABELS: Record<string, string> = {
  email: 'E-posta',
  tc: 'TC Kimlik',
  sehir: 'Şehir',
  ilce: 'İlçe',
  ulke: 'Ülke',
  adres: 'Adres',
  posta_kodu: 'Posta Kodu',
  sirket: 'Şirket',
  username: 'Kullanıcı Adı',
  website: 'Web Sitesi',
}

export const RESULT_FIELD_ORDER = [
  'email',
  'tc',
  'sehir',
  'ilce',
  'ulke',
  'adres',
  'posta_kodu',
  'sirket',
  'username',
  'website',
] as const

export function phoneHref(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90')) return `tel:+${digits}`
  if (digits.startsWith('0')) return `tel:+90${digits.slice(1)}`
  if (digits.length === 10) return `tel:+90${digits}`
  return `tel:${digits}`
}
