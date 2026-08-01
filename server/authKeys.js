import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12
const KEY_PREFIX = 'vp_'
const KEY_BYTES = 32

export function generateApiKey() {
  const secret = crypto.randomBytes(KEY_BYTES).toString('base64url')
  return `${KEY_PREFIX}${secret}`
}

export function getApiKeyPrefix(apiKey) {
  return apiKey.slice(0, 12)
}

export async function hashApiKey(apiKey) {
  return bcrypt.hash(apiKey, BCRYPT_ROUNDS)
}

export async function verifyApiKey(apiKey, hash) {
  return bcrypt.compare(apiKey, hash)
}

export function isValidApiKeyFormat(apiKey) {
  if (typeof apiKey !== 'string') return false
  if (!apiKey.startsWith(KEY_PREFIX)) return false
  return apiKey.length >= 40 && apiKey.length <= 64
}

export const CURRENT_TERMS_VERSION = '1.0'
