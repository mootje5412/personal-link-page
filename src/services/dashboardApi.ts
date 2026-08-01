import { authFetch } from './apiClient'

export type SearchType = 'tc' | 'isim' | 'adres' | 'telefon' | 'aile'

export type AnalyticsSummary = {
  total: number
  today: number
  week: number
  month: number
  byType: Array<{ type: string; count: number }>
  recent: Array<{ type: string; query: string; createdAt: string }>
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  return authFetch('/api/analytics/summary') as Promise<AnalyticsSummary>
}

export async function performSearch(searchType: SearchType, query: string) {
  return authFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({ searchType, query }),
  })
}

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  tc: 'TC Kimlik',
  isim: 'İsim',
  adres: 'Adres',
  telefon: 'Telefon',
  aile: 'Aile',
}
