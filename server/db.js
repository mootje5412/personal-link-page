import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'veripanel_users.db')
const schemaPath = path.join(__dirname, 'schema.sql')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

try {
  if (fs.existsSync(dbPath)) {
    fs.chmodSync(dbPath, 0o600)
  }
} catch {
  // chmod may fail on some platforms before first write
}

const schema = fs.readFileSync(schemaPath, 'utf8')
db.exec(schema)

function migrateLegacySchema() {
  const columns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name)

  if (columns.includes('password_hash') && !columns.includes('api_key_hash')) {
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email TEXT UNIQUE,
        api_key_hash TEXT NOT NULL,
        api_key_prefix TEXT NOT NULL,
        terms_accepted_at TEXT NOT NULL,
        terms_version TEXT NOT NULL DEFAULT '1.0',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_api_key_prefix ON users(api_key_prefix);
    `)
  }
}

migrateLegacySchema()

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username)
}

export function findUserByEmail(email) {
  if (!email) return undefined
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email)
}

export function findUsersByKeyPrefix(prefix) {
  return db.prepare('SELECT * FROM users WHERE api_key_prefix = ?').all(prefix)
}

export function createUser({ username, email, apiKeyHash, apiKeyPrefix, termsVersion }) {
  const termsAcceptedAt = new Date().toISOString()
  const stmt = db.prepare(`
    INSERT INTO users (username, email, api_key_hash, api_key_prefix, terms_accepted_at, terms_version)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    username,
    email ?? null,
    apiKeyHash,
    apiKeyPrefix,
    termsAcceptedAt,
    termsVersion
  )
  return db.prepare(`
    SELECT id, username, email, api_key_prefix, terms_accepted_at, terms_version, created_at
    FROM users WHERE id = ?
  `).get(result.lastInsertRowid)
}

export function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    keyPrefix: user.api_key_prefix,
    createdAt: user.created_at,
  }
}

export function recordSearch({ userId, searchType, queryPreview }) {
  const stmt = db.prepare(`
    INSERT INTO search_logs (user_id, search_type, query_preview)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(userId, searchType, queryPreview)
  return db.prepare('SELECT * FROM search_logs WHERE id = ?').get(result.lastInsertRowid)
}

export function getAnalyticsSummary(userId) {
  const total = db.prepare('SELECT COUNT(*) AS count FROM search_logs WHERE user_id = ?').get(userId).count

  const today = db.prepare(`
    SELECT COUNT(*) AS count FROM search_logs
    WHERE user_id = ? AND date(created_at) = date('now')
  `).get(userId).count

  const week = db.prepare(`
    SELECT COUNT(*) AS count FROM search_logs
    WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
  `).get(userId).count

  const month = db.prepare(`
    SELECT COUNT(*) AS count FROM search_logs
    WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
  `).get(userId).count

  const byType = db.prepare(`
    SELECT search_type AS type, COUNT(*) AS count
    FROM search_logs
    WHERE user_id = ?
    GROUP BY search_type
    ORDER BY count DESC
  `).all(userId)

  const recent = db.prepare(`
    SELECT search_type AS type, query_preview AS query, created_at AS createdAt
    FROM search_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 8
  `).all(userId)

  return { total, today, week, month, byType, recent }
}

export default db
