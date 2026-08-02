import assert from 'node:assert/strict'

const BASE = process.env.API_BASE || 'http://127.0.0.1:8080'
const KEY = process.env.API_KEY || 'z2GFltjwp4rgccrOJdtc'

async function request(path) {
  const res = await fetch(`${BASE}${path}`)
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function run() {
  console.log('Testing Search API...\n')

  const health = await request('/api/health')
  assert.equal(health.status, 200)
  assert.equal(health.data.ok, true)
  console.log('✓ health')

  const noKey = await request('/api/search?q=0555')
  assert.equal(noKey.status, 401)
  console.log('✓ auth required')

  const stats = await request(`/api/database?key=${KEY}`)
  assert.equal(stats.status, 200)
  assert.ok(stats.data.database.total_records >= 10)
  console.log(`✓ database stats (${stats.data.database.total_records} records)`)

  const phoneSearch = await request(`/api/search?q=05551234567&key=${KEY}`)
  assert.equal(phoneSearch.status, 200)
  assert.ok(phoneSearch.data.results.length >= 1)
  console.log(`✓ phone search (${phoneSearch.data.results.length} hits)`)

  const nameSearch = await request(`/api/search?q=Ahmet&key=${KEY}`)
  assert.equal(nameSearch.status, 200)
  assert.ok(nameSearch.data.results.length >= 1)
  console.log(`✓ name search (${nameSearch.data.results.length} hits)`)

  const emailSearch = await request(`/api/search?q=ayse.demir&key=${KEY}`)
  assert.equal(emailSearch.status, 200)
  assert.ok(emailSearch.data.results.length >= 1)
  console.log(`✓ email search (${emailSearch.data.results.length} hits)`)

  const csvSearch = await request(`/api/search?q=Ali%20Vural&key=${KEY}`)
  assert.equal(csvSearch.status, 200)
  assert.ok(csvSearch.data.results.length >= 1)
  console.log(`✓ csv search (${csvSearch.data.results.length} hits)`)

  const jsonlSearch = await request(`/api/search?q=Zeynep&key=${KEY}`)
  assert.equal(jsonlSearch.status, 200)
  assert.ok(jsonlSearch.data.results.length >= 1)
  console.log(`✓ jsonl search (${jsonlSearch.data.results.length} hits)`)

  const empty = await request(`/api/search?key=${KEY}`)
  assert.equal(empty.status, 400)
  console.log('✓ empty query rejected')

  console.log('\nAll tests passed.')
}

run().catch((error) => {
  console.error('\nTest failed:', error.message)
  process.exit(1)
})
