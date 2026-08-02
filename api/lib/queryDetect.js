import { digitsOnly, normalizeTurkishPhoneDigits } from './phoneUtils.js'
import { searchDatabases } from './searchEngine.js'

export function detectSearchType(query) {
  const trimmed = String(query ?? '').trim()
  if (!trimmed) return 'telefon'

  const phone = normalizeTurkishPhoneDigits(trimmed)
  if (phone.length === 10 && phone.startsWith('5')) {
    return 'telefon'
  }

  const compactDigits = digitsOnly(trimmed)
  const digitsOnlyQuery = compactDigits.length > 0 && compactDigits === trimmed.replace(/\s/g, '')

  if (digitsOnlyQuery && compactDigits.length === 11) {
    return 'tc'
  }

  if (compactDigits.length >= 10 && compactDigits.startsWith('5')) {
    return 'telefon'
  }

  return 'ad'
}

const BOT_SEARCH_OPTIONS = {
  limit: 100,
  stopAfterLimit: true,
}

export function searchWithAutoType(query, options = {}) {
  const trimmed = String(query ?? '').trim()
  const searchOptions = { ...BOT_SEARCH_OPTIONS, ...options }
  const primaryType = detectSearchType(trimmed)

  const primary = searchDatabases(trimmed, { ...searchOptions, type: primaryType })
  if (!primary.ok) return primary
  if (primary.found > 0 || primaryType !== 'ad') return primary

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    const byAd = searchDatabases(parts[0], { ...searchOptions, type: 'ad' })
    if (byAd.ok && byAd.found > 0) return byAd

    const bySoyad = searchDatabases(parts[parts.length - 1], { ...searchOptions, type: 'soyad' })
    if (bySoyad.ok && bySoyad.found > 0) return bySoyad
  }

  return searchDatabases(trimmed, { ...searchOptions, type: 'soyad' })
}
