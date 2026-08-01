import crypto from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(crypto.scrypt)

const KEY_PREFIX = 'vp_'
const KEY_BYTES = 32
const SCRYPT_KEYLEN = 64
const SCRYPT_COST = 16384

function pepper() {
  return process.env.KEY_PEPPER ?? ''
}

export function generateApiKey() {
  const secret = crypto.randomBytes(KEY_BYTES).toString('base64url')
  return `${KEY_PREFIX}${secret}`
}

export function getApiKeyPrefix(apiKey) {
  return apiKey.slice(0, 12)
}

export async function hashApiKey(apiKey) {
  const salt = crypto.randomBytes(16)
  const derived = await scrypt(`${pepper()}${apiKey}`, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })
  return `scrypt:${salt.toString('base64')}:${derived.toString('base64')}`
}

export async function verifyApiKey(apiKey, storedHash) {
  if (!storedHash.startsWith('scrypt:')) {
    return false
  }

  const [, saltB64, hashB64] = storedHash.split(':')
  if (!saltB64 || !hashB64) return false

  const salt = Buffer.from(saltB64, 'base64')
  const expected = Buffer.from(hashB64, 'base64')
  const derived = await scrypt(`${pepper()}${apiKey}`, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })

  if (expected.length !== derived.length) {
    return false
  }

  return crypto.timingSafeEqual(expected, derived)
}

export function isValidApiKeyFormat(apiKey) {
  if (typeof apiKey !== 'string') return false
  if (!apiKey.startsWith(KEY_PREFIX)) return false
  return apiKey.length >= 44 && apiKey.length <= 64
}

export const CURRENT_TERMS_VERSION = '1.0'

export async function authFailureDelay() {
  await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300))
}
