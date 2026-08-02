import { listDatabaseFiles, resolveDatabasePath } from './fileWalker.js'
import { parseFile } from './parsers.js'

const cache = {
  loadedAt: 0,
  records: [],
  files: [],
}

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 30000)

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

export function loadAllRecords(rootDir = process.cwd(), force = false) {
  const now = Date.now()
  if (!force && cache.records.length > 0 && now - cache.loadedAt < CACHE_TTL_MS) {
    return cache
  }

  const files = listDatabaseFiles(rootDir)
  const records = []
  const fileStats = []

  for (const file of files) {
    try {
      const fullPath = resolveDatabasePath(file.path, rootDir)
      const parsed = parseFile(fullPath)
      records.push(...parsed)
      fileStats.push({ ...file, records: parsed.length, status: 'ok' })
    } catch (error) {
      fileStats.push({ ...file, records: 0, status: 'error', error: error.message })
    }
  }

  cache.loadedAt = now
  cache.records = records
  cache.files = fileStats
  return cache
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

  const { records, files } = loadAllRecords(rootDir)
  const needles = buildNeedles(trimmed)
  const matches = []

  for (const record of records) {
    if (!recordMatches(record, needles)) continue
    matches.push({
      source_file: record.source_file,
      row_index: record.row_index,
      match: record.fields,
    })
    if (matches.length >= limit) break
  }

  return {
    ok: true,
    query: trimmed,
    found: matches.length,
    returned: matches.length,
    total_records: records.length,
    files_indexed: files.filter((f) => f.status === 'ok').length,
    results: matches,
  }
}

export function getDatabaseStats(rootDir = process.cwd()) {
  const { records, files } = loadAllRecords(rootDir)
  return {
    ok: true,
    total_files: files.length,
    total_records: records.length,
    files,
  }
}

export function clearCache() {
  cache.loadedAt = 0
  cache.records = []
  cache.files = []
}
