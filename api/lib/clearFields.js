import { isNoiseKey, maybeFormatPhone, normalizeHeader, prettifyExtraKey } from './valueUtils.js'
import { buildPhoneFormats, formatTurkishPhone, looksLikePhoneValue } from './phoneUtils.js'

const RESULT_ORDER = [
  'row',
  'isim',
  'ad',
  'soyad',
  'telefon',
  'email',
  'tc',
  'sehir',
  'ilce',
  'ulke',
  'adres',
  'posta_kodu',
  'sirket',
  'username',
  'website',
  'diger',
]

const FIELD_GROUPS = [
  ['isim', ['isim', 'name', 'full_name', 'ad_soyad', 'adsoyad', 'name_surname'], null],
  ['telefon', ['telefon', 'phone', 'gsm', 'mobile', 'cep', 'tel', 'phone_n', 'telefon_no', 'phone_number', 'phone_number_n'], 'phone'],
  ['email', ['email', 'mail', 'e_posta', 'eposta', 'email_n', 'e_mail'], 'email'],
  ['tc', ['tc', 'tc_kimlik', 'identity_number', 'kimlik', 'tckn', 'identity_number_n', 'tc_no'], 'tc'],
  ['sehir', ['sehir', 'city', 'city_name'], null],
  ['ulke', ['ulke', 'country', 'country_name'], null],
  ['username', ['username', 'kullanici', 'user_name', 'kullanici_adi'], null],
  ['website', ['website', 'web', 'site'], 'url'],
  ['adres', ['address_line', 'addressline', 'adres', 'address', 'street', 'street_name'], null],
  ['sirket', ['company_name', 'sirket', 'company', 'firma'], null],
  ['posta_kodu', ['zipcode', 'zip_code', 'postal_code', 'posta_kodu'], null],
  ['ilce', ['state', 'district', 'ilce', 'county'], null],
]

const NESTED_PATTERNS = [
  ['sehir', [/^(addresses_\d+_)?city(_name)?$/, /^(addresses_\d+_)?sehir$/]],
  ['ulke', [/^(addresses_\d+_)?country(_name)?$/, /^(addresses_\d+_)?ulke$/]],
  ['adres', [/^(addresses_\d+_)?street(_name)?$/, /^(addresses_\d+_)?address(_line)?$/]],
  ['posta_kodu', [/^(addresses_\d+_)?zip(code)?$/, /^(addresses_\d+_)?postal_code$/]],
  ['ilce', [/^(addresses_\d+_)?state$/, /^(addresses_\d+_)?county$/]],
  ['telefon', [/^(addresses_\d+_)?phone$/]],
  ['email', [/^(addresses_\d+_)?email$/]],
]

function cleanValue(value) {
  if (value == null || typeof value === 'object') return ''
  return String(value).trim()
}

function looksLikePhone(value) {
  return looksLikePhoneValue(value)
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function looksLikeTc(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 11
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value)
}

function validateValue(kind, value) {
  if (!value) return false
  if (kind === 'phone') return looksLikePhone(value)
  if (kind === 'email') return looksLikeEmail(value)
  if (kind === 'tc') return looksLikeTc(value)
  if (kind === 'url') return looksLikeUrl(value)
  return true
}

function buildLookup(fields) {
  const lookup = new Map()
  for (const [key, value] of Object.entries(fields)) {
    const cleaned = cleanValue(value)
    if (!cleaned) continue
    lookup.set(normalizeHeader(key), cleaned)
  }
  return lookup
}

function findValue(lookup, aliases) {
  for (const alias of aliases) {
    if (lookup.has(alias)) return lookup.get(alias)
  }

  for (const alias of aliases) {
    if (alias.length < 4) continue
    for (const [key, value] of lookup.entries()) {
      if (key.endsWith(`_${alias}`)) {
        const prefix = key.slice(0, -(alias.length + 1))
        if (prefix === 'first' || prefix === 'last') continue
        return value
      }
      if (key.startsWith(`${alias}_`)) return value
    }
  }

  return ''
}

function findByPatterns(lookup, patterns) {
  for (const [key, value] of lookup.entries()) {
    for (const pattern of patterns) {
      if (pattern.test(key)) return value
    }
  }
  return ''
}

function buildName(lookup) {
  const direct = findValue(lookup, ['isim', 'name', 'full_name', 'ad_soyad', 'adsoyad', 'name_surname'])
  if (direct) return direct

  const first = findValue(lookup, ['first_name', 'firstname', 'ad'])
  const last = findValue(lookup, ['last_name', 'lastname', 'soyad', 'surname'])
  return [first, last].filter(Boolean).join(' ').trim()
}

function markUsed(used, lookup, aliases) {
  for (const alias of aliases) {
    for (const key of lookup.keys()) {
      if (key === alias || key.endsWith(`_${alias}`) || key.startsWith(`${alias}_`)) {
        used.add(key)
      }
    }
  }
}

function markPatternUsed(used, lookup, patterns) {
  for (const [key] of lookup.entries()) {
    for (const pattern of patterns) {
      if (pattern.test(key)) used.add(key)
    }
  }
}

export function formatClearResult(fields) {
  const lookup = buildLookup(fields)
  const result = {}
  const used = new Set()

  for (const [label, aliases, validator] of FIELD_GROUPS) {
    const value = findValue(lookup, aliases)
    if (!value || !validateValue(validator, value)) continue
    result[label] = label === 'telefon' ? formatTurkishPhone(value) : value
    markUsed(used, lookup, aliases)
  }

  for (const [label, patterns] of NESTED_PATTERNS) {
    if (result[label]) continue
    const value = findByPatterns(lookup, patterns)
    const validator = label === 'telefon' ? 'phone' : label === 'email' ? 'email' : null
    if (!value || !validateValue(validator, value)) continue
    result[label] = label === 'telefon' ? formatTurkishPhone(value) : value
    markPatternUsed(used, lookup, patterns)
  }

  if (!result.telefon) {
    for (const [key, value] of lookup.entries()) {
      if (used.has(key)) continue
      if (!looksLikePhoneValue(value)) continue
      result.telefon = formatTurkishPhone(value)
      used.add(key)
      break
    }
  }

  const combinedName = buildName(lookup)
  if (combinedName) {
    result.isim = combinedName
    markUsed(used, lookup, ['first_name', 'firstname', 'ad', 'last_name', 'lastname', 'soyad', 'surname'])
  }

  const firstName = findValue(lookup, ['first_name', 'firstname', 'ad'])
  const lastName = findValue(lookup, ['last_name', 'lastname', 'soyad', 'surname'])
  if (firstName) result.ad = firstName
  if (lastName) result.soyad = lastName

  const extras = {}
  for (const [key, value] of lookup.entries()) {
    if (used.has(key)) continue
    if (isNoiseKey(key)) continue
    if (Object.values(result).includes(value)) continue

    const prettyKey = prettifyExtraKey(key)
    if (isNoiseKey(prettyKey)) continue
    if (Object.values(result).includes(value)) continue

    extras[prettyKey] = maybeFormatPhone(key, value)
  }

  if (Object.keys(extras).length > 0) {
    result.diger = extras
  }

  return polishSearchResult(result)
}

function polishSearchResult(result) {
  const polished = {}

  for (const key of RESULT_ORDER) {
    if (key === 'row') continue

    if (key === 'telefon') {
      if (!result.telefon) continue
      const formats = buildPhoneFormats(result.telefon)
      if (formats) {
        polished.telefon = formats.gosterim
        polished.telefon_sifirli = formats.sifirli
        polished.telefon_uluslararasi = formats.uluslararasi
      } else {
        polished.telefon = result.telefon
      }
      continue
    }

    const value = result[key]
    if (value == null || value === '') continue
    if (key === 'diger' && typeof value === 'object' && Object.keys(value).length === 0) continue
    polished[key] = value
  }

  return polished
}
