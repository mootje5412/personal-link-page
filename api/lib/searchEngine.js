import { listDatabaseFiles, resolveDatabasePath } from './fileWalker.js'
import { indexFile } from './parsers.js'
import { formatClearResult } from './clearFields.js'
import { buildPhoneSearchVariants, digitsOnly } from './phoneUtils.js'

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
let rebuildPromise = null

function scheduleRebuild(rootDir, reason = 'refresh') {
  if (rebuildPromise) return rebuildPromise

  if (cache.loadedAt > 0) {
    cache.stats = { ...cache.stats, status: 'indexing' }
  }

  rebuildPromise = Promise.resolve()
    .then(() => {
      console.log(`Rebuilding index (${reason})...`)
      rebuildIndex(rootDir)
      console.log(`Index ready: ${cache.stats.indexed_records} records`)
    })
    .catch((error) => {
      console.error(`Index rebuild failed: ${error.message}`)
      cache.stats = { ...cache.stats, status: 'starting' }
    })
    .finally(() => {
      rebuildPromise = null
    })

  return rebuildPromise
}

function cacheIsFresh(rootDir) {
  if (cache.loadedAt <= 0) return false
  if (Date.now() - cache.loadedAt >= CACHE_TTL_MS) return false
  return cache.fingerprint === buildFingerprint(rootDir)
}

function buildNeedles(query) {
  const trimmed = query.trim()
  const lower = trimmed.toLowerCase()
  const needles = new Set([lower])

  const digits = digitsOnly(trimmed)
  if (digits.length >= 3) {
    needles.add(digits)
    for (const variant of buildPhoneSearchVariants(trimmed)) {
      needles.add(variant)
    }
  }

  return [...needles].filter(Boolean)
}

function recordMatches(record, needles) {
  for (const needle of needles) {
    if (record.text.includes(needle)) return true
    if (record.phone_text?.includes(needle)) return true
    for (const value of Object.values(record.fields)) {
      const valueDigits = digitsOnly(value)
      if (valueDigits.includes(needle)) return true
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
  if (!force && cacheIsFresh(rootDir)) {
    return cache
  }

  const fingerprint = buildFingerprint(rootDir)
  if (!force && cache.loadedAt > 0 && cache.fingerprint === fingerprint) {
    return cache
  }

  if (!force && cache.loadedAt > 0) {
    scheduleRebuild(rootDir, 'stale-cache')
    return cache
  }

  if (rebuildPromise) {
    return cache
  }

  rebuildIndex(rootDir)
  return cache
}

export function getLineStats(rootDir = process.cwd()) {
  if (cache.loadedAt > 0) {
    const fingerprint = buildFingerprint(rootDir)
    if (fingerprint !== cache.fingerprint || Date.now() - cache.loadedAt >= CACHE_TTL_MS) {
      scheduleRebuild(rootDir, 'stats-refresh')
    }
    return {
      ok: true,
      stats: cache.stats,
    }
  }

  scheduleRebuild(rootDir, 'cold-start')
  return {
    ok: true,
    stats: {
      total_lines: 0,
      total_data_lines: 0,
      indexed_records: 0,
      status: 'starting',
    },
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
  let totalFound = 0

  for (const record of records) {
    if (!recordMatches(record, needles)) continue
    totalFound += 1
    if (matches.length >= limit) continue
    matches.push({
      row: record.row_index,
      ...formatClearResult(record.fields),
    })
  }

  return {
    ok: true,
    query: trimmed,
    found: totalFound,
    returned: matches.length,
    results: matches,
  }
}

export function getDatabaseStats(rootDir = process.cwd()) {
  const { stats } = getLineStats(rootDir)
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
      scheduleRebuild(rootDir, 'file-change')
    }
  }, intervalMs).unref()
}
