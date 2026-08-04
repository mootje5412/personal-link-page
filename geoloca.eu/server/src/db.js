import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.GEOLOCA_DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.GEOLOCA_DB_PATH || path.join(DATA_DIR, 'geoloca.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
db.exec(schema);

const stmts = {
  findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  findUserByGoogleSub: db.prepare('SELECT * FROM users WHERE google_sub = ?'),
  createUser: db.prepare(`
    INSERT INTO users (email, name, password_hash, google_sub, avatar_url, provider)
    VALUES (@email, @name, @password_hash, @google_sub, @avatar_url, @provider)
  `),
  updateUserGoogle: db.prepare(`
    UPDATE users SET name = @name, avatar_url = @avatar_url, google_sub = @google_sub,
      provider = 'google', updated_at = datetime('now') WHERE id = @id
  `),
  createSession: db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at) VALUES (@id, @user_id, @expires_at)
  `),
  findSession: db.prepare(`
    SELECT s.id AS session_id, s.user_id, s.expires_at,
           u.id, u.email, u.name, u.avatar_url, u.provider, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `),
  deleteSession: db.prepare('DELETE FROM sessions WHERE id = ?'),
  deleteUserSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  purgeExpiredSessions: db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')"),
};

export function purgeExpiredSessions() {
  stmts.purgeExpiredSessions.run();
}

export function getUserByEmail(email) {
  return stmts.findUserByEmail.get(email) || null;
}

export function getUserById(id) {
  return stmts.findUserById.get(id) || null;
}

export function getUserByGoogleSub(sub) {
  return stmts.findUserByGoogleSub.get(sub) || null;
}

export function createUser(row) {
  const result = stmts.createUser.run(row);
  return getUserById(result.lastInsertRowid);
}

export function updateUserGoogle(id, { name, avatar_url, google_sub }) {
  stmts.updateUserGoogle.run({ id, name, avatar_url, google_sub });
  return getUserById(id);
}

export function createSession(sessionId, userId, expiresAt) {
  stmts.createSession.run({ id: sessionId, user_id: userId, expires_at: expiresAt });
}

export function getSession(sessionId) {
  return stmts.findSession.get(sessionId) || null;
}

export function deleteSession(sessionId) {
  stmts.deleteSession.run(sessionId);
}

export function deleteUserSessions(userId) {
  stmts.deleteUserSessions.run(userId);
}

export function toPublicUser(row) {
  if (!row) return null;
  const createdAt = row.created_at;
  const trialEnds = new Date(createdAt);
  trialEnds.setDate(trialEnds.getDate() + 3);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url || undefined,
    provider: row.provider,
    createdAt,
    trialEndsAt: trialEnds.toISOString(),
    trialActive: trialEnds > new Date(),
  };
}
