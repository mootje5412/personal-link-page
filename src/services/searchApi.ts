import { SearchType } from './dashboardApi'

export type SearchResult = {
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string
  identity_number: string
  city: string
  country: string
  notes: string
  extra?: Record<string, unknown>
}

export type QuerySearchResponse = {
  ok: boolean
  success?: boolean
  message?: string
  found: number
  returned: number
  results: SearchResult[]
  ms: number
  ready?: boolean
  detail?: string
}

const API_BASE = '/phone-api'
const API_KEY = 'z2GFltjwp4rgccrOJdtc'
const REQUEST_TIMEOUT_MS = 15000

export async function queryDatabase(
  searchType: SearchType,
  query: string,
): Promise<QuerySearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    type: searchType,
    key: API_KEY,
  })

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/query?${params.toString()}`, {
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Sorgu zaman aşımına uğradı. Veritabanı indeksleniyor olabilir — birkaç dakika sonra tekrar deneyin.')
    }
    throw new Error('Arama sunucusuna bağlanılamadı.')
  } finally {
    window.clearTimeout(timeout)
  }

  let data: QuerySearchResponse & { detail?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('Arama sunucusundan geçersiz yanıt alındı.')
  }

  if (!res.ok) {
    throw new Error(data.detail ?? 'Sorgu başarısız.')
  }

  return data
}

export function formatSearchMessage(data: QuerySearchResponse): string {
  const resultPart =
    data.found > 0
      ? `${data.found} sonuç bulundu`
      : 'Sonuç bulunamadı'

  return `${resultPart} · ${data.ms}ms`
}
