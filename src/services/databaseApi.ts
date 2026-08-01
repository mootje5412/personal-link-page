export type DatabaseSummary = {
  files: number
  total_lines: number | null
  total_data_lines: number | null
  total_size_mb: number
  indexed_records: number
  pending_files: number
  index_ready: boolean
  index_building: boolean
  auto_watch: boolean
  status: 'ready' | 'indexing' | 'starting'
}

export type DatabaseResponse = {
  ok: boolean
  database: DatabaseSummary
  ms: number
}

const API_BASE = '/phone-api'
const API_KEY = 'z2GFltjwp4rgccrOJdtc'

export async function fetchDatabaseStats(): Promise<DatabaseSummary> {
  const params = new URLSearchParams({ key: API_KEY })
  const res = await fetch(`${API_BASE}/api/database?${params.toString()}`)

  let data: DatabaseResponse & { detail?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('Veritabanı istatistikleri alınamadı.')
  }

  if (!res.ok) {
    throw new Error(data.detail ?? 'Veritabanı istatistikleri alınamadı.')
  }

  return data.database
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
