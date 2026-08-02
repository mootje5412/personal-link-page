import assert from 'node:assert/strict'

const BASE = process.env.API_BASE || 'http://127.0.0.1:8080'

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

  const stats = await request('/api/stats')
  assert.equal(stats.status, 200)
  assert.equal(stats.data.stats.total_lines, 0)
  assert.equal(stats.data.stats.total_data_lines, 0)
  assert.equal(stats.data.stats.indexed_records, 0)
  assert.equal(stats.data.stats.total_files, undefined)
  assert.ok(!('files' in stats.data))
  console.log('✓ line stats (empty databases)')

  const database = await request('/api/database')
  assert.equal(database.status, 200)
  assert.equal(database.data.database.total_records, 0)
  assert.ok(!('files' in database.data))
  console.log('✓ database stats (empty)')

  const search = await request('/api/search?q=test')
  assert.equal(search.status, 200)
  assert.equal(search.data.found, 0)
  assert.equal(search.data.results.length, 0)
  assert.equal(search.data.files_indexed, undefined)
  console.log('✓ search returns empty results')

  const empty = await request('/api/search')
  assert.equal(empty.status, 400)
  console.log('✓ empty query rejected')

  console.log('\nAll tests passed.')
}

run().catch((error) => {
  console.error('\nTest failed:', error.message)
  process.exit(1)
})
