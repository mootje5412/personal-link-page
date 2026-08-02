import { searchDatabases, getLineStats } from '../lib/searchEngine.js'
const root = '/root/api'
const stats = getLineStats(root).stats
const tc = searchDatabases('23480340824', { rootDir: root, type: 'tc', limit: 3 })
const ad = searchDatabases('NESLIHAN', { rootDir: root, type: 'ad', limit: 3 })
console.log(JSON.stringify({
  indexed_records: stats.indexed_records,
  status: stats.status,
  tc_found: tc.found,
  tc_result: tc.results[0] ?? null,
  ad_found: ad.found,
  ad_result: ad.results[0] ?? null,
}, null, 2))
