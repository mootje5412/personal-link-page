import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, findUserByUsername } from './db.js'

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production'
const BCRYPT_ROUNDS = 12

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

app.use(helmet())
app.use(express.json({ limit: '16kb' }))
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme. Lütfen daha sonra tekrar dene.' },
})

function validateRegister({ username, password, email }) {
  if (!username || !USERNAME_RE.test(username)) {
    return 'Kullanıcı adı 3-32 karakter olmalı (harf, rakam, _).'
  }
  if (!password || password.length < 8) {
    return 'Şifre en az 8 karakter olmalı.'
  }
  if (email !== undefined && email !== null && email !== '') {
    if (!EMAIL_RE.test(email)) {
      return 'Geçerli bir e-posta gir.'
    }
  }
  return null
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body ?? {}
    const trimmedUser = String(username ?? '').trim()
    const trimmedEmail = email ? String(email).trim().toLowerCase() : null

    const validationError = validateRegister({
      username: trimmedUser,
      password,
      email: trimmedEmail,
    })
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    if (findUserByUsername(trimmedUser)) {
      return res.status(409).json({ error: 'Bu kullanıcı adı alınmış.' })
    }

    if (trimmedEmail && findUserByEmail(trimmedEmail)) {
      return res.status(409).json({ error: 'Bu e-posta kayıtlı.' })
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = createUser(trimmedUser, trimmedEmail, passwordHash)
    const token = signToken(user)

    return res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Kayıt sırasında hata oluştu.' })
  }
})

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    const trimmedUser = String(username ?? '').trim()

    if (!trimmedUser || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' })
    }

    const user = findUserByUsername(trimmedUser)
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' })
    }

    const token = signToken(user)
    return res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Giriş sırasında hata oluştu.' })
  }
})

app.listen(PORT, () => {
  console.log(`Apex auth API http://localhost:${PORT}`)
})
