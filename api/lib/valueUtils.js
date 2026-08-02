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
])

export function maybeFormatPhone(key, value) {
  if (!value || !PHONE_ALIASES.has(normalizeHeader(key))) return value

  const digits = value.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('5')) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
  }
  if (digits.length === 12 && digits.startsWith('90')) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
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
