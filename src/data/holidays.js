import { SEASONS, SEASON_THEMES } from './seasons.js'

// Holidays the hotel adds in the Studio ("Holidays & Greetings") arrive as
// documents; this turns one into exactly the shape resolveSeason() and
// useSeason() already understand, so a holiday from the CMS and a season
// written in code are interchangeable.
//
// Pure on purpose (no Sanity client, no DOM, no React): the fetch lives in
// src/lib/holidays.js and this half is unit-tested in tests/holidays.test.mjs.
//
// The Studio stores real dates (2026-12-20); the season engine works in MM-DD
// so a holiday can wrap over New Year and can be left enabled year after year.
// Holidays that move (Eid, Easter) need their dates updated each year — the
// Studio says so on the field.

export const HOLIDAY_QUERY = `*[_type == "holiday" && coalesce(enabled, true) && defined(startDate) && defined(endDate)]
  | order(startDate asc) {
    _id, title, "slug": slug.current, startDate, endDate,
    theme, snow, icon, greeting, barText, barShort, barCta,
    festive { show, eyebrow, title, body }
  }`

const DEFAULTS = {
  icon: 'sparkles',
  cta: 'Book your stay',
}

const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : '')

// "2026-12-20" -> "12-20". Anything else is treated as missing.
const monthDay = (value) => {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(text(value))
  return match ? `${match[1]}-${match[2]}` : ''
}

/**
 * One Studio holiday document -> one season, or null if it can't be used.
 * A holiday has a single phase (`holiday`) and carries its own copy, so the
 * wording lives with the document instead of in SEASON_COPY.
 */
export function holidayToSeason(doc) {
  if (!doc) return null

  const from = monthDay(doc.startDate)
  const to = monthDay(doc.endDate)
  if (!from || !to) return null

  const name = text(doc.slug) || text(doc._id)
  const title = text(doc.title) || 'Celebration'
  if (!name) return null

  const theme = SEASON_THEMES[doc.theme] ? doc.theme : 'simple'
  const greeting = text(doc.greeting) || title
  const festive = doc.festive && doc.festive.show === false
    ? null
    : {
        eyebrow: text(doc.festive?.eyebrow) || title,
        title: text(doc.festive?.title) || greeting,
        body: text(doc.festive?.body),
      }

  const copy = {
    icon: text(doc.icon) || DEFAULTS.icon,
    text: text(doc.barText) || greeting,
    short: text(doc.barShort) || text(doc.barText) || greeting,
    cta: { label: text(doc.barCta) || DEFAULTS.cta },
    hero: greeting,
    festive,
  }

  return {
    name,
    label: title,
    theme,
    features: {
      // Snow belongs to the Christmas artwork; the other themes have none, and
      // the Studio switch can turn it off even then.
      snow: theme === 'christmas' && doc.snow !== false,
      themeName: theme === 'christmas' ? 'festive theme' : `${title.toLowerCase()} greeting`,
    },
    phases: [{ id: 'holiday', from, to, copy }],
  }
}

/**
 * All the seasons for the site: the hotel's holidays first, then the ones
 * written in code. A holiday with the same name as a built-in wins (it is the
 * newer decision), which also keeps a hotel-made "Christmas" from showing twice.
 */
export function seasonsFromDocs(docs) {
  const holidays = (Array.isArray(docs) ? docs : []).map(holidayToSeason).filter(Boolean)
  const names = new Set(holidays.map((holiday) => holiday.name))
  return { holidays, schedule: holidays.concat(SEASONS.filter((season) => !names.has(season.name))) }
}
