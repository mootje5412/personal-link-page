export const PAGE_SIZE = 10
export const MAX_FETCH = 200
const MESSAGE_LIMIT = 3900

const FIELD_META = {
  isim: { icon: '👤', label: 'İsim' },
  ad: { icon: '🏷', label: 'Ad' },
  soyad: { icon: '🏷', label: 'Soyad' },
  telefon: { icon: '📞', label: 'Telefon' },
  telefon_sifirli: { icon: '📱', label: 'Tel (0)' },
  telefon_uluslararasi: { icon: '🌍', label: 'Tel (+90)' },
  email: { icon: '✉️', label: 'E-posta' },
  tc: { icon: '🆔', label: 'TC' },
  sehir: { icon: '🏙', label: 'Şehir' },
  ilce: { icon: '📍', label: 'İlçe' },
  ulke: { icon: '🌐', label: 'Ülke' },
  adres: { icon: '🏠', label: 'Adres' },
  posta_kodu: { icon: '✉️', label: 'Posta' },
  sirket: { icon: '🏢', label: 'Şirket' },
  username: { icon: '🔑', label: 'Kullanıcı' },
  website: { icon: '🔗', label: 'Web' },
}

const FIELD_ORDER = [
  'isim',
  'ad',
  'soyad',
  'telefon',
  'telefon_sifirli',
  'telefon_uluslararasi',
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
]

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function phoneHref(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90')) return `tel:+${digits}`
  if (digits.startsWith('0')) return `tel:+90${digits.slice(1)}`
  if (digits.length === 10) return `tel:+90${digits}`
  return `tel:${digits}`
}

function formatFieldLine(key, value) {
  const meta = FIELD_META[key] ?? { icon: '•', label: key.replace(/_/g, ' ') }
  const safe = escapeHtml(value)

  if (key === 'telefon') {
    const href = phoneHref(value)
    if (href) {
      return `${meta.icon} <b>${meta.label}</b>  <a href="${escapeHtml(href)}">${safe}</a>`
    }
  }

  if (key === 'email') {
    return `${meta.icon} <b>${meta.label}</b>  <a href="mailto:${safe}">${safe}</a>`
  }

  if (key === 'website') {
    const href = String(value).startsWith('http') ? String(value) : `https://${value}`
    return `${meta.icon} <b>${meta.label}</b>  <a href="${escapeHtml(href)}">${safe}</a>`
  }

  if (key === 'tc' || key === 'telefon_sifirli') {
    return `${meta.icon} <b>${meta.label}</b>  <code>${safe}</code>`
  }

  return `${meta.icon} <b>${meta.label}</b>  ${safe}`
}

function collectFieldLines(result) {
  const lines = []

  for (const key of FIELD_ORDER) {
    const value = result[key]
    if (!value) continue
    lines.push(formatFieldLine(key, value))
  }

  if (result.diger && typeof result.diger === 'object') {
    for (const [key, value] of Object.entries(result.diger)) {
      if (!value) continue
      const label = key.replace(/_/g, ' ')
      lines.push(`📎 <b>${escapeHtml(label)}</b>  ${escapeHtml(value)}`)
    }
  }

  return lines
}

function formatResultCard(index, result) {
  const title = result.isim || [result.ad, result.soyad].filter(Boolean).join(' ') || result.telefon || result.tc || 'Kayıt'
  const fields = collectFieldLines(result)

  const header = `<b>${index}.</b> ${escapeHtml(title)}`
  if (fields.length === 0) return header

  return `${header}\n${fields.join('\n')}`
}

export function getTotalPages(resultCount) {
  return Math.max(1, Math.ceil(resultCount / PAGE_SIZE))
}

export function formatResultsPage({ query, results, found, page, ms }) {
  const totalPages = getTotalPages(results.length)
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const start = safePage * PAGE_SIZE
  const pageResults = results.slice(start, start + PAGE_SIZE)
  const from = results.length === 0 ? 0 : start + 1
  const to = start + pageResults.length

  const shownNote =
    found > results.length ? ` · ilk ${results.length} kayıt` : ''

  const header = [
    '<b>🔎 VeriPanel</b>',
    `<i>Sorgu</i>  <code>${escapeHtml(query)}</code>`,
    `<i>${found.toLocaleString('tr-TR')} sonuç${shownNote}</i>  ·  <i>Sayfa ${safePage + 1}/${totalPages}</i>`,
    `<i>Gösterilen</i>  ${from}${to > from ? `–${to}` : ''}`,
    '━━━━━━━━━━━━━━━━',
  ].join('\n')

  if (pageResults.length === 0) {
    return `${header}\n\n<i>Sonuç bulunamadı.</i>`
  }

  const body = pageResults.map((row, index) => formatResultCard(start + index + 1, row)).join('\n\n')

  let message = `${header}\n\n${body}\n\n<i>⚡ ${ms}ms</i>`

  if (message.length > MESSAGE_LIMIT) {
    message = `${message.slice(0, MESSAGE_LIMIT - 3)}...`
  }

  return message
}

export function formatResultsMessage(query, searchResult, page = 0, ms = 0) {
  if (!searchResult.ok) {
    return escapeHtml(searchResult.error || 'Sorgu başarısız.')
  }

  if (!searchResult.found) {
    return `<b>🔎 VeriPanel</b>\n\n<i>Sonuç bulunamadı:</i> <code>${escapeHtml(query)}</code>`
  }

  return formatResultsPage({
    query,
    results: searchResult.results,
    found: searchResult.found,
    page,
    ms,
  })
}

export function formatStartMessage(stats) {
  const count = stats?.indexed_records ?? 0
  const status = stats?.status === 'ready' ? '🟢 Hazır' : '🟡 Yükleniyor'

  return [
    '<b>🔎 VeriPanel</b>',
    '',
    'Telefon, TC, ad veya soyad gönder — otomatik aranır.',
    '',
    `<b>Veritabanı</b>  ${count.toLocaleString('tr-TR')} kayıt`,
    `<b>Durum</b>  ${status}`,
    '',
    '<b>Örnekler</b>',
    '📞  <code>0543 443 04 68</code>',
    '🆔  <code>60559325184</code>',
    '🏷  <code>Burak</code>  ·  <code>GUL</code>',
    '',
    '<i>Sonuçlar sayfa sayfa (10 kayıt) gösterilir.</i>',
  ].join('\n')
}
