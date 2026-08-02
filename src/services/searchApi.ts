export type ApiSearchType = 'telefon' | 'tc' | 'ad' | 'soyad'

export type SearchResult = {
  row?: number
  isim?: string
  ad?: string
  soyad?: string
  telefon?: string
  telefon_sifirli?: string
  telefon_uluslararasi?: string
  email?: string
  tc?: string
  sehir?: string
  ilce?: string
  ulke?: string
  adres?: string
  posta_kodu?: string
  sirket?: string
  username?: string
  website?: string
  diger?: Record<string, string>
}

export type QuerySearchResponse = {
  ok: boolean
  type?: ApiSearchType
  query?: string
  found: number
  returned: number
  results: SearchResult[]
  ms: number
  detail?: string
  error?: string
}

const API_BASE = '/phone-api'
const REQUEST_TIMEOUT_MS = 20000

export async function queryDatabase(
  searchType: ApiSearchType,
  query: string,
): Promise<QuerySearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    type: searchType,
    limit: '50',
  })

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/search?${params.toString()}`, {
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Sorgu zaman aşımına uğradı. Birkaç saniye sonra tekrar deneyin.')
    }
    throw new Error('Arama sunucusuna bağlanılamadı.')
  } finally {
    window.clearTimeout(timeout)
  }

  let data: QuerySearchResponse
  try {
    data = await res.json()
  } catch {
    throw new Error('Arama sunucusundan geçersiz yanıt alındı.')
  }

  if (!res.ok || data.ok === false) {
    throw new Error(data.error ?? data.detail ?? 'Sorgu başarısız.')
  }

  return data
}

export function formatSearchMessage(data: QuerySearchResponse): string {
  if (data.found <= 0) {
    return `Sonuç bulunamadı · ${data.ms}ms`
  }

  if (data.returned < data.found) {
    return `${data.found} sonuç · ${data.returned} gösteriliyor · ${data.ms}ms`
  }

  return `${data.found} sonuç bulundu · ${data.ms}ms`
}

export const RESULT_FIELD_LABELS: Record<string, string> = {
  ad: 'Ad',
  soyad: 'Soyad',
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

export const RESULT_FIELD_ORDER = [
  'ad',
  'soyad',
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
] as const

export function phoneHref(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('90')) return `tel:+${digits}`
  if (digits.startsWith('0')) return `tel:+90${digits.slice(1)}`
  if (digits.length === 10) return `tel:+90${digits}`
  return `tel:${digits}`
}

export const SEARCH_PAGE_CONFIG: Record<
  ApiSearchType,
  {
    title: string
    intro: string
    label: string
    placeholder: string
    inputMode?: 'tel' | 'numeric' | 'text'
    maxLength?: number
  }
> = {
  telefon: {
    title: 'Telefon sorgusu',
    intro: 'Sadece girdiğin telefon numarasına ait kayıtlar listelenir.',
    label: 'Telefon numarası',
    placeholder: '05xx xxx xx xx',
    inputMode: 'tel',
  },
  tc: {
    title: 'TC kimlik sorgusu',
    intro: 'Sadece girdiğin TC kimlik numarasına ait kayıtlar listelenir.',
    label: 'TC kimlik numarası',
    placeholder: '11 haneli TC kimlik no',
    inputMode: 'numeric',
    maxLength: 11,
  },
  ad: {
    title: 'Ad sorgusu',
    intro: 'Sadece girdiğin ada ait kayıtlar listelenir.',
    label: 'Ad',
    placeholder: 'Ad',
  },
  soyad: {
    title: 'Soyad sorgusu',
    intro: 'Sadece girdiğin soyada ait kayıtlar listelenir.',
    label: 'Soyad',
    placeholder: 'Soyad',
  },
}
