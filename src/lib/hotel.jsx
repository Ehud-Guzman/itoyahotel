import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { client, SANITY_CONFIGURED } from './sanity'
import { applyFestiveSetting } from './season'
import { DEFAULT_ROOMS, DEFAULT_SETTINGS, mergeRooms, mergeSettings } from './hotelData'

// One source for everything the hotel edits in the Sanity Studio's "Site
// Settings" page and Room documents: phone numbers, email, WhatsApp, hours,
// social links, room prices, occupancy and availability, plus the "pause online
// booking" and "festive theme" switches. Every section reads it through
// useHotel(), so a change made once in the Studio shows up everywhere together.
//
// It starts from the built-in values, so the page renders instantly and still
// works if the CMS is empty or unreachable; real values replace them once they
// arrive. Each value is validated first (see hotelData.js): a bad entry in the
// Studio falls back to the built-in one instead of reaching a guest.

const QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    phones, whatsapp, email, addressLine, town, reservationsHours, frontDeskHours,
    checkInTime, checkOutTime, breakfastHours, lunchHours, dinnerHours,
    facebookUrl, instagramUrl, bookingOpen, bookingPausedMessage, festiveTheme
  },
  "rooms": *[_type == "room" && defined(roomType)]{
    roomType, title, tag, pricePerNight, maxGuests, available, priceNote
  }
}`

const INITIAL = { settings: DEFAULT_SETTINGS, rooms: DEFAULT_ROOMS, loaded: false }

const HotelContext = createContext({ ...INITIAL, refresh: async () => {} })
export { HotelContext }

const STALE_AFTER_MS = 2 * 60 * 1000

export function HotelProvider({ children }) {
  const [data, setData] = useState(INITIAL)
  const lastLoad = useRef(0)

  // `fresh` bypasses Sanity's CDN. Used when a guest opens the booking form, so
  // the price they see is as current as the server's.
  const load = useCallback(async ({ fresh = false } = {}) => {
    if (!SANITY_CONFIGURED) return
    try {
      const source = fresh ? client.withConfig({ useCdn: false }) : client
      const raw = await source.fetch(QUERY)
      lastLoad.current = Date.now()
      const settings = mergeSettings(raw?.settings)
      setData({ settings, rooms: mergeRooms(raw?.rooms), loaded: true })
      applyFestiveSetting(settings.festiveTheme)
    } catch {
      // Keep whatever we have (built-in values or the last good copy).
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Coming back to a tab that has been open a while: pick up anything the hotel changed.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoad.current > STALE_AFTER_MS) load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const value = useMemo(() => ({ ...data, refresh: load }), [data, load])
  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>
}

/** { settings, rooms, loaded, refresh }. Works without a provider (built-in values). */
export const useHotel = () => useContext(HotelContext)
