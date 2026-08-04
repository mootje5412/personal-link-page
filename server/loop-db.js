import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const dbPath = path.join(dataDir, 'loop.db')
const schemaPath = path.join(__dirname, 'loop-schema.sql')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const schema = fs.readFileSync(schemaPath, 'utf8')
db.exec(schema)

const SAMPLE_VIDEOS = [
  {
    caption: 'Sunset vibes never get old 🌅',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    sound_name: 'Chill Wave — LoFi Beats',
  },
  {
    caption: 'POV: you finally nailed the recipe 👨‍🍳',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    sound_name: 'Kitchen Groove',
  },
  {
    caption: 'This city at night hits different ✨',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    sound_name: 'Neon Nights',
  },
  {
    caption: 'Weekend energy activated 💃',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    sound_name: 'Weekend Anthem',
  },
  {
    caption: 'Travel tip: always pack light 🎒',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    sound_name: 'Wanderlust',
  },
  {
    caption: 'When the beat drops just right 🔥',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    sound_name: 'Original Sound — loop.creators',
  },
]

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM loop_users').get().c
  if (count > 0) return

  const creators = [
    { username: 'maya.creates', display_name: 'Maya Chen', bio: 'Digital artist & motion designer 🎨', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya' },
    { username: 'chef.alex', display_name: 'Alex Rivera', bio: 'Home cook sharing easy recipes 🍳', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
    { username: 'nightowl', display_name: 'Jordan Lee', bio: 'City lights & late night walks 🌃', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan' },
    { username: 'dancefloor', display_name: 'Sam Taylor', bio: 'Dance • Fitness • Good vibes', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam' },
    { username: 'wanderlust', display_name: 'Riley Park', bio: 'Travel clips from around the world ✈️', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=riley' },
    { username: 'loop.official', display_name: 'Loop', bio: 'Official Loop account — share your world', avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=loop' },
  ]

  const insertUser = db.prepare(`
    INSERT INTO loop_users (username, display_name, email, password_hash, bio, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertVideo = db.prepare(`
    INSERT INTO loop_videos (user_id, caption, video_url, sound_name, likes_count, comments_count, shares_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const seed = db.transaction(() => {
    creators.forEach((c, i) => {
      const result = insertUser.run(
        c.username,
        c.display_name,
        `${c.username.replace('.', '_')}@loop.app`,
        '$2a$12$seedplaceholderhashnotforlogin',
        c.bio,
        c.avatar_url
      )
      const userId = result.lastInsertRowid
      const video = SAMPLE_VIDEOS[i]
      insertVideo.run(
        userId,
        video.caption,
        video.video_url,
        video.sound_name,
        Math.floor(Math.random() * 50000) + 1000,
        Math.floor(Math.random() * 500) + 10,
        Math.floor(Math.random() * 200) + 5
      )
    })
  })

  seed()
}

seedIfEmpty()

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM loop_users WHERE username = ? COLLATE NOCASE').get(username)
}

export function findUserByEmail(email) {
  if (!email) return undefined
  return db.prepare('SELECT * FROM loop_users WHERE email = ? COLLATE NOCASE').get(email)
}

export function findUserById(id) {
  return db.prepare('SELECT * FROM loop_users WHERE id = ?').get(id)
}

export function createUser({ username, displayName, email, passwordHash }) {
  const stmt = db.prepare(`
    INSERT INTO loop_users (username, display_name, email, password_hash)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(username, displayName, email ?? null, passwordHash)
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

export default db
