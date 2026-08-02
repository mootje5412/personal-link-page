import { normalizeHeader } from './valueUtils.js'

const PG_COPY_RE = /^COPY\s+(?:[\w.]+\.)?(?:"([^"]+)"|(\w+))\s*\(([^)]+)\)\s+FROM\s+stdin\s*;?\s*$/i
const PG_NULLS = new Set(['\\N', '<NULL>', 'NULL', 'null', 'None'])

const COLUMN_MAP = {
  name: 'first_name',
  first_name: 'first_name',
  firstname: 'first_name',
  ad: 'first_name',
  first: 'first_name',
  isim: 'first_name',
  surname: 'last_name',
  last_name: 'last_name',
  lastname: 'last_name',
  soyad: 'last_name',
  last: 'last_name',
  soyisim: 'last_name',
  phone: 'phone',
  phone_number: 'phone',
  telephone: 'phone',
  gsm: 'phone',
  mobile: 'phone',
  tel: 'phone',
  telefon: 'phone',
  cep: 'phone',
  email: 'email',
  'e-mail': 'email',
  'e-posta': 'email',
  eposta: 'email',
  mail: 'email',
  identity_number: 'identity_number',
  tc: 'identity_number',
  tc_kimlik: 'identity_number',
  kimlik: 'identity_number',
  national_identifier: 'identity_number',
  national_id: 'identity_number',
  birth_city: 'city',
  address_city: 'city',
  city: 'city',
  il: 'city',
  country: 'country',
  notes: 'notes',
}

const NOTE_KEYS = [
  'address_district',
  'address_neighborhood',
  'street_address',
  'door_or_entrance_number',
  'mother_first',
  'father_first',
  'date_of_birth',
  'gender',
  'misc',
  'id_registration_city',
  'id_registration_district',
]

function cleanHeader(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function pgCleanValue(value) {
  const text = String(value ?? '').trim()
  if (PG_NULLS.has(text)) return ''
  return text
}

function mapColumn(column) {
  return COLUMN_MAP[cleanHeader(column)] ?? null
}

function rowIsValid(fields) {
  return Object.values(fields).some((value) => {
    if (value == null || value === '') return false
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  })
}

export function isPostgresqlSqlDump(raw) {
  const sample = String(raw ?? '').slice(0, 16384).toLowerCase()
  return (
    sample.includes('postgresql database dump')
    || (sample.includes('copy ') && sample.includes('from stdin'))
    || sample.includes('pg_catalog')
  )
}

export function parsePgCopyHeader(line) {
  const stripped = line.trim()
  const lowered = stripped.toLowerCase()
  if (!lowered.startsWith('copy ') || !lowered.includes('from stdin')) {
    return null
  }

  const match = PG_COPY_RE.exec(stripped)
  if (match) {
    const table = match[1] || match[2] || 'unknown'
    const columns = match[3].split(',').map((part) => part.trim().replace(/^"|"$/g, ''))
    return { table, columns }
  }

  const colStart = stripped.indexOf('(')
  const colEnd = stripped.lastIndexOf(')')
  if (colStart === -1 || colEnd <= colStart) return null

  const columns = stripped.slice(colStart + 1, colEnd).split(',').map((part) => part.trim().replace(/^"|"$/g, ''))
  const head = stripped.slice(0, colStart).trim()
  const tableToken = head.slice(4).trim().split(/\s+/).pop() ?? 'unknown'
  const table = tableToken.split('.').pop()?.replace(/^"|"$/g, '') ?? 'unknown'
  return { table, columns }
}

export function pgCopyRowToFields(columns, parts) {
  const fields = {}
  const extras = {}

  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index]
    const value = pgCleanValue(parts[index] ?? '')
    if (!value) continue

    const mapped = mapColumn(column)
    if (mapped && !fields[mapped]) {
      fields[mapped] = value
      continue
    }

    extras[normalizeHeader(column)] = value
  }

  if (!fields.city) {
    for (const key of ['address_city', 'birth_city', 'id_registration_city']) {
      const city = extras[key]
      if (city) {
        fields.city = city
        break
      }
    }
  }

  const noteBits = NOTE_KEYS.map((key) => extras[key]).filter(Boolean)
  if (noteBits.length > 0 && !fields.notes) {
    fields.notes = noteBits.join(' | ')
  }

  return rowIsValid(fields) ? fields : null
}

export function parsePostgresqlDump(raw) {
  let total_lines = 0
  const fieldRows = []
  const state = { columns: [], inCopy: false }

  for (const line of String(raw ?? '').split(/\r?\n/)) {
    const stripped = line.trim()

    if (!state.inCopy) {
      const parsed = parsePgCopyHeader(line)
      if (parsed) {
        state.columns = parsed.columns
        state.inCopy = true
      }
      continue
    }

    if (stripped === '\\.' || stripped.startsWith('\\.')) {
      state.inCopy = false
      state.columns = []
      continue
    }

    if (!state.columns.length || !stripped) continue

    const fields = pgCopyRowToFields(state.columns, line.split('\t'))
    if (fields) {
      total_lines += 1
      fieldRows.push(fields)
    }
  }

  if (fieldRows.length === 0) {
    throw new Error('No COPY data rows found in PostgreSQL dump')
  }

  return {
    fieldRows,
    total_lines,
    total_data_lines: fieldRows.length,
  }
}
