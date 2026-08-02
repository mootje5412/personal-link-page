import assert from 'node:assert/strict'
import { pgCopyRowToFields, isPostgresqlSqlDump, parsePostgresqlDump } from '../lib/sqlParser.js'

const SAMPLE_PG_DUMP = `--
-- PostgreSQL database dump
--
COPY citizen (uid, national_identifier, first, last, mother_first, father_first, gender, birth_city, date_of_birth, id_registration_city, id_registration_district, address_city, address_district, address_neighborhood, street_address, door_or_entrance_number, misc) FROM stdin;
291990\t23480340824\tNESLIHAN\tZENGIN\tZEYCAN\tOSMAN\tK\tKANGAL\t10/6/1978\tMALATYA\tKULUNCAK\tMALATYA\tKULUNCAK\tISMETPASA MAH.\tBOGAZICI CADDESI\t14\t<NULL>
291991\t17111553172\tSADET\tYILDIRIM\tZOHRE\tISMAIL\tK\tMERSIN\t3/8/1949\tMALATYA\tKULUNCAK\tMALATYA\tKULUNCAK\tISMETPASA MAH.\tCITILBAGI SOKAK\t40\t<NULL>
\\.
`

function testDetectPostgresqlDump() {
  assert.equal(isPostgresqlSqlDump(SAMPLE_PG_DUMP), true)
  assert.equal(isPostgresqlSqlDump('phone,full_name\n05551234567,Ahmet Yilmaz\n'), false)
  console.log('✓ PostgreSQL dump detection')
}

function testPgCopyRowMapping() {
  const columns = ['uid', 'national_identifier', 'first', 'last', 'address_city']
  const fields = pgCopyRowToFields(columns, ['1', '23480340824', 'NESLIHAN', 'ZENGIN', 'MALATYA'])
  assert.equal(fields.first_name, 'NESLIHAN')
  assert.equal(fields.last_name, 'ZENGIN')
  assert.equal(fields.identity_number, '23480340824')
  assert.equal(fields.city, 'MALATYA')
  console.log('✓ PostgreSQL COPY row mapping')
}

function testParsePostgresqlDump() {
  const parsed = parsePostgresqlDump(SAMPLE_PG_DUMP)
  assert.equal(parsed.total_data_lines, 2)
  assert.equal(parsed.fieldRows[0].first_name, 'NESLIHAN')
  assert.equal(parsed.fieldRows[0].identity_number, '23480340824')
  assert.equal(parsed.fieldRows[1].last_name, 'YILDIRIM')
  console.log('✓ PostgreSQL dump parsing')
}

testDetectPostgresqlDump()
testPgCopyRowMapping()
testParsePostgresqlDump()
console.log('\nAll SQL parser tests passed.')
