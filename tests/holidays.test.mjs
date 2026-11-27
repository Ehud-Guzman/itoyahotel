import test from 'node:test'
import assert from 'node:assert/strict'
import { holidayToSeason, seasonsFromDocs } from '../src/data/holidays.js'
import { resolveSeason, SEASONS } from '../src/data/seasons.js'

// The shape the Studio writes for one holiday (see studio/schemas/holiday.js).
const doc = (over = {}) => ({
  _id: 'h1',
  title: 'Eid al-Fitr',
  slug: 'eid-al-fitr',
  startDate: '2027-03-19',
  endDate: '2027-03-21',
  theme: 'sparkle',
  greeting: 'Eid Mubarak',
  barText: 'Eid Mubarak from Hotel Itoya, Busia.',
  barShort: 'Eid Mubarak',
  barCta: 'Book your stay',
  icon: 'moon',
  festive: {
    show: true,
    eyebrow: 'Eid at Hotel Itoya',
    title: 'Eid Mubarak from all of us',
    body: 'A warm welcome to family and friends celebrating in Busia.',
  },
  ...over,
})

test('a holiday the hotel adds becomes a season with MM-DD dates', () => {
  const season = holidayToSeason(doc())
  assert.equal(season.name, 'eid-al-fitr')
  assert.equal(season.theme, 'sparkle')
  assert.deepEqual(season.phases.map((phase) => [phase.from, phase.to]), [['03-19', '03-21']])
})

test('its own wording rides on the phase, so SEASON_COPY is not needed', () => {
  const { copy } = holidayToSeason(doc()).phases[0]
  assert.equal(copy.hero, 'Eid Mubarak')
  assert.equal(copy.text, 'Eid Mubarak from Hotel Itoya, Busia.')
  assert.equal(copy.short, 'Eid Mubarak')
  assert.equal(copy.cta.label, 'Book your stay')
  assert.equal(copy.icon, 'moon')
  assert.equal(copy.festive.eyebrow, 'Eid at Hotel Itoya')
})

test('missing dates or a missing name are unusable rather than half-applied', () => {
  assert.equal(holidayToSeason(doc({ startDate: '' })), null)
  assert.equal(holidayToSeason(doc({ endDate: undefined })), null)
  assert.equal(holidayToSeason(doc({ startDate: '19 March 2027' })), null)
  assert.equal(holidayToSeason(null), null)
  // No slug from the Studio: the document id still gives a stable name.
  assert.equal(holidayToSeason(doc({ slug: null })).name, 'h1')
})

test('blank wording falls back instead of rendering an empty strip', () => {
  const { copy } = holidayToSeason(doc({ greeting: '  ', barText: '', barShort: '', barCta: null, icon: null })).phases[0]
  assert.equal(copy.hero, 'Eid al-Fitr')
  assert.equal(copy.text, 'Eid al-Fitr')
  assert.equal(copy.short, 'Eid al-Fitr')
  assert.equal(copy.cta.label, 'Book your stay')
  assert.equal(copy.icon, 'sparkles')
})

test('switching the invitation off keeps the greeting but drops the section', () => {
  const season = holidayToSeason(doc({ festive: { show: false } }))
  assert.equal(season.phases[0].copy.festive, null)
  assert.equal(season.phases[0].copy.hero, 'Eid Mubarak')
})

test('snow is only offered with the Christmas artwork', () => {
  assert.equal(holidayToSeason(doc({ theme: 'christmas' })).features.snow, true)
  assert.equal(holidayToSeason(doc({ theme: 'christmas', snow: false })).features.snow, false)
  assert.equal(holidayToSeason(doc({ theme: 'sparkle' })).features.snow, false)
  // An unknown theme is harmless: the simplest look.
  assert.equal(holidayToSeason(doc({ theme: 'nonsense' })).theme, 'simple')
})

test('a holiday resolves like any season, including across New Year', () => {
  const { schedule } = seasonsFromDocs([doc({ startDate: '2026-12-30', endDate: '2027-01-02' })])
  const newYear = resolveSeason(schedule, new Date('2027-01-01T10:00:00'), null)
  assert.equal(newYear.name, 'eid-al-fitr')
  assert.equal(newYear.year, 2026, 'January belongs to the holiday that began in December')
  assert.equal(newYear.key, 'eid-al-fitr-2026')
  assert.equal(newYear.theme, 'sparkle')
  assert.equal(resolveSeason(schedule, new Date('2027-02-01T10:00:00'), null), null)
})

test('the built-in seasons are always available, and a holiday may replace one', () => {
  assert.equal(seasonsFromDocs([]).schedule.length, SEASONS.length)

  const { holidays, schedule } = seasonsFromDocs([doc({
    title: 'Christmas',
    slug: 'christmas',
    greeting: 'Merry Christmas',
    theme: 'christmas',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
  })])
  assert.equal(holidays.length, 1)
  assert.equal(schedule.filter((season) => season.name === 'christmas').length, 1, 'no duplicate bar')
  // The hotel's own wording wins, because the holiday is listed first.
  assert.equal(resolveSeason(schedule, new Date('2026-12-10T10:00:00'), null).name, 'christmas')
  assert.equal(schedule[0].phases[0].copy.hero, 'Merry Christmas')
})
