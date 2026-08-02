import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabaseStats, getLineStats, searchDatabases, clearCache } from './lib/searchEngine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = __dirname
const PORT = Number(process.env.PORT || 8080)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'VeriPanel Search API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      search: '/api/search?q=QUERY',
      database: '/api/database',
    },
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'ready',
  })
})

app.get('/api/stats', (_req, res) => {
  const started = performance.now()
  const stats = getLineStats(ROOT_DIR)
  res.json({
    ...stats,
    ms: Number((performance.now() - started).toFixed(2)),
  })
})

app.get('/api/database', (_req, res) => {
  const stats = getDatabaseStats(ROOT_DIR)
  res.json({
    ok: true,
    database: {
      total_records: stats.total_records,
      status: stats.status,
    },
  })
})

app.get('/api/search', (req, res) => {
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

app.post('/api/reload', (_req, res) => {
  clearCache()
  res.json({
    ok: true,
    message: 'Cache cleared and databases reloaded',
    database: {
      total_records: getDatabaseStats(ROOT_DIR).total_records,
      status: 'ready',
    },
  })
})

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Search API listening on http://0.0.0.0:${PORT}`)
})
