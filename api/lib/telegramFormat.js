const MAX_RESULTS = 10
const MESSAGE_LIMIT = 3900

const FIELD_LABELS = {
  isim: 'İsim',
  ad: 'Ad',
  soyad: 'Soyad',
  telefon: 'Telefon',
  telefon_sifirli: 'Telefon (0)',
  telefon_uluslararasi: 'Telefon (+90)',
  email: 'E-posta',
  tc: 'TC Kimlik',
  sehir: 'Şehir',
  ilce: 'İlçe',
  ulke: 'Ülke',
  adres: 'Adres',
  posta_kodu: 'Posta Kodu',
  sirket: 'Şirket',
  username: 'Kullanıcı Adı',
  website: 'Web Sitesi',
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

function collectLines(result) {
  const lines = []

  for (const key of FIELD_ORDER) {
    const value = result[key]
    if (!value) continue
    lines.push(`${FIELD_LABELS[key]}: ${value}`)
  }

  if (result.diger && typeof result.diger === 'object') {
    for (const [key, value] of Object.entries(result.diger)) {
      if (!value) continue
      lines.push(`${key.replace(/_/g, ' ')}: ${value}`)
    }
  }

  return lines
}

function formatResult(index, result) {
  const lines = collectLines(result)
  const title = result.isim || result.ad || result.telefon || result.tc || 'Kayıt'

  if (lines.length === 0) {
    return `${index}. ${title}`
  }

  return `${index}. ${title}\n${lines.map((line) => `   ${line}`).join('\n')}`
}

export function formatResultsMessage(query, searchResult) {
  if (!searchResult.ok) {
    return searchResult.error || 'Sorgu başarısız.'
  }

  const { results, found, returned } = searchResult
  if (!found) {
    return `Sonuç bulunamadı: ${query}`
  }

  const header = `${found} sonuç bulundu · ${returned} gösteriliyor\nSorgu: ${query}\n`
  const body = results
    .slice(0, MAX_RESULTS)
    .map((row, index) => formatResult(index + 1, row))
    .join('\n\n')

  let message = `${header}\n${body}`

  if (found > MAX_RESULTS) {
    message += `\n\n... ve ${found - MAX_RESULTS} sonuç daha`
  }

  if (message.length > MESSAGE_LIMIT) {
    message = `${message.slice(0, MESSAGE_LIMIT - 3)}...`
  }

  return message
}

export function formatStartMessage(stats) {
  const count = stats?.indexed_records ?? 0
  const status = stats?.status === 'ready' ? 'hazır' : 'yükleniyor'

  return (
    'VeriPanel arama botu\n\n' +
    `Veritabanı: ${count.toLocaleString('tr-TR')} kayıt · ${status}\n\n` +
    'Bir şey gönder, otomatik aranır:\n' +
    '• Telefon: 0543 443 04 68\n' +
    '• TC: 60559325184\n' +
    '• Ad: Burak\n' +
    '• Soyad: GUL'
  )
}
