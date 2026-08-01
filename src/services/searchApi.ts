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

export async function queryDatabase(
  searchType: SearchType,
  query: string,
): Promise<QuerySearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    type: searchType,
    key: API_KEY,
  })

  const res = await fetch(`${API_BASE}/api/query?${params.toString()}`)

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

  return `${resultPart} · Sorgu kaydedildi · ${data.ms}ms`
}
