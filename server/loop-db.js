import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const uploadsDir = path.join(__dirname, 'uploads')
const dbPath = path.join(dataDir, 'loop.db')
const schemaPath = path.join(__dirname, 'loop-schema.sql')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const schema = fs.readFileSync(schemaPath, 'utf8')
db.exec(schema)

function migrateSchema() {
  const columns = db.prepare('PRAGMA table_info(loop_users)').all().map((c) => c.name)
  if (!columns.includes('phone')) {
    db.exec('ALTER TABLE loop_users ADD COLUMN phone TEXT')
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_loop_users_phone ON loop_users(phone) WHERE phone IS NOT NULL')
  }
}

migrateSchema()

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM loop_users WHERE username = ? COLLATE NOCASE').get(username)
}

export function findUserByEmail(email) {
  if (!email) return undefined
  return db.prepare('SELECT * FROM loop_users WHERE email = ? COLLATE NOCASE').get(email)
}

export function findUserByPhone(phone) {
  if (!phone) return undefined
  const normalized = phone.replace(/\D/g, '')
  return db.prepare(`
    SELECT * FROM loop_users
    WHERE phone = ? OR replace(replace(replace(phone, '-', ''), ' ', ''), '+', '') = ?
  `).get(phone, normalized)
}

export function findUserById(id) {
  return db.prepare('SELECT * FROM loop_users WHERE id = ?').get(id)
}

export function createUser({ username, displayName, email, phone, passwordHash }) {
  const stmt = db.prepare(`
    INSERT INTO loop_users (username, display_name, email, phone, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(username, displayName, email ?? null, phone ?? null, passwordHash)
  return findUserById(result.lastInsertRowid)
}

export function updateUserProfile(userId, { displayName, bio, avatarUrl }) {
  const user = findUserById(userId)
  if (!user) return null

  db.prepare(`
    UPDATE loop_users
    SET display_name = ?, bio = ?, avatar_url = ?
    WHERE id = ?
  `).run(
    displayName ?? user.display_name,
    bio ?? user.bio,
    avatarUrl ?? user.avatar_url,
    userId
  )

  return findUserById(userId)
}

export function toPublicUser(user, viewerId = null) {
  const stats = getUserStats(user.id, viewerId)
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    ...stats,
  }
}

function getUserStats(userId, viewerId) {
  const followers = db.prepare('SELECT COUNT(*) AS c FROM loop_follows WHERE following_id = ?').get(userId).c
  const following = db.prepare('SELECT COUNT(*) AS c FROM loop_follows WHERE follower_id = ?').get(userId).c
  const videos = db.prepare('SELECT COUNT(*) AS c FROM loop_videos WHERE user_id = ?').get(userId).c
  const likes = db.prepare(`
    SELECT COALESCE(SUM(likes_count), 0) AS c FROM loop_videos WHERE user_id = ?
  `).get(userId).c

  let isFollowing = false
  if (viewerId && viewerId !== userId) {
    isFollowing = !!db.prepare(
      'SELECT 1 FROM loop_follows WHERE follower_id = ? AND following_id = ?'
    ).get(viewerId, userId)
  }

  return { followers, following, videoCount: videos, totalLikes: likes, isFollowing }
}

export function getFeedVideos(viewerId = null, limit = 20, offset = 0) {
  const rows = db.prepare(`
    SELECT v.*, u.username, u.display_name, u.avatar_url
    FROM loop_videos v
    JOIN loop_users u ON u.id = v.user_id
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset)

  return rows.map((row) => toPublicVideo(row, viewerId))
}

export function getFollowingFeed(userId, limit = 20, offset = 0) {
  const rows = db.prepare(`
    SELECT v.*, u.username, u.display_name, u.avatar_url
    FROM loop_videos v
    JOIN loop_users u ON u.id = v.user_id
    WHERE v.user_id = ?
       OR v.user_id IN (SELECT following_id FROM loop_follows WHERE follower_id = ?)
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, userId, limit, offset)

  return rows.map((row) => toPublicVideo(row, userId))
}

export function getVideoById(videoId, viewerId = null) {
  const row = db.prepare(`
    SELECT v.*, u.username, u.display_name, u.avatar_url
    FROM loop_videos v
    JOIN loop_users u ON u.id = v.user_id
    WHERE v.id = ?
  `).get(videoId)
  if (!row) return null
  return toPublicVideo(row, viewerId)
}

export function getUserVideos(username, viewerId = null) {
  const rows = db.prepare(`
    SELECT v.*, u.username, u.display_name, u.avatar_url
    FROM loop_videos v
    JOIN loop_users u ON u.id = v.user_id
    WHERE u.username = ? COLLATE NOCASE
    ORDER BY v.created_at DESC
  `).all(username)

  return rows.map((row) => toPublicVideo(row, viewerId))
}

export function createVideo({ userId, caption, videoUrl, soundName }) {
  const user = findUserById(userId)
  const sound = soundName || `Original Sound — @${user.username}`
  const result = db.prepare(`
    INSERT INTO loop_videos (user_id, caption, video_url, sound_name)
    VALUES (?, ?, ?, ?)
  `).run(userId, caption || '', videoUrl, sound)

  return getVideoById(result.lastInsertRowid, userId)
}

function toPublicVideo(row, viewerId) {
  let isLiked = false
  if (viewerId) {
    isLiked = !!db.prepare(
      'SELECT 1 FROM loop_likes WHERE user_id = ? AND video_id = ?'
    ).get(viewerId, row.id)
  }

  return {
    id: row.id,
    caption: row.caption,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    soundName: row.sound_name,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    sharesCount: row.shares_count,
    createdAt: row.created_at,
    isLiked,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
  }
}

export function toggleLike(userId, videoId) {
  const existing = db.prepare(
    'SELECT 1 FROM loop_likes WHERE user_id = ? AND video_id = ?'
  ).get(userId, videoId)

  if (existing) {
    db.prepare('DELETE FROM loop_likes WHERE user_id = ? AND video_id = ?').run(userId, videoId)
    db.prepare('UPDATE loop_videos SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(videoId)
    return { liked: false }
  }

  db.prepare('INSERT INTO loop_likes (user_id, video_id) VALUES (?, ?)').run(userId, videoId)
  db.prepare('UPDATE loop_videos SET likes_count = likes_count + 1 WHERE id = ?').run(videoId)
  return { liked: true }
}

export function toggleFollow(followerId, followingId) {
  if (followerId === followingId) {
    return { following: false, error: 'Cannot follow yourself' }
  }

  const existing = db.prepare(
    'SELECT 1 FROM loop_follows WHERE follower_id = ? AND following_id = ?'
  ).get(followerId, followingId)

  if (existing) {
    db.prepare('DELETE FROM loop_follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId)
    return { following: false }
  }

  db.prepare('INSERT INTO loop_follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId)
  return { following: true }
}

export { uploadsDir }
export default db
