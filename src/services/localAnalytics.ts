import { AnalyticsSummary, SearchType } from './dashboardApi'

const KEY = 'veripanel_local_searches'

const INVALID_RECENT_QUERIES = new Set([
  'Sorgu kaydedildi',
  'Sorgu kaydedildi.',
  'Sorgu geçmişe eklendi. Bu sorgu türü henüz aktif değil.',
])

type LocalSearch = {
  type: SearchType
  query: string
  createdAt: string
}

function readLocal(): LocalSearch[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LocalSearch[]) : []
  } catch {
    return []
  }
}

function writeLocal(items: LocalSearch[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 200)))
}

function isValidSearch(item: LocalSearch) {
  return Boolean(item.query.trim()) && !INVALID_RECENT_QUERIES.has(item.query.trim())
}

function validItems(items: LocalSearch[]) {
  return items.filter(isValidSearch)
}

export function recordLocalSearch(type: SearchType, query: string) {
  const trimmed = query.trim()
  if (!trimmed || INVALID_RECENT_QUERIES.has(trimmed)) return

  const items = readLocal()
  items.unshift({ type, query: trimmed, createdAt: new Date().toISOString() })
  writeLocal(items)
  window.dispatchEvent(new CustomEvent('veripanel:search-recorded'))
}

export function getLocalAnalytics(): AnalyticsSummary {
  const items = validItems(readLocal())
  const byTypeMap = new Map<string, number>()

  for (const item of items) {
    byTypeMap.set(item.type, (byTypeMap.get(item.type) ?? 0) + 1)
  }

  return {
    total: items.length,
    today: items.filter((i) => isToday(i.createdAt)).length,
    week: items.filter((i) => isWithinDays(i.createdAt, 7)).length,
    month: items.filter((i) => isWithinDays(i.createdAt, 30)).length,
    byType: [...byTypeMap.entries()].map(([type, count]) => ({ type, count })),
    recent: items.slice(0, 3).map((i) => ({
      type: i.type,
      query: i.query,
      createdAt: i.createdAt,
    })),
  }
}

function isWithinDays(iso: string, days: number) {
  const then = new Date(iso).getTime()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return then >= cutoff
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}
