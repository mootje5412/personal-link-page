const FIELD_LABELS = {
  isim: 'İsim',
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function phoneHref(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90')) return `tel:+${digits}`
  if (digits.startsWith('0')) return `tel:+90${digits.slice(1)}`
  if (digits.length === 10) return `tel:+90${digits}`
  return `tel:${digits}`
}

function renderField(label, value) {
  const safe = escapeHtml(value)
  if (label === 'Telefon' || label === 'Telefon (0)' || label === 'Telefon (+90)') {
    const href = phoneHref(value)
    if (href) {
      return `<div class="field"><dt>${label}</dt><dd><a href="${href}">${safe}</a></dd></div>`
    }
  }
  if (label === 'E-posta') {
    return `<div class="field"><dt>${label}</dt><dd><a href="mailto:${safe}">${safe}</a></dd></div>`
  }
  if (label === 'Web Sitesi') {
    const href = String(value).startsWith('http') ? String(value) : `https://${value}`
    return `<div class="field"><dt>${label}</dt><dd><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${safe}</a></dd></div>`
  }
  return `<div class="field"><dt>${label}</dt><dd>${safe}</dd></div>`
}

function renderResultCard(result, index) {
  const fields = FIELD_ORDER
    .filter((key) => result[key])
    .map((key) => renderField(FIELD_LABELS[key], result[key]))
    .join('')

  let extras = ''
  if (result.diger && typeof result.diger === 'object') {
    const extraFields = Object.entries(result.diger)
      .map(([key, value]) => renderField(key.replace(/_/g, ' '), value))
      .join('')
    if (extraFields) {
      extras = `<details class="extras"><summary>Diğer bilgiler</summary><dl>${extraFields}</dl></details>`
    }
  }

  return `<article class="card"><div class="card-head"><span class="card-no">#${index + 1}</span><h2>${escapeHtml(result.isim || 'Kayıt')}</h2></div><dl class="fields">${fields}</dl>${extras}</article>`
}

function pageShell(title, body) {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#000000">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f5f5;
      color: #111;
      line-height: 1.5;
      padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
    }
    .wrap { max-width: 640px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.03em; }
    .lead { color: #666; font-size: 15px; margin-bottom: 20px; }
    .search {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    input[type="tel"], input[type="search"] {
      width: 100%;
      min-height: 52px;
      padding: 14px 16px;
      border: 1px solid #ccc;
      border-radius: 14px;
      font-size: 17px;
      background: #fff;
      -webkit-appearance: none;
    }
    button {
      width: 100%;
      min-height: 52px;
      border: 0;
      border-radius: 14px;
      background: #000;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
    }
    .meta {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 18px;
      overflow: hidden;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .card-head {
      padding: 16px;
      border-bottom: 1px solid #eee;
      background: #fafafa;
    }
    .card-no {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: #666;
      margin-bottom: 4px;
    }
    .card-head h2 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      word-break: break-word;
    }
    .fields, .extras dl { display: flex; flex-direction: column; }
    .field {
      display: grid;
      grid-template-columns: 34% 1fr;
      gap: 10px;
      padding: 12px 16px;
      border-top: 1px solid #eee;
      align-items: start;
    }
    .field dt {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
    }
    .field dd {
      font-size: 15px;
      font-weight: 500;
      word-break: break-word;
    }
    .field a { color: #000; text-decoration: underline; }
    .extras summary {
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      cursor: pointer;
    }
    .empty {
      padding: 20px;
      text-align: center;
      color: #666;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e5e5e5;
    }
    .error {
      padding: 14px 16px;
      margin-bottom: 16px;
      border-radius: 12px;
      background: #fff1f1;
      color: #a40000;
      border: 1px solid #ffc9c9;
    }
    @media (max-width: 380px) {
      .field { grid-template-columns: 1fr; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="wrap">${body}</div>
</body>
</html>`
}

export function renderHomePage() {
  return pageShell(
    'VeriPanel Arama',
    `<h1>VeriPanel</h1>
<p class="lead">Telefon numarası ile arama yap.</p>
<form class="search" method="get" action="/api/search">
  <input type="hidden" name="format" value="html">
  <input type="tel" name="q" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required autofocus>
  <button type="submit">Sorgula</button>
</form>`,
  )
}

export function renderSearchPage(query, result) {
  if (!result.ok) {
    return pageShell(
      'Arama',
      `<h1>VeriPanel</h1>
<p class="error">${escapeHtml(result.error || 'Sorgu başarısız')}</p>
<form class="search" method="get" action="/api/search">
  <input type="hidden" name="format" value="html">
  <input type="tel" name="q" value="${escapeHtml(query)}" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required>
  <button type="submit">Sorgula</button>
</form>`,
    )
  }

  const cards =
    result.results.length > 0
      ? result.results.map((row, index) => renderResultCard(row, index)).join('')
      : `<div class="empty">Sonuç bulunamadı.</div>`

  const summary =
    result.found > 0
      ? `${result.found} sonuç · ${result.returned} gösteriliyor · ${result.ms}ms`
      : `Sonuç bulunamadı · ${result.ms}ms`

  return pageShell(
    `${query} · VeriPanel`,
    `<h1>VeriPanel</h1>
<p class="lead">Telefon sorgusu</p>
<form class="search" method="get" action="/api/search">
  <input type="hidden" name="format" value="html">
  <input type="tel" name="q" value="${escapeHtml(query)}" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required>
  <button type="submit">Sorgula</button>
</form>
<p class="meta">${escapeHtml(summary)}</p>
${cards}`,
  )
}

export function wantsHtml(req) {
  if (req.query.format === 'html') return true
  const accept = String(req.headers.accept ?? '')
  if (accept.includes('text/html') && !accept.includes('application/json')) return true
  return false
}
