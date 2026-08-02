import { digitsOnly, normalizeTurkishPhoneDigits } from './phoneUtils.js'

export const SEARCH_TYPES = ['telefon', 'tc', 'ad', 'soyad']

export function normalizeSearchType(type) {
  const value = String(type ?? 'telefon').trim().toLowerCase()
  return SEARCH_TYPES.includes(value) ? value : 'telefon'
}

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
}

export function validateQuery(type, query) {
  const trimmed = String(query ?? '').trim()
  if (!trimmed) return 'Sorgu boş olamaz'

  if (type === 'telefon') {
    const phone = normalizeTurkishPhoneDigits(trimmed)
    if (phone.length !== 10 || !phone.startsWith('5')) {
      return 'Geçerli bir telefon numarası girin (05xx xxx xx xx)'
    }
    return null
  }

  if (type === 'tc') {
    const tc = digitsOnly(trimmed)
    if (tc.length !== 11) return 'TC kimlik numarası 11 haneli olmalıdır'
    return null
  }

  if (type === 'ad' || type === 'soyad') {
    if (trimmed.length < 2) return 'En az 2 karakter girin'
    return null
  }

  return null
}

export function recordMatchesType(record, type, query) {
  const trimmed = String(query ?? '').trim()

  if (type === 'telefon') {
    const target = normalizeTurkishPhoneDigits(trimmed)
    return record.search.phones.includes(target)
  }

  if (type === 'tc') {
    const target = digitsOnly(trimmed)
    return record.search.tcs.includes(target)
  }

  if (type === 'ad') {
    const target = normalizeName(trimmed)
    return record.search.first_name === target
  }

  if (type === 'soyad') {
    const target = normalizeName(trimmed)
    return record.search.last_name === target
  }

  return false
}
