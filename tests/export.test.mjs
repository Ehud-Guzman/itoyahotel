import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingsToCsv } from '../src/admin/exportCsv.js'

test('export: one header row plus one row per booking, quoting commas, quotes and newlines', () => {
  const csv = bookingsToCsv([{ ref: 'A1', name: 'Doe, "J"', requests: 'line1\nline2', amount: 3500, currency: 'KES' }]).slice(1)
  const lines = csv.split('\r\n')
  assert.equal(lines[0].split(',')[0], 'Reference')
  assert.ok(lines[1].startsWith('A1,'))
  assert.ok(csv.includes('"Doe, ""J"""'))
  assert.ok(csv.includes('"line1\nline2"'))
})

test('export: a guest-typed formula is neutralised and ID images are never included', () => {
  const csv = bookingsToCsv([{ ref: 'A2', name: '=HYPERLINK("http://x")', hasIdFront: true }])
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x"")"`))
  assert.ok(!/ID front|idFront|hasId/i.test(csv))
})

test('export: no bookings still gives a valid header-only file', () => {
  assert.equal(bookingsToCsv([]).slice(1).split('\r\n').length, 1)
})
