import { useMemo, useSyncExternalStore } from 'react'
import { SEASON_COPY, SEASON_FEATURES } from '../data/seasons'

// /season-boot.js (built by the season-boot plugin in vite.config.js) runs
// before first paint, decides which season applies from the visitor's date and
// records it as data-season-* attributes on <html>. This module reads those
// attributes through useSyncExternalStore, so React and the CSS can never
// disagree about whether a season is on.
//
//   data-season-name/-phase/-year   a season is running (always set in season)
//   data-season                     ...and the visitor has it switched on
//   data-season-bar="closed"        the visitor dismissed the announcement bar
//   data-season-snow="off"          the visitor turned the snow off

const listeners = new Set()

const subscribe = (callback) => {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

const read = () => {
  const d = document.documentElement.dataset
  return [d.season, d.seasonName, d.seasonPhase, d.seasonYear, d.seasonBar, d.seasonSnow]
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
  listeners.forEach((callback) => callback())
}

export function useSeason() {
  const snapshot = useSyncExternalStore(subscribe, read, () => '')

  return useMemo(() => {
    const [on, name, phase, year, bar, snow] = snapshot.split('|')
    const raw = name ? (SEASON_COPY[name]?.[phase] ?? null) : null
    const next = String(Number(year) + 1)
    const fill = (text) => text.replaceAll('{next}', next)

    return {
      name,
      phase,
      year: Number(year),
      available: Boolean(name),
      active: Boolean(on),
      barClosed: bar === 'closed',
      snowOn: snow !== 'off',
      features: (name && SEASON_FEATURES[name]) || {},
      copy: raw && { ...raw, text: fill(raw.text), short: fill(raw.short) },
    }
  }, [snapshot])
}

// Master switch for the whole festive theme.
export function setFestive(on) {
  const { seasonName } = document.documentElement.dataset
  if (!seasonName) return
  remember('season-off', on ? null : '1')
  setAttr('data-season', on ? seasonName : null)
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
