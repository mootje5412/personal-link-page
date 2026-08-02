import { digitsOnly, normalizeTurkishPhoneDigits } from './phoneUtils.js'
import { isPhoneKey, normalizeHeader } from './valueUtils.js'

const TC_KEY_PATTERN = /(?:^|_)(tc|tckn|kimlik|identity_number|identity_number_n|tc_no|tc_kimlik)(?:_|$)/

const FIRST_NAME_KEYS = ['first_name', 'firstname', 'ad', 'name_first']
const LAST_NAME_KEYS = ['last_name', 'lastname', 'soyad', 'surname', 'name_last']

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
}

function findFieldValue(fields, aliases) {
  const lookup = new Map()
  for (const [key, value] of Object.entries(fields)) {
    const cleaned = String(value ?? '').trim()
    if (!cleaned) continue
    lookup.set(normalizeHeader(key), cleaned)
  }

  for (const alias of aliases) {
    if (lookup.has(alias)) return lookup.get(alias)
  }

  for (const alias of aliases) {
    if (alias.length < 3) continue
    for (const [key, value] of lookup.entries()) {
      if (key === alias || key.endsWith(`_${alias}`) || key.startsWith(`${alias}_`)) {
        return value
      }
    }
  }

  return ''
}

function isTcKey(key) {
  const normalized = normalizeHeader(key)
  if (TC_KEY_PATTERN.test(normalized)) return true
  return ['tc', 'tckn', 'kimlik', 'identity_number', 'tc_kimlik', 'tc_no'].includes(normalized)
}

export function extractPhonesFromFields(fields) {
  const found = new Set()

  for (const [key, value] of Object.entries(fields)) {
    const normalizedKey = normalizeHeader(key)
    if (!isPhoneKey(normalizedKey)) continue

    const local = normalizeTurkishPhoneDigits(value)
    if (local.length === 10 && local.startsWith('5')) {
      found.add(local)
    }
  }

  return [...found]
}

export function extractTcFromFields(fields) {
  const found = new Set()

  for (const [key, value] of Object.entries(fields)) {
    if (!isTcKey(key)) continue
    const digits = digitsOnly(value)
    if (digits.length === 11) found.add(digits)
  }

  return [...found]
}

export function extractFirstNameFromFields(fields) {
  const direct = normalizeText(findFieldValue(fields, FIRST_NAME_KEYS))
  if (direct) return direct

  const full = normalizeText(findFieldValue(fields, ['isim', 'name', 'full_name', 'ad_soyad', 'adsoyad']))
  if (!full) return ''
  return full.split(' ')[0] ?? ''
}

export function extractLastNameFromFields(fields) {
  const direct = normalizeText(findFieldValue(fields, LAST_NAME_KEYS))
  if (direct) return direct

  const full = normalizeText(findFieldValue(fields, ['isim', 'name', 'full_name', 'ad_soyad', 'adsoyad']))
  if (!full) return ''
  const parts = full.split(' ')
  if (parts.length < 2) return ''
  return parts.slice(1).join(' ')
}

export function buildRecordSearchIndex(fields) {
  return {
    phones: extractPhonesFromFields(fields),
    tcs: extractTcFromFields(fields),
    first_name: extractFirstNameFromFields(fields),
    last_name: extractLastNameFromFields(fields),
  }
}
