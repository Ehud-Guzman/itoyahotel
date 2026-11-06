// Built-in room catalogue: the values used until the hotel's own arrive from the
// Sanity Studio, and whenever the CMS is empty or unreachable. The LIVE catalogue
// (prices, guests, availability) comes from useHotel() in ./hotel.jsx, so prefer
// that inside components. See ./hotelData.js for the defaults and the validation.
import { DEFAULT_ROOMS } from './hotelData'

export const ROOM_CATALOG = DEFAULT_ROOMS

export function priceForTag(tag) {
  return ROOM_CATALOG.find((r) => r.tag === tag)?.price ?? null
}
