// What the hotel edits in the Sanity Studio, and what the site falls back to
// when a value is missing or invalid.
//
// Pure functions only (no React, no network) so they can be unit-tested. The
// server has its own copy of the same rules in server/lib/siteData.js (the
// server deploys on its own, so it cannot import from src/); tests/hotel-parity
// fails if the two ever drift apart.
//
// Rule of thumb: a bad value in the CMS must never reach a guest. Every field is
// validated one by one, and a field that fails falls back to the built-in value
// for that field alone, so a typo in one place cannot take the rest down.

export const PRICE_MIN = 500
export const PRICE_MAX = 200000
export const GUESTS_MIN = 1
export const GUESTS_MAX = 10

// The four bookable room types. The ids are what the server and the Studio's
// "Room type" dropdown agree on; the rest is the built-in default.
export const DEFAULT_ROOMS = [
  { id: 'standard',     tag: 'Standard',     label: 'Standard Room',     price: 3500,  maxGuests: 2, note: 'Bed & Breakfast included', available: true },
  { id: 'deluxe',       tag: 'Deluxe',       label: 'Deluxe Room',       price: 6000,  maxGuests: 3, note: 'Bed & Breakfast included', available: true },
  { id: 'super-deluxe', tag: 'Super Deluxe', label: 'Super Deluxe Room', price: 7000,  maxGuests: 3, note: 'Bed & Breakfast included', available: true },
  { id: 'executive',    tag: 'Executive',    label: 'Executive Room',    price: 10000, maxGuests: 4, note: 'Bed & Breakfast included', available: true },
]

export const DEFAULT_SETTINGS = {
  phones: ['+254 714 302 777', '+254 714 666 222', '+254 714 777 333'],
  whatsapp: '254714302777',
  email: 'hotel.itoya@ayotigroup.com',
  addressLine: 'B1 Kisumu-Busia Road',
  town: 'Busia, Kenya',
  reservationsHours: 'Daily 7 AM – 10 PM',
  frontDeskHours: '24 Hours',
  checkInTime: '2:00 PM',
  checkOutTime: '10:00 AM',
  breakfastHours: '6:30 AM – 10:00 AM',
  lunchHours: '12:00 PM – 3:00 PM',
  dinnerHours: '6:00 PM – 10:00 PM',
  facebookUrl: 'https://www.facebook.com/HotelItoyaBusia',
  instagramUrl: 'https://www.instagram.com/hotel_itoya?igsh=cTExaWJxdThobngx',
  bookingOpen: true,
  bookingPausedMessage: '',
  festiveTheme: 'auto',   // 'auto' = follows the calendar (Dec 1 - Jan 5), 'off' = never show it
}

// ---- field validators: each returns a clean value, or `undefined` to mean "use the default" ----

const text = (value, max) => {
  if (typeof value !== 'string') return undefined
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean && clean.length <= max ? clean : undefined
}

const phone = (value) => {
  const clean = text(value, 24)
  if (!clean || !/^[+\d\s()-]+$/.test(clean)) return undefined
  const digits = clean.replace(/\D/g, '').length
  return digits >= 9 && digits <= 15 ? clean : undefined
}

const email = (value) => {
  const clean = text(value, 254)
  return clean && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean) ? clean : undefined
}

// Only http(s) links: a stray "javascript:" value must never become an href.
const url = (value) => {
  const clean = text(value, 300)
  if (!clean) return undefined
  try {
    const u = new URL(clean)
    return u.protocol === 'https:' || u.protocol === 'http:' ? clean : undefined
  } catch {
    return undefined
  }
}

const whatsapp = (value) => {
  const digits = typeof value === 'string' || typeof value === 'number' ? String(value).replace(/\D/g, '') : ''
  return digits.length >= 9 && digits.length <= 15 ? digits : undefined
}

const price = (value) => {
  const n = typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(n) && n >= PRICE_MIN && n <= PRICE_MAX ? Math.round(n) : undefined
}

const guests = (value) => {
  const n = typeof value === 'number' ? value : Number.NaN
  return Number.isInteger(n) && n >= GUESTS_MIN && n <= GUESTS_MAX ? n : undefined
}

const pick = (value, fallback) => (value === undefined ? fallback : value)

/** Settings document from Sanity (or null) -> a complete, safe settings object. */
export function mergeSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const d = DEFAULT_SETTINGS
  const phones = (Array.isArray(r.phones) ? r.phones : []).map(phone).filter(Boolean).slice(0, 5)
  return {
    phones: phones.length ? phones : d.phones,
    whatsapp: pick(whatsapp(r.whatsapp), d.whatsapp),
    email: pick(email(r.email), d.email),
    addressLine: pick(text(r.addressLine, 80), d.addressLine),
    town: pick(text(r.town, 80), d.town),
    reservationsHours: pick(text(r.reservationsHours, 60), d.reservationsHours),
    frontDeskHours: pick(text(r.frontDeskHours, 60), d.frontDeskHours),
    checkInTime: pick(text(r.checkInTime, 30), d.checkInTime),
    checkOutTime: pick(text(r.checkOutTime, 30), d.checkOutTime),
    breakfastHours: pick(text(r.breakfastHours, 40), d.breakfastHours),
    lunchHours: pick(text(r.lunchHours, 40), d.lunchHours),
    dinnerHours: pick(text(r.dinnerHours, 40), d.dinnerHours),
    facebookUrl: pick(url(r.facebookUrl), d.facebookUrl),
    instagramUrl: pick(url(r.instagramUrl), d.instagramUrl),
    bookingOpen: r.bookingOpen !== false,                       // anything but an explicit "off" keeps booking open
    bookingPausedMessage: text(r.bookingPausedMessage, 300) ?? '',
    festiveTheme: r.festiveTheme === 'off' ? 'off' : 'auto',
  }
}

/** Room documents from Sanity (or null) -> the full catalogue of bookable rooms. */
export function mergeRooms(rawRooms) {
  const list = Array.isArray(rawRooms) ? rawRooms : []
  return DEFAULT_ROOMS.map((base) => {
    const doc = list.find((r) => r && r.roomType === base.id)
    if (!doc) return { ...base }
    return {
      id: base.id,
      tag: pick(text(doc.tag, 24), base.tag),
      label: pick(text(doc.title, 60), base.label),
      price: pick(price(doc.pricePerNight), base.price),
      maxGuests: pick(guests(doc.maxGuests), base.maxGuests),
      note: pick(text(doc.priceNote, 60), base.note),
      available: doc.available !== false,
    }
  })
}

// ---- small helpers used all over the UI ----

export const telHref = (p) => `tel:${String(p).replace(/[^\d+]/g, '')}`
export const waLink = (settings, message) =>
  `https://wa.me/${settings.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`
export const kesFormat = (n) => `KES ${Number(n).toLocaleString('en-KE')}`
