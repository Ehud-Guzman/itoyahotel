import { useMemo, useSyncExternalStore } from 'react'
import { SEASONS, SEASON_COPY, SEASON_THEMES } from '../data/seasons'

// /season-boot.js (built by the season-boot plugin in vite.config.js) runs
// before first paint, decides which season applies from the visitor's date and
// records it as data-season-* attributes on <html>. This module reads those
// attributes through useSyncExternalStore, so React and the CSS can never
// disagree about whether a season is on.
//
//   data-season-name/-phase/-year   a season is running (always set in season)
//   data-season                     ...and the visitor has it switched on.
//                                   Holds the THEME (christmas/sparkle/simple),
//                                   which is what the CSS keys on, so a holiday
//                                   the hotel adds in the Studio only needs to
//                                   pick a theme, not a new stylesheet.
//   data-season-bar="closed"        the visitor dismissed the announcement bar
//   data-season-snow="off"          the visitor turned the snow off
//
// Holidays from the Studio are fetched in src/lib/holidays.js and handed to
// setSeasonSchedule(). The boot script reads the same list from localStorage,
// so from the second visit on the right season is applied before first paint.

const CACHE_KEY     = 'season-schedule'
const OPT_OUT_KEY   = 'season-off'
const PREVIEW_KEY   = 'season-preview'
const FORCE_OFF_KEY = 'season-force-off'
const BRAND_CHROME  = '#8c5f2e'   // the brand gold in index.html's theme-color

const readStore = (store, key) => {
  try { return window[store].getItem(key) } catch { return null }
}


const listeners = new Set()

// Bumped whenever the season list changes, and part of the store snapshot: a
// holiday arriving from Sanity after mount has to re-render the bar even though
// none of the data-* attributes changed.
let revision = 0

const subscribe = (callback) => {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

const emit = () => listeners.forEach((callback) => callback())

const read = () => {
  const d = document.documentElement.dataset
  return [revision, d.season, d.seasonName, d.seasonPhase, d.seasonYear, d.seasonBar, d.seasonSnow]
    .map((value) => value || '')
    .join('|')
}

const remember = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the choice just lasts for this page view.
  }
}

const setAttr = (name, value) => {
  const root = document.documentElement
  if (value === null) root.removeAttribute(name)
  else root.setAttribute(name, value)
  emit()
}

/* ---- The season list: the built-in seasons plus the hotel's holidays ---- */

// Written by cacheSchedule() after a fetch, and read here at start-up, so a
// returning visitor has the right theme without waiting for the network.
function cachedHolidays() {
  try {
    const list = JSON.parse(readStore('localStorage', CACHE_KEY) || 'null')?.seasons
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

let schedule = cachedHolidays().concat(SEASONS)

const findSeason = (name) => schedule.find((season) => season.name === name) || null

export function setSeasonSchedule(holidays) {
  schedule = (Array.isArray(holidays) ? holidays : []).concat(SEASONS)
  revision += 1
  emit()
}

// Only the Studio's holidays are cached: the built-in seasons are part of the
// build already, and a stale copy of them could shadow a newer build.
export function cacheSchedule(holidays) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), seasons: holidays }))
  } catch {
    // No storage: the theme still works, it just starts a moment later.
  }
}

export const chromeFor = (season) =>
  season.theme === 'christmas' && season.phase === 'newyear'
    ? '#1f5a3d'
    : SEASON_THEMES[season.theme]?.chrome || BRAND_CHROME

const setThemeColor = (color) => {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
}

// The artwork is its own stylesheet, linked only in season (src/season-art.css),
// so the rest of the year it is never downloaded.
const addArt = () => {
  if (document.getElementById('season-art')) return
  const link = document.createElement('link')
  link.id = 'season-art'
  link.rel = 'stylesheet'
  link.href = '/season-art.css'
  document.head.appendChild(link)
}

const removeArt = () => document.getElementById('season-art')?.remove()

/**
 * Puts a resolved season on the page: the same work /season-boot.js does, for
 * the case where the holiday list arrives from Sanity after the page has
 * loaded. The visitor's own choices (bar dismissed, snow off, theme off) are
 * re-read from storage so they survive the change.
 */
export function applyResolvedSeason(season) {
  const root = document.documentElement

  // The Studio's "never show" switch beats everything, including a holiday
  // added later: the page stays undecorated and the footer switch stays hidden.
  const forcedOff = readStore('localStorage', FORCE_OFF_KEY) === '1'

  if (!season || forcedOff) {
    ;['data-season', 'data-season-name', 'data-season-phase', 'data-season-year', 'data-season-bar', 'data-season-snow']
      .forEach((attr) => root.removeAttribute(attr))
    setThemeColor(BRAND_CHROME)
    removeArt()
    emit()
    return
  }

  root.setAttribute('data-season-name', season.name)
  root.setAttribute('data-season-phase', season.phase)
  root.setAttribute('data-season-year', String(season.year))

  if (readStore('localStorage', OPT_OUT_KEY) === season.key) {
    root.removeAttribute('data-season')
  } else {
    root.setAttribute('data-season', season.theme)
    setThemeColor(chromeFor(season))
    // Only the Christmas look has artwork; the other themes are colour and type,
    // so they must not pay for the 28 kB of garlands.
    if (season.theme === 'christmas') addArt()
    else removeArt()
  }

  setAttr('data-season-bar', readStore('localStorage', 'season-bar') === season.key ? 'closed' : null)
  setAttr('data-season-snow', readStore('localStorage', 'season-snow') === 'off' ? 'off' : null)
}

const describe = (on, name, phase, year) => {
  const season = name ? findSeason(name) : null
  const phaseDef = season?.phases.find((entry) => entry.id === phase)
  // A holiday from the Studio carries its own copy on its phase; the seasons
  // written in code read theirs from SEASON_COPY.
  const raw = phaseDef?.copy ?? SEASON_COPY[name]?.[phase] ?? null
  const next = String(Number(year) + 1)
  const fill = (value) => (typeof value === 'string' ? value.replaceAll('{next}', next) : value)
  const { seasonBar, seasonSnow } = document.documentElement.dataset

  return {
    name,
    phase,
    year: Number(year) || 0,
    label: season?.label || '',
    theme: on || season?.theme || '',
    available: Boolean(name),
    active: Boolean(on),
    barClosed: seasonBar === 'closed',
    snowOn: seasonSnow !== 'off',
    features: season?.features || {},
    copy: raw && {
      ...raw,
      text: fill(raw.text),
      short: fill(raw.short),
      hero: fill(raw.hero),
      cta: raw.cta && { ...raw.cta, label: fill(raw.cta.label) },
      festive: raw.festive && {
        ...raw.festive,
        eyebrow: fill(raw.festive.eyebrow),
        title: fill(raw.festive.title),
        body: fill(raw.festive.body),
      },
    },
  }
}

export function useSeason() {
  const snapshot = useSyncExternalStore(subscribe, read, () => '')

  return useMemo(() => {
    const [, on, name, phase, year] = snapshot.split('|')
    return describe(on, name, phase, year)
  }, [snapshot])
}

// The same answer outside React, for the chatbot: its opening line is built
// before any component mounts.
export function currentSeason() {
  const d = document.documentElement.dataset
  if (!d.season || !d.seasonName) return null
  return describe(d.season, d.seasonName, d.seasonPhase, d.seasonYear)
}

// Called with the hotel's "Festive Christmas theme" choice from the Studio.
// 'off' removes the theme now and is remembered, so /season-boot.js skips it
// before first paint on later visits (otherwise it would flash on every load).
// A ?season= preview in the address bar still overrides it, for testing.
export function applyFestiveSetting(mode) {
  remember(FORCE_OFF_KEY, mode === 'off' ? '1' : null)
  if (mode !== 'off') return
  // Someone previewing with ?season=... asked to see it: leave it on for this tab.
  if (readStore('sessionStorage', PREVIEW_KEY)) return
  applyResolvedSeason(null)
}

// Master switch for whichever season is running (the footer's "Turn off the
// festive theme").
export function setFestive(on) {
  const { seasonName, seasonPhase, seasonYear } = document.documentElement.dataset
  if (!seasonName) return
  const key = `${seasonName}-${seasonYear}`
  // Keyed by season (christmas-2026), not a bare flag: an opt-out lasts for the
  // season the guest said it about, and next December they see the theme again.
  remember(OPT_OUT_KEY, on ? null : key)
  applyResolvedSeason({
    name: seasonName,
    phase: seasonPhase || 'greeting',
    year: Number(seasonYear),
    key,
    theme: findSeason(seasonName)?.theme || seasonName,
  })
}

export function setSnow(on) {
  remember('season-snow', on ? null : 'off')
  setAttr('data-season-snow', on ? null : 'off')
}

export function closeBar() {
  const { seasonName, seasonYear } = document.documentElement.dataset
  if (!seasonName) return
  remember('season-bar', `${seasonName}-${seasonYear}`)
  setAttr('data-season-bar', 'closed')
}
