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

export function searchWithAutoType(query, options = {}) {
  const trimmed = String(query ?? '').trim()
  const primaryType = detectSearchType(trimmed)
  const attempts = [primaryType]

  if (primaryType === 'ad') {
    attempts.push('soyad')
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length > 1) {
      attempts.push({ type: 'ad', query: parts[0] })
      attempts.push({ type: 'soyad', query: parts[parts.length - 1] })
    }
  }

  let lastResult = null

  for (const attempt of attempts) {
    const type = typeof attempt === 'string' ? attempt : attempt.type
    const attemptQuery = typeof attempt === 'string' ? trimmed : attempt.query
    const result = searchDatabases(attemptQuery, { ...options, type })

    if (!result.ok) return result

    lastResult = {
      ...result,
      detected_type: type,
    }

    if (result.found > 0) {
      return lastResult
    }
  }

  return (
    lastResult ?? {
      ok: false,
      error: 'Sorgu boş olamaz',
      type: primaryType,
      found: 0,
      returned: 0,
      results: [],
    }
  )
}
