// What the hotel edits in the Sanity Studio, and what the site falls back to
// when a value is missing or invalid.
//
// Pure functions only (no React, no network) so they can be unit-tested. The
// server has its own copy of the same rules in server/lib/siteData.js (the
// server deploys on its own, so it cannot import from src/); tests/hotel.test.mjs
// fails if the two ever drift apart.
//
// Rule of thumb: a bad value in the CMS must never reach a guest. Every field is
// validated one by one, and a field that fails falls back to the built-in value
// for that field alone, so a typo in one place cannot take the rest down.

export const PRICE_MIN = 500        // KES per night
export const PRICE_MAX = 200000
export const USD_MIN = 10           // USD per night
export const USD_MAX = 5000
export const GUESTS_MIN = 1
export const GUESTS_MAX = 10

// ---- how a stay is priced ----
// Two kinds of guest, three meal plans. Kenyan residents pay in shillings,
// international visitors in US dollars. Which kind a guest is gets confirmed at
// the front desk with their ID or passport.
export const RESIDENCIES = [
  { id: 'local',         label: 'Kenyan resident',     currency: 'KES' },
  { id: 'international', label: 'International visitor', currency: 'USD' },
]
export const PLANS = [
  { id: 'bb', label: 'Bed & Breakfast' },
  { id: 'hb', label: 'Half Board' },
  { id: 'fb', label: 'Full Board' },
]

const NONE = { bb: null, hb: null, fb: null }

// The four bookable room types. The ids are what the server and the Studio's
// "Room type" dropdown agree on; the rest is the built-in default. `rates` is
// per room per night; null means "not offered online".
const room = (id, tag, label, maxGuests, local, intl) => ({
  id, tag, label, maxGuests,
  price: local.bb,                      // the Kenyan-resident Bed & Breakfast rate (kept for older code paths)
  note: 'Bed & Breakfast included',
  available: true,
  rates: { local: { ...local }, intl: { ...intl } },
})

export const DEFAULT_ROOMS = [
  room('standard',     'Standard',     'Standard Room',     2, { bb: 3500,  hb: 4500,  fb: 5500 },  { bb: 62,  hb: 80,  fb: 97 }),
  room('deluxe',       'Deluxe',       'Deluxe Room',       3, { bb: 6000,  hb: 7000,  fb: 8000 },  { bb: 106, hb: 124, fb: 142 }),
  room('super-deluxe', 'Super Deluxe', 'Super Deluxe Room', 3, { bb: 7000,  hb: null, fb: null }, NONE),
  room('executive',    'Executive',    'Executive Room',    4, { bb: 10000, hb: 11000, fb: 12000 }, { bb: 162, hb: 179, fb: 197 }),
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

// An optional rate. A number in range is used (KES whole shillings, USD to the cent);
// 0 means "stop offering this plan"; anything else (blank, junk, out of range) keeps
// the built-in value for that plan.
const optionalRate = (value, min, max, builtIn, decimals) => {
  if (value === 0) return null
  const n = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(n) || n < min || n > max) return builtIn
  const f = 10 ** decimals
  return Math.round(n * f) / f
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
    if (!doc) return { ...base, rates: { local: { ...base.rates.local }, intl: { ...base.rates.intl } } }
    const bb = pick(price(doc.pricePerNight), base.price)
    const l = base.rates.local
    const i = base.rates.intl
    return {
      id: base.id,
      tag: pick(text(doc.tag, 24), base.tag),
      label: pick(text(doc.title, 60), base.label),
      price: bb,
      maxGuests: pick(guests(doc.maxGuests), base.maxGuests),
      note: pick(text(doc.priceNote, 60), base.note),
      available: doc.available !== false,
      rates: {
        local: {
          bb,
          hb: optionalRate(doc.halfBoardPrice, PRICE_MIN, PRICE_MAX, l.hb, 0),
          fb: optionalRate(doc.fullBoardPrice, PRICE_MIN, PRICE_MAX, l.fb, 0),
        },
        intl: {
          bb: optionalRate(doc.intlBedAndBreakfast, USD_MIN, USD_MAX, i.bb, 2),
          hb: optionalRate(doc.intlHalfBoard, USD_MIN, USD_MAX, i.hb, 2),
          fb: optionalRate(doc.intlFullBoard, USD_MIN, USD_MAX, i.fb, 2),
        },
      },
    }
  })
}

// ---- rates ----

const bucket = (residency) => (residency === 'international' ? 'intl' : 'local')

export const currencyOf = (residency) => (residency === 'international' ? 'USD' : 'KES')
export const planLabel = (plan) => PLANS.find((p) => p.id === plan)?.label ?? plan

/** Nightly rate for a room / guest type / meal plan, or null if it is not offered. */
export const rateFor = (room, residency, plan) => room?.rates?.[bucket(residency)]?.[plan] ?? null

/** Meal plans offered for a room to this kind of guest, in display order. */
export const availablePlans = (room, residency) => PLANS.filter((p) => rateFor(room, residency, p.id) != null)

/** Lowest nightly rate offered ("from ..."), or null if this kind of guest cannot book the room online. */
export const lowestRate = (room, residency) => {
  const rates = availablePlans(room, residency).map((p) => rateFor(room, residency, p.id))
  return rates.length ? Math.min(...rates) : null
}

/** "KES 3,500" / "USD 62": the currency is always spelled out so nobody mistakes the two. */
export const formatMoney = (amount, currency = 'KES') =>
  `${currency} ${Number(amount).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`

// ---- small helpers used all over the UI ----

export const telHref = (p) => `tel:${String(p).replace(/[^\d+]/g, '')}`
export const waLink = (settings, message) =>
  `https://wa.me/${settings.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`
export const kesFormat = (n) => `KES ${Number(n).toLocaleString('en-KE')}`
