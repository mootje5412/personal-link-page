import { listDatabaseFiles, resolveDatabasePath } from './fileWalker.js'
import { indexFile } from './parsers.js'
import { formatClearResult } from './clearFields.js'

const cache = {
  fingerprint: '',
  loadedAt: 0,
  records: [],
  stats: {
    total_lines: 0,
    total_data_lines: 0,
    indexed_records: 0,
    status: 'ready',
  },
}

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 300000)

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function buildNeedles(query) {
  const trimmed = query.trim()
  const lower = trimmed.toLowerCase()
  const digits = digitsOnly(trimmed)
  const needles = [lower]
  if (digits.length >= 3) needles.push(digits)
  return [...new Set(needles.filter(Boolean))]
}

function recordMatches(record, needles) {
  for (const needle of needles) {
    if (record.text.includes(needle)) return true
    for (const value of Object.values(record.fields)) {
      if (digitsOnly(value).includes(needle)) return true
    }
  }
  return false
}

function buildFingerprint(rootDir) {
  return listDatabaseFiles(rootDir)
    .map((file) => `${file.path}:${file.modified_at}:${file.size_bytes}`)
    .join('|')
}

function rebuildIndex(rootDir) {
  const files = listDatabaseFiles(rootDir)
  const records = []
  let total_lines = 0
  let total_data_lines = 0

  for (const file of files) {
    try {
      const fullPath = resolveDatabasePath(file.path, rootDir)
      const indexed = indexFile(fullPath, file.extension)
      for (const record of indexed.records) {
        records.push(record)
      }
      total_lines += indexed.total_lines
      total_data_lines += indexed.total_data_lines
    } catch (error) {
      console.error(`Failed to index ${file.path}: ${error.message}`)
    }
  }

  cache.fingerprint = buildFingerprint(rootDir)
  cache.loadedAt = Date.now()
  cache.records = records
  cache.stats = {
    total_lines,
    total_data_lines,
    indexed_records: records.length,
    status: 'ready',
  }

  return cache
}

export function loadAllRecords(rootDir = process.cwd(), force = false) {
  const fingerprint = buildFingerprint(rootDir)
  const now = Date.now()
  const cacheValid =
    !force &&
    cache.fingerprint === fingerprint &&
    cache.loadedAt > 0 &&
    now - cache.loadedAt < CACHE_TTL_MS

  if (!cacheValid) {
    rebuildIndex(rootDir)
  }

  return cache
}

export function getLineStats(rootDir = process.cwd()) {
  const { stats } = loadAllRecords(rootDir)
  return {
    ok: true,
    stats,
  }
}

export function searchDatabases(query, options = {}) {
  const { limit = 50, rootDir = process.cwd() } = options
  const trimmed = String(query ?? '').trim()

  if (!trimmed) {
    return {
      ok: false,
      error: 'Query parameter q is required',
      found: 0,
      returned: 0,
      results: [],
    }
  }

  const { records } = loadAllRecords(rootDir)
  const needles = buildNeedles(trimmed)
  const matches = []

  for (const record of records) {
    if (!recordMatches(record, needles)) continue
    matches.push({
      row: record.row_index,
      ...formatClearResult(record.fields),
    })
    if (matches.length >= limit) break
  }

  return {
    ok: true,
    query: trimmed,
    found: matches.length,
    returned: matches.length,
    results: matches,
  }
}

export function getDatabaseStats(rootDir = process.cwd()) {
  const { stats } = loadAllRecords(rootDir)
  return {
    ok: true,
    total_records: stats.indexed_records,
    status: stats.status,
  }
}

export function clearCache() {
  cache.fingerprint = ''
  cache.loadedAt = 0
  cache.records = []
  cache.stats = {
    total_lines: 0,
    total_data_lines: 0,
    indexed_records: 0,
    status: 'ready',
  }
}

export function startAutoRescan(rootDir = process.cwd(), intervalMs = Number(process.env.RESCAN_MS || 15000)) {
  setInterval(() => {
    const fingerprint = buildFingerprint(rootDir)
    if (fingerprint !== cache.fingerprint) {
      console.log('Database files changed, rebuilding index...')
      rebuildIndex(rootDir)
      console.log(`Index rebuilt: ${cache.stats.indexed_records} records`)
    }
  }, intervalMs).unref()
}
