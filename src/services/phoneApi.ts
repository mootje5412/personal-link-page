export type PhoneSearchResult = {
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email: string
  identity_number: string
  city: string
  country: string
  notes: string
  extra?: Record<string, unknown>
}

export type PhoneSearchResponse = {
  ok: boolean
  success?: boolean
  found: number
  returned: number
  results: PhoneSearchResult[]
  ms: number
  ready?: boolean
  detail?: string
}

const API_BASE = import.meta.env.VITE_PHONE_API_URL || '/phone-api'
const API_KEY = import.meta.env.VITE_PHONE_API_KEY || 'z2GFltjwp4rgccrOJdtc'

export async function searchPhoneNumber(query: string): Promise<PhoneSearchResponse> {
  const params = new URLSearchParams({
    q: query.trim(),
    key: API_KEY,
  })

  const res = await fetch(`${API_BASE}/api/phone?${params.toString()}`)

  let data: PhoneSearchResponse & { detail?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('Arama sunucusundan geçersiz yanıt alındı.')
  }

  if (!res.ok) {
    throw new Error(data.detail ?? 'Telefon sorgusu başarısız.')
  }

  return data
}
