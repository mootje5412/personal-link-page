import { formatTurkishPhone, looksLikePhoneValue } from './phoneUtils.js'

export function normalizeHeader(value, index = 0) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')

  const key = (cleaned || `column_${index + 1}`)
    .toLowerCase()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return key || `column_${index + 1}`
}

export function cleanCell(value) {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).trim().replace(/\s+/g, ' ')
}

const PHONE_ALIASES = new Set([
  'telefon',
  'phone',
  'gsm',
  'mobile',
  'cep',
  'tel',
  'phone_n',
  'telefon_no',
  'phone_number',
  'phone_number_n',
  'cell',
  'cellphone',
  'contact_phone',
  'mobile_phone',
  'phone1',
  'phone2',
])

export function isPhoneKey(key) {
  const normalized = normalizeHeader(key)
  if (PHONE_ALIASES.has(normalized)) return true
  return /(?:^|_)(phone|telefon|gsm|mobile|cep|tel)(?:_|$|\d)/.test(normalized)
}

export function maybeFormatPhone(key, value) {
  if (!value) return value
  if (isPhoneKey(key) || looksLikePhoneValue(value)) {
    return formatTurkishPhone(value)
  }
  return value
}

export function isNoiseKey(key) {
  const normalized = normalizeHeader(key)
  if (!normalized) return true

  if (normalized.includes('geolocation')) return true
  if (normalized.includes('latitude') || normalized.includes('longitude')) return true
  if (normalized.includes('catchphrase')) return true
  if (normalized === 'bs' || normalized.endsWith('_bs')) return true
  if (normalized.startsWith('company_catchphrase')) return true
  if (normalized === 'sheet') return true

  return false
}

export function prettifyExtraKey(key) {
  return normalizeHeader(key)
    .replace(/^addresses_\d+_/, 'adres_')
    .replace(/^company_/, 'sirket_')
    .replace(/_n$/, '')
}
