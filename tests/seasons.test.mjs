import test from 'node:test'
import assert from 'node:assert/strict'
import { SEASONS, SEASON_COPY, resolveSeason } from '../src/data/seasons.js'

const at = (iso, preview) => resolveSeason(SEASONS, new Date(iso), preview)

test('outside the festive window there is no season', () => {
  for (const d of ['2026-10-31T12:00:00', '2026-11-30T23:59:00', '2027-01-06T00:00:00', '2027-07-15T12:00:00']) {
    assert.equal(at(d), null, d)
  }
})

test('phases and boundaries', () => {
  const phase = (d) => at(d)?.phase
  assert.equal(phase('2026-12-01T00:00:00'), 'greeting')
  assert.equal(phase('2026-12-23T23:59:00'), 'greeting')
  assert.equal(phase('2026-12-24T00:00:00'), 'christmas')
  assert.equal(phase('2026-12-26T23:59:00'), 'christmas')
  assert.equal(phase('2026-12-27T00:00:00'), 'newyear')
  assert.equal(phase('2027-01-05T23:59:00'), 'newyear')
})

test('a season that wraps New Year keeps the year it began in', () => {
  assert.equal(at('2026-12-27T10:00:00').year, 2026)
  assert.equal(at('2027-01-02T10:00:00').year, 2026)       // January belongs to the season that began in December
  assert.equal(at('2027-01-02T10:00:00').key, 'christmas-2026')
})

test('preview parameter', () => {
  assert.equal(at('2026-10-31T12:00:00', 'christmas').name, 'christmas')
  assert.equal(at('2026-10-31T12:00:00', 'christmas:newyear').phase, 'newyear')
  assert.equal(at('2026-10-31T12:00:00', 'christmas:nonsense').phase, 'greeting')   // unknown phase falls back to the first
  assert.equal(at('2026-12-10T12:00:00', 'off'), null)                              // ?season=off wins in season
  assert.equal(at('2026-10-31T12:00:00', 'no-such-season'), null)
})

test('every phase of every season has copy, and the copy promises no price or discount', () => {
  for (const season of SEASONS) {
    for (const phase of season.phases) {
      const copy = SEASON_COPY[season.name]?.[phase.id]
      assert.ok(copy, `${season.name}/${phase.id} has no copy`)
      assert.ok(copy.text && copy.short && copy.cta?.label)
      assert.doesNotMatch(`${copy.text} ${copy.short}`, /%|KES|discount|offer|free/i, 'no invented offers in seasonal copy')
    }
  }
})

test('resolveSeason is self-contained (it is inlined into /season-boot.js)', () => {
  // Rebuild it from its own source in an empty scope: it must not reference module-level names.
  const standalone = new Function(`return (${resolveSeason.toString()})`)()
  assert.equal(standalone(SEASONS, new Date('2026-12-25T12:00:00'), null).phase, 'christmas')
})
