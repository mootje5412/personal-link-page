export const PAGE_SIZE = 10
export const MAX_FETCH = 100
const MESSAGE_LIMIT = 3900

const FIELD_LABELS = {
  ad: 'Ad',
  soyad: 'Soyad',
  tc: 'TC',
  telefon: 'Telefon',
  email: 'E-posta',
  sehir: 'Sehir',
  ilce: 'Ilce',
  ulke: 'Ulke',
  adres: 'Adres',
  posta_kodu: 'Posta Kodu',
  sirket: 'Sirket',
  username: 'Kullanici',
  website: 'Web',
}

const FIELD_ORDER = [
  'ad',
  'soyad',
  'tc',
  'telefon',
  'email',
  'sehir',
  'ilce',
  'ulke',
  'adres',
  'posta_kodu',
  'sirket',
  'username',
  'website',
]

function collectLines(result) {
  const lines = []
  const seen = new Set()

  for (const key of FIELD_ORDER) {
    const value = result[key]
    if (!value || seen.has(value)) continue
    lines.push(`${FIELD_LABELS[key]}: ${value}`)
    seen.add(value)
  }

  if (result.diger && typeof result.diger === 'object') {
    for (const [key, value] of Object.entries(result.diger)) {
      if (!value || seen.has(value)) continue
      lines.push(`${key.replace(/_/g, ' ')}: ${value}`)
      seen.add(value)
    }
  }

  return lines
}

function formatResultCard(index, result) {
  const title =
    result.isim ||
    [result.ad, result.soyad].filter(Boolean).join(' ') ||
    result.telefon ||
    result.tc ||
    'Kayit'
  const lines = collectLines(result)

  if (lines.length === 0) {
    return `${index}. ${title}`
  }

  return `${index}. ${title}\n${lines.map((line) => `   ${line}`).join('\n')}`
}

export function getTotalPages(resultCount) {
  return Math.max(1, Math.ceil(resultCount / PAGE_SIZE))
}

export function formatResultsPage({ query, results, found, foundExact = true, page, ms }) {
  const totalPages = getTotalPages(results.length)
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const start = safePage * PAGE_SIZE
  const pageResults = results.slice(start, start + PAGE_SIZE)

  const foundLabel = foundExact ? String(found) : `${found}+`
  const header = [
    'VeriPanel',
    `Sorgu: ${query}`,
    `Sonuc: ${foundLabel}  |  Sayfa ${safePage + 1}/${totalPages}  |  ${ms}ms`,
    '----------------------------------------',
  ].join('\n')

  if (pageResults.length === 0) {
    return `${header}\n\nSonuc bulunamadi.`
  }

  const body = pageResults.map((row, index) => formatResultCard(start + index + 1, row)).join('\n\n')

  let message = `${header}\n\n${body}`

  if (!foundExact) {
    message += '\n\n(Ilk 100 kayit gosteriliyor)'
  }

  if (message.length > MESSAGE_LIMIT) {
    message = `${message.slice(0, MESSAGE_LIMIT - 3)}...`
  }

  return message
}

export function formatStartMessage(stats) {
  const count = stats?.indexed_records ?? 0
  const status = stats?.status === 'ready' ? 'Hazir' : 'Yukleniyor'

  return [
    'VeriPanel',
    '',
    'Telefon, TC, ad veya soyad gonder.',
    '',
    `Veritabani: ${count.toLocaleString('tr-TR')} kayit`,
    `Durum: ${status}`,
    '',
    'Ornekler:',
    '0543 443 04 68',
    '60559325184',
    'Burak',
    'GUL',
    '',
    'Sonuclar 10 kayitlik sayfalar halinde gelir.',
  ].join('\n')
}
