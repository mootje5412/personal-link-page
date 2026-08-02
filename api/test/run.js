import assert from 'node:assert/strict'
import { formatClearResult } from '../lib/clearFields.js'
import { parseDelimitedFile } from '../lib/csvParser.js'
import { buildPhoneSearchVariants, buildPhoneFormats, formatTurkishPhone, normalizeTurkishPhoneDigits } from '../lib/phoneUtils.js'

const BASE = process.env.API_BASE || 'http://127.0.0.1:8080'

async function request(urlPath) {
  const res = await fetch(`${BASE}${urlPath}`)
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function testCsvParser() {
  const csv = 'phone,full_name,email,city\n05551234567,Ahmet Yilmaz,ahmet@example.com,Istanbul\n'
  const parsed = parseDelimitedFile(csv)
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].phone, '0555 123 45 67')
  assert.equal(parsed.rows[0].full_name, 'Ahmet Yilmaz')
  console.log('✓ csv parser')
}

function testSemicolonCsv() {
  const csv = 'phone;full_name;email\n05321112233;Deniz Aksoy;deniz@example.com\n'
  const parsed = parseDelimitedFile(csv)
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].full_name, 'Deniz Aksoy')
  assert.equal(parsed.delimiter, ';')
  console.log('✓ semicolon csv parser')
}

function testPipeCsv() {
  const csv = 'phone|full_name|email\n05443332211|Mehmet Kaya|mehmet@example.com\n'
  const parsed = parseDelimitedFile(csv)
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].full_name, 'Mehmet Kaya')
  assert.equal(parsed.delimiter, '|')
  console.log('✓ pipe csv parser')
}

function testClearFields() {
  const formatted = formatClearResult({
    phone: '05551234567',
    full_name: 'Ahmet Yilmaz',
    email: 'ahmet@example.com',
    city: 'Istanbul',
  })

  assert.equal(formatted.telefon.gosterim, '0555 123 45 67')
  assert.equal(formatted.telefon.sifirli, '05551234567')
  assert.equal(formatted.telefon.uluslararasi, '+905551234567')
  assert.equal(formatted.isim, 'Ahmet Yilmaz')
  assert.equal(formatted.email, 'ahmet@example.com')
  assert.equal(formatted.sehir, 'Istanbul')
  console.log('✓ clear field formatting')
}

function testNestedJsonFields() {
  const formatted = formatClearResult({
    first_name: 'Burak',
    last_name: 'GUL',
    email: 'burakkggul@gmail.com',
    phone: '905434430468',
    addresses_0_city: 'Ankara',
    addresses_0_country: 'Turkey',
    addresses_0_street: 'Altay Eryaman',
    addresses_0_geolocation_latitude: '39.9334',
    company_catchPhrase: 'Innovative scalable solution',
    company_bs: 'synergize',
  })

  assert.equal(formatted.isim, 'Burak GUL')
  assert.equal(formatted.telefon.gosterim, '0543 443 04 68')
  assert.equal(formatted.telefon.sifirli, '05434430468')
  assert.equal(formatted.sehir, 'Ankara')
  assert.equal(formatted.ulke, 'Turkey')
  assert.equal(formatted.adres, 'Altay Eryaman')
  assert.ok(!formatted.diger?.addresses_0_geolocation_latitude)
  assert.ok(!formatted.diger?.company_catchphrase)
  console.log('✓ nested json field cleanup')
}

function testPhoneNormalization() {
  assert.equal(normalizeTurkishPhoneDigits('+90 (543) 443-04-68'), '5434430468')
  assert.equal(normalizeTurkishPhoneDigits('05434430468'), '5434430468')
  assert.equal(formatTurkishPhone('905434430468'), '0543 443 04 68')
  const formats = buildPhoneFormats('905434430468')
  assert.equal(formats.gosterim, '0543 443 04 68')
  assert.equal(formats.uluslararasi, '+905434430468')
  assert.ok(buildPhoneSearchVariants('0543 443 04 68').includes('5434430468'))
  assert.ok(buildPhoneSearchVariants('0543 443 04 68').includes('905434430468'))
  console.log('✓ phone normalization')
}

function testPhoneInUnknownColumn() {
  const formatted = formatClearResult({
    contact: '0532 111 22 33',
    ad_soyad: 'Deniz Aksoy',
  })

  assert.equal(formatted.telefon.gosterim, '0532 111 22 33')
  assert.equal(formatted.isim, 'Deniz Aksoy')
  console.log('✓ phone detected in unknown column')
}

async function testApi() {
  const health = await request('/api/health')
  assert.equal(health.status, 200)
  console.log('✓ health')

  const stats = await request('/api/stats')
  assert.equal(stats.status, 200)
  assert.ok(stats.data.stats)
  console.log(`✓ stats (${stats.data.stats.indexed_records} records)`)

  const search = await request('/api/search?q=test')
  assert.equal(search.status, 200)
  assert.ok(Array.isArray(search.data.results))
  if (search.data.results.length > 0) {
    assert.ok('telefon' in search.data.results[0] || 'isim' in search.data.results[0] || 'email' in search.data.results[0] || 'diger' in search.data.results[0])
  }
  console.log('✓ search response shape')

  const empty = await request('/api/search')
  assert.equal(empty.status, 400)
  console.log('✓ empty query rejected')
}

async function run() {
  console.log('Testing Search API...\n')
  testCsvParser()
  testSemicolonCsv()
  testPipeCsv()
  testClearFields()
  testNestedJsonFields()
  testPhoneNormalization()
  testPhoneInUnknownColumn()
  await testApi()
  console.log('\nAll tests passed.')
}

run().catch((error) => {
  console.error('\nTest failed:', error.message)
  process.exit(1)
})
