import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabaseStats, searchDatabases, clearCache } from './lib/searchEngine.js'
import { getDatabasesDir, listDatabaseFiles } from './lib/fileWalker.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = __dirname
const PORT = Number(process.env.PORT || 8080)
const API_KEY = process.env.API_KEY || 'z2GFltjwp4rgccrOJdtc'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

function verifyKey(req, res, next) {
  const key = req.query.key || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (key !== API_KEY) {
    return res.status(401).json({ ok: false, error: 'Invalid or missing API key' })
  }
  return next()
}

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'VeriPanel Search API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      files: '/api/files?key=YOUR_KEY',
      search: '/api/search?q=QUERY&key=YOUR_KEY',
      database: '/api/database?key=YOUR_KEY',
    },
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'ready',
    databases_dir: getDatabasesDir(ROOT_DIR),
    files: listDatabaseFiles(ROOT_DIR).length,
  })
})

app.get('/api/files', verifyKey, (_req, res) => {
  res.json(getDatabaseStats(ROOT_DIR))
})

app.get('/api/database', verifyKey, (_req, res) => {
  const stats = getDatabaseStats(ROOT_DIR)
  res.json({
    ok: true,
    database: {
      total_files: stats.total_files,
      total_records: stats.total_records,
      status: 'ready',
    },
    files: stats.files,
  })
})

app.get('/api/search', verifyKey, (req, res) => {
  const started = performance.now()
  const limit = Math.min(Number(req.query.limit || 50), 200)
  const result = searchDatabases(req.query.q, { limit, rootDir: ROOT_DIR })

  if (!result.ok) {
    return res.status(400).json(result)
  }

  res.json({
    ...result,
    ms: Number((performance.now() - started).toFixed(2)),
  })
})

app.post('/api/reload', verifyKey, (_req, res) => {
  clearCache()
  const stats = getDatabaseStats(ROOT_DIR)
  res.json({ ok: true, message: 'Cache cleared and databases reloaded', ...stats })
})

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Search API listening on http://0.0.0.0:${PORT}`)
  console.log(`Databases folder: ${getDatabasesDir(ROOT_DIR)}`)
})
