import { listDatabaseFiles, resolveDatabasePath } from './fileWalker.js'
import { indexFile } from './parsers.js'
import { formatClearResult } from './clearFields.js'
import { normalizeSearchType, recordMatchesType, validateQuery } from './searchMatcher.js'

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

function buildFingerprint(rootDir) {
  return listDatabaseFiles(rootDir)
    .map((file) => `${file.path}:${file.modified_at}:${file.size_bytes}`)
    .join('|')
}

function rebuildIndex(rootDir) {
  cache.records = []

  const files = listDatabaseFiles(rootDir)
    .sort((a, b) => {
      const rank = (ext) => (ext === '.sql' ? 1 : 0)
      return rank(a.extension) - rank(b.extension) || a.path.localeCompare(b.path)
    })

  let total_lines = 0
  let total_data_lines = 0

  for (const file of files) {
    try {
      const fullPath = resolveDatabasePath(file.path, rootDir)
      const indexed = indexFile(fullPath, file.extension)
      for (const record of indexed.records) {
        cache.records.push(record)
      }
      total_lines += indexed.total_lines
      total_data_lines += indexed.total_data_lines
      console.log(`Indexed ${file.path}: ${indexed.total_data_lines} records`)
    } catch (error) {
      console.error(`Failed to index ${file.path}: ${error.message}`)
    }
  }

  cache.fingerprint = buildFingerprint(rootDir)
  cache.loadedAt = Date.now()
  cache.stats = {
    total_lines,
    total_data_lines,
    indexed_records: cache.records.length,
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
    if (Date.now() - cache.loadedAt >= CACHE_TTL_MS) {
      cache.loadedAt = Date.now()
    }
    return cache
  }

  if (!force && cache.loadedAt > 0) {
    scheduleRebuild(rootDir, 'file-change')
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
    if (fingerprint !== cache.fingerprint) {
      scheduleRebuild(rootDir, 'file-change')
    } else if (Date.now() - cache.loadedAt >= CACHE_TTL_MS) {
      cache.loadedAt = Date.now()
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
  const {
    limit = 50,
    stopAfterLimit = false,
    rootDir = process.cwd(),
    type = 'telefon',
  } = options
  const trimmed = String(query ?? '').trim()
  const searchType = normalizeSearchType(type)
  const validationError = validateQuery(searchType, trimmed)

  if (!trimmed) {
    return {
      ok: false,
      error: 'Query parameter q is required',
      type: searchType,
      found: 0,
      foundExact: true,
      returned: 0,
      results: [],
    }
  }

  if (validationError) {
    return {
      ok: false,
      error: validationError,
      type: searchType,
      found: 0,
      foundExact: true,
      returned: 0,
      results: [],
    }
  }

  const { records } = loadAllRecords(rootDir)
  const matches = []
  let totalFound = 0
  let foundExact = true

  for (const record of records) {
    if (!recordMatchesType(record, searchType, trimmed)) continue
    totalFound += 1

    if (matches.length < limit) {
      matches.push({
        row: record.row_index,
        ...formatClearResult(record.fields),
      })
    }

    if (stopAfterLimit && matches.length >= limit) {
      foundExact = false
      break
    }
  }

  return {
    ok: true,
    type: searchType,
    query: trimmed,
    found: foundExact ? totalFound : matches.length,
    foundExact,
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
