import { client, SANITY_CONFIGURED } from './sanity'
import { HOLIDAY_QUERY, seasonsFromDocs } from '../data/holidays'
import { resolveSeason } from '../data/seasons'
import { applyResolvedSeason, cacheSchedule, setSeasonSchedule } from './season'

// Fetches the holidays the hotel added in the Studio once per page view and
// hands them to the season engine. Runs after the first paint, so the page is
// never blocked on it: the boot script has already used last visit's cached
// copy, and this only has to correct it when the hotel has changed something.
//
// Nothing here is required for the built-in seasons — if Sanity is missing or
// unreachable the site keeps the Christmas it ships with.

let started = false

const preview = () => {
  try { return sessionStorage.getItem('season-preview') } catch { return null }
}

export async function syncHolidays() {
  if (started || !SANITY_CONFIGURED || !client) return
  started = true

  let docs
  try {
    docs = await client.fetch(HOLIDAY_QUERY)
  } catch {
    return   // offline, blocked or not deployed yet: keep what the page already has
  }

  const { holidays, schedule } = seasonsFromDocs(docs)
  cacheSchedule(holidays)
  setSeasonSchedule(holidays)
  // Re-resolve: a holiday may have started or ended since the last visit, and
  // the copy may have been edited. Applying the same season again is a no-op.
  applyResolvedSeason(resolveSeason(schedule, new Date(), preview()))
}
