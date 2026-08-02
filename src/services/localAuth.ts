import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import type { AuthResponse, AuthUser, RegisterResponse } from './authTypes'

const REGISTRY_KEY = 'veripanel_users_registry'
const PBKDF2_ITERATIONS = 120_000

type StoredUser = {
  id: number
  username: string
  apiKeyHash: string
  apiKeyPrefix: string
  createdAt: string
}

function readRegistry(): StoredUser[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeRegistry(users: StoredUser[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(users))
}

function bufToBase64(buf: Uint8Array) {
  return btoa(String.fromCharCode(...buf))
}

function base64ToBuf(b64: string) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function deriveKeyBytes(apiKey: string, salt: Uint8Array): Uint8Array {
  return pbkdf2(sha256, new TextEncoder().encode(apiKey), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  })
}

async function hashApiKey(apiKey: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derived = deriveKeyBytes(apiKey, salt)
  return `pbkdf2:${bufToBase64(salt)}:${bufToBase64(derived)}`
}

async function verifyApiKey(apiKey: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith('pbkdf2:')) return false

  const [, saltB64, hashB64] = storedHash.split(':')
  if (!saltB64 || !hashB64) return false

  const salt = base64ToBuf(saltB64)
  const expected = base64ToBuf(hashB64)
  const derived = deriveKeyBytes(apiKey, salt)

  if (derived.length !== expected.length) return false

  let match = 0
  for (let i = 0; i < derived.length; i += 1) {
    match |= derived[i] ^ expected[i]
  }
  return match === 0
}

function generateApiKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const secret = bufToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `vp_${secret}`
}

function getKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 12)
}

function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: null,
    keyPrefix: user.apiKeyPrefix,
    createdAt: user.createdAt,
  }
}

function createToken(user: StoredUser) {
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`
  return `local_${user.id}_${id}`
}

export async function localRegister(username: string): Promise<RegisterResponse> {
  const trimmed = username.trim()
  const users = readRegistry()

  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Bu kullanıcı adı alınmış.')
  }

  const apiKey = generateApiKey()
  const apiKeyHash = await hashApiKey(apiKey)
  const apiKeyPrefix = getKeyPrefix(apiKey)
  const createdAt = new Date().toISOString()

  const user: StoredUser = {
    id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
    username: trimmed,
    apiKeyHash,
    apiKeyPrefix,
    createdAt,
  }

  writeRegistry([...users, user])

  return {
    user: toPublicUser(user),
    apiKey,
    token: createToken(user),
    message: 'API anahtarınız yalnızca bir kez gösterilir. Güvenli bir yerde saklayın.',
  }
}

export async function localLogin(apiKey: string): Promise<AuthResponse> {
  const trimmed = apiKey.trim()
  const prefix = getKeyPrefix(trimmed)
  const users = readRegistry().filter((u) => u.apiKeyPrefix === prefix)

  for (const user of users) {
    if (await verifyApiKey(trimmed, user.apiKeyHash)) {
      return {
        user: toPublicUser(user),
        token: createToken(user),
      }
    }
  }

  throw new Error('Geçersiz API anahtarı.')
}

export function isLocalToken(token: string | null) {
  return Boolean(token?.startsWith('local_'))
}
