export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function normalizeTurkishPhoneDigits(value) {
  let digits = digitsOnly(value)
  if (!digits) return ''

  if (digits.startsWith('90') && digits.length >= 12) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0') && digits.length >= 11) {
    digits = digits.slice(1)
  }

  if (digits.length === 10 && digits.startsWith('5')) {
    return digits
  }

  if (digits.length > 10 && digits.startsWith('5')) {
    return digits.slice(0, 10)
  }

  return digits.length >= 10 ? digits : ''
}

export function buildPhoneSearchVariants(value) {
  const local = normalizeTurkishPhoneDigits(value)
  if (!local || local.length < 7) return []

  const variants = new Set([
    local,
    `0${local}`,
    `90${local}`,
  ])

  if (local.length >= 7) {
    variants.add(local.slice(-10))
    variants.add(local.slice(-9))
    variants.add(local.slice(-7))
  }

  return [...variants].filter((item) => item.length >= 7)
}

export function formatTurkishPhone(value) {
  const local = normalizeTurkishPhoneDigits(value)
  if (!local) return String(value ?? '').trim()

  if (local.length === 10 && local.startsWith('5')) {
    return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`
  }

  return String(value ?? '').trim()
}

export function buildPhoneFormats(value) {
  const local = normalizeTurkishPhoneDigits(value)
  if (!local || local.length !== 10 || !local.startsWith('5')) return null

  return {
    gosterim: formatTurkishPhone(local),
    sifirli: `0${local}`,
    uluslararasi: `+90${local}`,
    numara: local,
  }
}

export function looksLikePhoneValue(value) {
  const local = normalizeTurkishPhoneDigits(value)
  return local.length === 10 && local.startsWith('5')
}

export function extractPhoneDigitsFromFields(fields) {
  const found = new Set()

  for (const value of Object.values(fields)) {
    const local = normalizeTurkishPhoneDigits(value)
    if (local.length === 10 && local.startsWith('5')) {
      found.add(local)
      found.add(`0${local}`)
      found.add(`90${local}`)
    }
  }

  return [...found]
}
