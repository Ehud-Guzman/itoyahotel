// Seasonal themes. Add an entry to SEASONS (and its copy in SEASON_COPY) to
// theme another occasion in code; the hotel can also add holidays of their own
// from the Studio (Holidays & Greetings) without a deploy — see
// src/data/holidays.js, which turns those documents into the same shape.
//
// Dates are MM-DD, inclusive, in the visitor's local time. A phase whose `to`
// is earlier than its `from` wraps over New Year. A season is active while any
// of its phases matches; the first phase is also its start.
//
// `theme` chooses the look (CSS in src/season.css). A holiday added in the
// Studio picks one too; nothing about a season's name is in the CSS, so any
// number of holidays can share a theme.
//
// Preview out of season with  ?season=christmas  (optionally  &phase=newyear),
// switch it off with  ?season=off . The choice lasts for the browser session.

// chrome = the colour the browser's own address bar takes while the theme is
// on (the <meta name="theme-color"> the boot script swaps). Deep and muted on
// purpose: it sits next to the real UI on a phone.
export const SEASON_THEMES = {
  christmas: { chrome: '#5a1119', label: 'Christmas' },
  sparkle:   { chrome: '#6b4310', label: 'Celebration' },
  simple:    { chrome: '#5b4a33', label: 'Greeting' },
}

export const SEASONS = [
  {
    name: 'christmas',
    theme: 'christmas',
    label: 'Christmas',
    // What the season switches on besides the announcement bar.
    features: { snow: true, themeName: 'festive theme' },
    phases: [
      { id: 'greeting',  from: '12-01', to: '12-23' },
      { id: 'christmas', from: '12-24', to: '12-26' },
      { id: 'newyear',   from: '12-27', to: '01-05' },
    ],
  },
]

// Tokens: {next} is the year a season that began in December leads into
// (Dec 2026 and Jan 2027 -> 2027).
// Per phase:  text/short/cta = the announcement bar,  hero = the line above the
// homepage headline,  festive = the dedicated section under the hero.
// The wording is greetings and an invitation to book. It deliberately promises
// no price, discount or menu: add those here only once the hotel has set them.
export const SEASON_COPY = {
  christmas: {
    greeting: {
      // A sparkle rather than a tree: at 14px a tree reads as a warning sign.
      icon: 'sparkles',
      text: 'Season’s greetings from Hotel Itoya. Spend the festive season with us in Busia.',
      short: 'Season’s greetings from Hotel Itoya',
      cta: { label: 'Book a festive stay' },
      hero: 'Season’s Greetings',
      festive: {
        eyebrow: 'The Festive Season',
        title: 'Celebrate Christmas in Busia',
        body: 'Gather your family, friends or team at Hotel Itoya this season. Stay with us, share a meal, or host your year-end celebration under one roof.',
      },
    },
    christmas: {
      icon: 'gift',
      text: 'Merry Christmas from all of us at Hotel Itoya, Busia.',
      short: 'Merry Christmas from Hotel Itoya',
      cta: { label: 'Book your stay' },
      hero: 'Merry Christmas',
      festive: {
        eyebrow: 'Christmas at Hotel Itoya',
        title: 'Merry Christmas from all of us',
        body: 'Wishing you and your loved ones a joyful Christmas. Our team is here to host your stay, your meals and your celebrations.',
      },
    },
    newyear: {
      icon: 'party',
      text: 'Happy New Year {next} from Hotel Itoya. We look forward to hosting you.',
      short: 'Happy New Year from Hotel Itoya',
      cta: { label: 'Book your stay' },
      hero: 'Happy New Year {next}',
      festive: {
        eyebrow: 'A New Year Begins',
        title: 'Welcome in {next} with us',
        body: 'Start the year in comfort. Book your stay, or plan your first gathering of {next} with the Hotel Itoya team.',
      },
    },
  },
}

/**
 * Works out which season (if any) applies. Pure and self-contained on purpose:
 * vite.config.js inlines this function's source into /season-boot.js so it runs
 * before first paint, which means it must not reference anything outside itself
 * (and is written in plain ES5 for the same reason).
 *
 * @param seasons  the SEASONS array (built-in plus any holidays from the Studio)
 * @param now      a Date
 * @param preview  "off", "<season>" or "<season>:<phase>", or a falsy value
 * @returns {{ name, phase, year, key, theme } | null}  `year` is the year the season began
 */
export function resolveSeason(seasons, now, preview) {
  var mmdd = function (text) {
    var parts = text.split('-')
    return Number(parts[0]) * 100 + Number(parts[1])
  }
  var inPhase = function (phase, value) {
    var from = mmdd(phase.from)
    var to = mmdd(phase.to)
    return from <= to ? value >= from && value <= to : value >= from || value <= to
  }
  var result = function (season, phase, year) {
    return {
      name: season.name,
      phase: phase.id,
      year: year,
      key: season.name + '-' + year,
      theme: season.theme || season.name,
    }
  }

  var parts = preview ? String(preview).split(':') : []
  if (parts[0] === 'off') return null

  var value = (now.getMonth() + 1) * 100 + now.getDate()
  var thisYear = now.getFullYear()

  if (parts[0]) {
    for (var i = 0; i < seasons.length; i++) {
      if (seasons[i].name !== parts[0]) continue
      var chosen = seasons[i].phases[0]
      for (var j = 0; j < seasons[i].phases.length; j++) {
        if (seasons[i].phases[j].id === parts[1]) chosen = seasons[i].phases[j]
      }
      return result(seasons[i], chosen, now.getMonth() < 6 ? thisYear - 1 : thisYear)
    }
  }

  for (var s = 0; s < seasons.length; s++) {
    var season = seasons[s]
    for (var p = 0; p < season.phases.length; p++) {
      if (!inPhase(season.phases[p], value)) continue
      var startsBefore = value < mmdd(season.phases[0].from)
      return result(season, season.phases[p], startsBefore ? thisYear - 1 : thisYear)
    }
  }
  return null
}
