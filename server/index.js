import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import {
  createUser,
  findUserByUsername,
  findUsersByKeyPrefix,
  getAnalyticsSummary,
  recordSearch,
  toPublicUser,
} from './db.js'
import {
  CURRENT_TERMS_VERSION,
  authFailureDelay,
  generateApiKey,
  getApiKeyPrefix,
  hashApiKey,
  isValidApiKeyFormat,
  verifyApiKey,
} from './authKeys.js'

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/
const SEARCH_TYPES = new Set(['tc', 'isim', 'adres', 'telefon', 'aile'])

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Oturum gerekli.' })
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET)
    req.authUser = { id: payload.sub, username: payload.username }
    return next()
  } catch {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' })
  }
}

if (JWT_SECRET === 'dev-only-change-in-production' && process.env.NODE_ENV === 'production') {
  console.error('JWT_SECRET must be set in production.')
  process.exit(1)
}

if (!process.env.KEY_PEPPER && process.env.NODE_ENV === 'production') {
  console.error('KEY_PEPPER must be set in production.')
  process.exit(1)
}

app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }))
app.use(express.json({ limit: '8kb' }))
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla deneme. Lütfen daha sonra tekrar dene.' },
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Saatlik kayıt limitine ulaşıldı. Lütfen sonra tekrar dene.' },
})

function validateRegister({ username, acceptedTerms }) {
  if (!username || !USERNAME_RE.test(username)) {
    return 'Kullanıcı adı 3-32 karakter olmalı (harf, rakam, _).'
  }
  if (!acceptedTerms) {
    return 'Devam etmek için kullanım şartlarını kabul etmelisiniz.'
  }
  return null
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, keyPrefix: user.api_key_prefix },
    JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  )
}

async function authenticateByApiKey(apiKey) {
  if (!isValidApiKeyFormat(apiKey)) {
    await authFailureDelay()
    return null
  }

  const prefix = getApiKeyPrefix(apiKey)
  const candidates = findUsersByKeyPrefix(prefix)

  for (const user of candidates) {
    const valid = await verifyApiKey(apiKey, user.api_key_hash)
    if (valid) return user
  }

  await authFailureDelay()
  return null
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/auth/terms', (_req, res) => {
  res.json({
    version: CURRENT_TERMS_VERSION,
    title: 'VeriPanel Kullanım Şartları',
    summary: 'Hesap oluşturarak bu şartları kabul etmiş olursunuz.',
  })
})

app.post('/api/auth/register', registerLimiter, authLimiter, async (req, res) => {
  try {
    const { username, acceptedTerms, termsVersion } = req.body ?? {}
    const trimmedUser = String(username ?? '').trim()
    const termsAccepted = acceptedTerms === true || acceptedTerms === 'true'

    const validationError = validateRegister({
      username: trimmedUser,
      acceptedTerms: termsAccepted,
    })
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    if (termsVersion && termsVersion !== CURRENT_TERMS_VERSION) {
      return res.status(400).json({ error: 'Güncel kullanım şartlarını kabul edin.' })
    }

    if (findUserByUsername(trimmedUser)) {
      return res.status(409).json({ error: 'Bu kullanıcı adı alınmış.' })
    }

    const apiKey = generateApiKey()
    const apiKeyHash = await hashApiKey(apiKey)
    const apiKeyPrefix = getApiKeyPrefix(apiKey)

    const user = createUser({
      username: trimmedUser,
      email: null,
      apiKeyHash,
      apiKeyPrefix,
      termsVersion: CURRENT_TERMS_VERSION,
    })

    const token = signToken({ ...user, api_key_prefix: apiKeyPrefix })

    return res.status(201).json({
      user: toPublicUser({ ...user, api_key_prefix: apiKeyPrefix }),
      apiKey,
      token,
      message: 'API anahtarınız yalnızca bir kez gösterilir. Güvenli bir yerde saklayın.',
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Kayıt sırasında hata oluştu.' })
  }
})

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { apiKey } = req.body ?? {}
    const trimmedKey = String(apiKey ?? '').trim()

    if (!trimmedKey) {
      return res.status(400).json({ error: 'API anahtarı gerekli.' })
    }

    const user = await authenticateByApiKey(trimmedKey)
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz API anahtarı.' })
    }

    const token = signToken(user)
    return res.json({
      user: toPublicUser(user),
      token,
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Giriş sırasında hata oluştu.' })
  }
})

app.get('/api/analytics/summary', authMiddleware, (req, res) => {
  try {
    const summary = getAnalyticsSummary(req.authUser.id)
    return res.json(summary)
  } catch (err) {
    console.error('Analytics error:', err)
    return res.status(500).json({ error: 'Analitik verileri alınamadı.' })
  }
})

app.post('/api/search', authMiddleware, (req, res) => {
  try {
    const { searchType, query } = req.body ?? {}
    const type = String(searchType ?? '').trim().toLowerCase()
    const trimmedQuery = String(query ?? '').trim()

    if (!SEARCH_TYPES.has(type)) {
      return res.status(400).json({ error: 'Geçersiz sorgu türü.' })
    }

    if (!trimmedQuery || trimmedQuery.length > 120) {
      return res.status(400).json({ error: 'Geçerli bir sorgu girin.' })
    }

    const preview = trimmedQuery.length > 48 ? `${trimmedQuery.slice(0, 48)}…` : trimmedQuery
    recordSearch({
      userId: req.authUser.id,
      searchType: type,
      queryPreview: preview,
    })

    return res.json({
      ok: true,
      message: 'Sorgu tamamlandı.',
      result: {
        type,
        query: preview,
        durationMs: Math.floor(Math.random() * 400) + 120,
      },
    })
  } catch (err) {
    console.error('Search error:', err)
    return res.status(500).json({ error: 'Sorgu sırasında hata oluştu.' })
  }
})

app.listen(PORT, () => {
  console.log(`VeriPanel auth API http://localhost:${PORT}`)
})
