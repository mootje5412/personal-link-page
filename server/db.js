import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'apex_users.db')
const schemaPath = path.join(__dirname, 'schema.sql')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

try {
  fs.chmodSync(dbPath, 0o600)
} catch {
  // chmod may fail on some platforms before first write
}

const schema = fs.readFileSync(schemaPath, 'utf8')
db.exec(schema)

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username)
}

export function findUserByEmail(email) {
  if (!email) return undefined
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email)
}

export function createUser(username, email, passwordHash) {
  const stmt = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  )
  const result = stmt.run(username, email ?? null, passwordHash)
  return db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)
}

export default db
