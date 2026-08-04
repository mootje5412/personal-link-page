import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  getFeedVideos,
  getUserVideos,
  toPublicUser,
  toggleFollow,
  toggleLike,
  updateUserProfile,
} from './loop-db.js'

const app = express()
const PORT = process.env.LOOP_PORT || process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'loop-dev-secret-change-in-production'

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,24}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET)
      req.authUser = { id: payload.sub, username: payload.username }
    } catch {
      // ignore invalid token for optional routes
    }
  }
  next()
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please log in to continue.' })
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.authUser = { id: payload.sub, username: payload.username }
    return next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d', algorithm: 'HS256' }
  )
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json({ limit: '16kb' }))
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://109.71.252.128',
    'http://109.71.252.128',
  ],
  credentials: true,
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'loop' })
})

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body ?? {}
    const trimmedUser = String(username ?? '').trim().toLowerCase()
    const trimmedDisplay = String(displayName ?? '').trim()
    const trimmedEmail = email ? String(email).trim().toLowerCase() : null
    const trimmedPass = String(password ?? '')

    if (!USERNAME_RE.test(trimmedUser)) {
      return res.status(400).json({ error: 'Username must be 3-24 characters (letters, numbers, _, .).' })
    }
    if (!trimmedDisplay || trimmedDisplay.length > 50) {
      return res.status(400).json({ error: 'Display name is required (max 50 characters).' })
    }
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address.' })
    }
    if (trimmedPass.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }

    if (findUserByUsername(trimmedUser)) {
      return res.status(409).json({ error: 'Username is already taken.' })
    }
    if (trimmedEmail && findUserByEmail(trimmedEmail)) {
      return res.status(409).json({ error: 'Email is already registered.' })
    }

    const passwordHash = await bcrypt.hash(trimmedPass, 12)
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedUser)}&backgroundColor=000000&textColor=ffffff`

    const user = createUser({
      username: trimmedUser,
      displayName: trimmedDisplay,
      email: trimmedEmail,
      passwordHash,
    })

    dbUpdateAvatar(user.id, avatarUrl)

    const fullUser = findUserById(user.id)
    const token = signToken(fullUser)

    return res.status(201).json({
      user: toPublicUser(fullUser),
      token,
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Registration failed.' })
  }
})

function dbUpdateAvatar(userId, avatarUrl) {
  updateUserProfile(userId, { avatarUrl })
}

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { login, password } = req.body ?? {}
    const trimmedLogin = String(login ?? '').trim()
    const trimmedPass = String(password ?? '')

    if (!trimmedLogin || !trimmedPass) {
      return res.status(400).json({ error: 'Username/email and password are required.' })
    }

    const user = trimmedLogin.includes('@')
      ? findUserByEmail(trimmedLogin.toLowerCase())
      : findUserByUsername(trimmedLogin)

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    const valid = await bcrypt.compare(trimmedPass, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    const token = signToken(user)
    return res.json({
      user: toPublicUser(user),
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Login failed.' })
  }
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = findUserById(req.authUser.id)
  if (!user) return res.status(404).json({ error: 'User not found.' })
  return res.json({ user: toPublicUser(user) })
})

app.patch('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body ?? {}

    if (displayName !== undefined) {
      const trimmed = String(displayName).trim()
      if (!trimmed || trimmed.length > 50) {
        return res.status(400).json({ error: 'Display name must be 1-50 characters.' })
      }
    }
    if (bio !== undefined && String(bio).length > 160) {
      return res.status(400).json({ error: 'Bio must be 160 characters or less.' })
    }

    const updated = updateUserProfile(req.authUser.id, {
      displayName: displayName !== undefined ? String(displayName).trim() : undefined,
      bio: bio !== undefined ? String(bio).trim() : undefined,
      avatarUrl: avatarUrl !== undefined ? String(avatarUrl).trim() : undefined,
    })

    if (!updated) return res.status(404).json({ error: 'User not found.' })
    return res.json({ user: toPublicUser(updated) })
  } catch (err) {
    console.error('Profile update error:', err)
    return res.status(500).json({ error: 'Could not update profile.' })
  }
})

app.get('/api/videos/feed', optionalAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50)
  const offset = parseInt(req.query.offset, 10) || 0
  const viewerId = req.authUser?.id ?? null
  const videos = getFeedVideos(viewerId, limit, offset)
  return res.json({ videos })
})

app.get('/api/users/:username', optionalAuth, (req, res) => {
  const user = findUserByUsername(req.params.username)
  if (!user) return res.status(404).json({ error: 'User not found.' })
  const viewerId = req.authUser?.id ?? null
  const videos = getUserVideos(user.username, viewerId)
  return res.json({
    user: toPublicUser(user, viewerId),
    videos,
  })
})

app.post('/api/videos/:id/like', authMiddleware, (req, res) => {
  const videoId = parseInt(req.params.id, 10)
  if (!videoId) return res.status(400).json({ error: 'Invalid video.' })
  const result = toggleLike(req.authUser.id, videoId)
  return res.json(result)
})

app.post('/api/users/:username/follow', authMiddleware, (req, res) => {
  const target = findUserByUsername(req.params.username)
  if (!target) return res.status(404).json({ error: 'User not found.' })
  const result = toggleFollow(req.authUser.id, target.id)
  if (result.error) return res.status(400).json({ error: result.error })
  return res.json(result)
})

app.listen(PORT, () => {
  console.log(`Loop API running at http://localhost:${PORT}`)
})
