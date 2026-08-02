export type DatabaseSummary = {
  total_lines: number | null
  total_data_lines: number | null
  total_size_mb: number
  indexed_records: number
  index_ready: boolean
  index_building: boolean
  auto_watch: boolean
  status: 'ready' | 'indexing' | 'starting'
}

type StatsResponse = {
  ok: boolean
  stats: {
    total_lines: number
    total_data_lines: number
    indexed_records: number
    status: 'ready' | 'indexing' | 'starting'
  }
  ms: number
}

const API_BASE = '/phone-api'

export async function fetchDatabaseStats(): Promise<DatabaseSummary> {
  const res = await fetch(`${API_BASE}/api/stats`)

  let data: StatsResponse & { detail?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('Veritabanı istatistikleri alınamadı.')
  }

  if (!res.ok) {
    throw new Error(data.detail ?? 'Veritabanı istatistikleri alınamadı.')
  }

  const status = data.stats.status ?? 'starting'

  return {
    total_lines: data.stats.total_lines ?? null,
    total_data_lines: data.stats.total_data_lines ?? null,
    total_size_mb: 0,
    indexed_records: data.stats.indexed_records ?? 0,
    index_ready: status === 'ready' || (data.stats.indexed_records ?? 0) > 0,
    index_building: status === 'indexing',
    auto_watch: true,
    status: (data.stats.indexed_records ?? 0) > 0 && status === 'starting' ? 'ready' : status,
  }
}

export function formatCount(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('tr-TR').format(value)
}

export function databaseStatusLabel(status: DatabaseSummary['status'], building: boolean): string {
  if (building || status === 'indexing') return 'İndeksleniyor'
  if (status === 'ready') return 'Hazır'
  return 'Başlatılıyor'
}
