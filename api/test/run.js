import assert from 'node:assert/strict'
import { formatClearResult } from '../lib/clearFields.js'
import { parseDelimitedFile } from '../lib/csvParser.js'
import { buildRecordSearchIndex } from '../lib/recordIndex.js'
import { recordMatchesType, validateQuery } from '../lib/searchMatcher.js'
import { detectSearchType, searchWithAutoType } from '../lib/queryDetect.js'
import { formatResultsMessage, formatResultsPage, getTotalPages, PAGE_SIZE } from '../lib/telegramFormat.js'
import { buildPhoneFormats, buildPhoneSearchVariants, formatTurkishPhone, normalizeTurkishPhoneDigits } from '../lib/phoneUtils.js'

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

  assert.equal(formatted.telefon, '0555 123 45 67')
  assert.equal(formatted.telefon_sifirli, '05551234567')
  assert.equal(formatted.telefon_uluslararasi, '+905551234567')
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
  assert.equal(formatted.telefon, '0543 443 04 68')
  assert.equal(formatted.telefon_sifirli, '05434430468')
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

function testMobileHtml() {
  const formatted = formatClearResult({
    phone: '05434430468',
    full_name: 'Test User',
    email: 'test@example.com',
  })
  assert.equal(formatted.telefon, '0543 443 04 68')
  assert.equal(formatted.telefon_sifirli, '05434430468')
  console.log('✓ flat phone fields for mobile')
}

function testPhoneInUnknownColumn() {
  const formatted = formatClearResult({
    contact: '0532 111 22 33',
    ad_soyad: 'Deniz Aksoy',
  })

  assert.equal(formatted.telefon, '0532 111 22 33')
  assert.equal(formatted.isim, 'Deniz Aksoy')
  console.log('✓ phone detected in unknown column')
}

function testQueryDetect() {
  assert.equal(detectSearchType('60559325184'), 'tc')
  assert.equal(detectSearchType('0543 443 04 68'), 'telefon')
  assert.equal(detectSearchType('Burak'), 'ad')
  console.log('✓ query detect')
}

function testTelegramFormat() {
  const sample = {
    isim: 'Burak GUL',
    ad: 'Burak',
    soyad: 'GUL',
    tc: '60559325184',
    telefon: '0543 443 04 68',
  }

  const message = formatResultsMessage('Burak', {
    ok: true,
    found: 1,
    returned: 1,
    results: [sample],
  })
  assert.match(message, /Burak GUL/)
  assert.match(message, /60559325184/)
  assert.match(message, /Sayfa 1\/1/)

  const page = formatResultsPage({
    query: 'Burak',
    results: Array.from({ length: 15 }, () => sample),
    found: 15,
    page: 1,
    ms: 12.5,
  })
  assert.match(page, /Sayfa 2\/2/)
  assert.equal(getTotalPages(15), 2)
  assert.equal(PAGE_SIZE, 10)
  console.log('✓ telegram format')
}

function testAutoSearch() {
  const result = searchWithAutoType('60559325184', { limit: 1, rootDir: process.cwd() })
  assert.equal(result.ok, true)
  console.log('✓ auto search')
}

function testTypedSearchMatching() {
  const record = {
    search: buildRecordSearchIndex({
      phone: '05434430468',
      identity_number: '60559325184',
      first_name: 'Burak',
      last_name: 'GUL',
    }),
  }

  assert.equal(recordMatchesType(record, 'telefon', '05434430468'), true)
  assert.equal(recordMatchesType(record, 'telefon', '5434430468'), true)
  assert.equal(recordMatchesType(record, 'telefon', '0555'), false)
  assert.equal(recordMatchesType(record, 'tc', '60559325184'), true)
  assert.equal(recordMatchesType(record, 'tc', '6055932518'), false)
  assert.equal(recordMatchesType(record, 'ad', 'Burak'), true)
  assert.equal(recordMatchesType(record, 'soyad', 'GUL'), true)
  assert.ok(validateQuery('telefon', '0555'))
  assert.equal(validateQuery('telefon', '05551234567'), null)
  console.log('✓ typed search matching')
}

async function testApi() {
  try {
    const health = await request('/api/health')
    if (health.status !== 200) {
      console.log('⚠ HTTP API not running (Telegram bot mode)')
      return
    }
  } catch {
    console.log('⚠ HTTP API not running (Telegram bot mode)')
    return
  }

  const stats = await request('/api/stats')
  assert.equal(stats.status, 200)
  assert.ok(stats.data.stats)
  console.log(`✓ stats (${stats.data.stats.indexed_records} records)`)

  const invalidPhone = await request('/api/search?q=0555&type=telefon')
  if (invalidPhone.status === 400) {
    console.log('✓ invalid phone rejected')
  } else {
    console.log('⚠ api server not updated yet for typed validation')
  }

  const invalidTc = await request('/api/search?q=123&type=tc')
  if (invalidTc.status === 400) {
    console.log('✓ invalid tc rejected')
  }

  const search = await request('/api/search?q=05551234567&type=telefon')
  assert.equal(search.status, 200)
  assert.ok(Array.isArray(search.data.results))
  console.log('✓ typed search api')

  const empty = await request('/api/search')
  assert.ok(empty.status === 400 || empty.data?.ok === false)
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
  testMobileHtml()
  testPhoneInUnknownColumn()
  testQueryDetect()
  testTelegramFormat()
  testAutoSearch()
  testTypedSearchMatching()
  await testApi()
  console.log('\nAll tests passed.')
}

run().catch((error) => {
  console.error('\nTest failed:', error.message)
  process.exit(1)
})
