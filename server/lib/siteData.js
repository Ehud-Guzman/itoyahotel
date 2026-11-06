// What the hotel edits in the Sanity Studio, as the SERVER sees it: room prices
// (the amount a guest is charged), occupancy, availability, contact details and
// the "pause online booking" switch.
//
// The website reads the same documents (src/lib/hotelData.js holds the matching
// defaults and validation). This is a separate copy because the server deploys
// on its own and cannot import from src/; tests/hotel-parity.test.mjs fails if
// the two drift apart.
//
// Why the server fetches this itself instead of trusting the browser: the browser
// only ever tells us what price it SHOWED. The server decides what is charged, so
// it must know the current price independently.
//
// Resilience, in order:
//   1. a fresh copy (cached for TTL_MS)
//   2. the last good copy, if Sanity is unreachable (kept for STALE_MS)
//   3. the built-in defaults, if Sanity has never answered or has no documents
// so a Sanity outage can never stop a guest from booking.

const PRICE_MIN = 500          // KES per night
const PRICE_MAX = 200000
const USD_MIN = 10             // USD per night
const USD_MAX = 5000
const GUESTS_MIN = 1
const GUESTS_MAX = 10

const TTL_MS = 60 * 1000
const STALE_MS = 24 * 60 * 60 * 1000

// Two kinds of guest, three meal plans. Kenyan residents pay in shillings, international
// visitors in US dollars (and reserve online, paying at the hotel: M-Pesa takes shillings
// only). Mirrors src/lib/hotelData.js.
const PLANS = [
  { id: 'bb', label: 'Bed & Breakfast' },
  { id: 'hb', label: 'Half Board' },
  { id: 'fb', label: 'Full Board' },
]
const RESIDENCIES = ['local', 'international']

const NONE = { bb: null, hb: null, fb: null }
const room = (tag, label, maxGuests, local, intl) => ({
  tag, label, maxGuests,
  price: local.bb,                       // Kenyan-resident Bed & Breakfast rate
  note: 'Bed & Breakfast included',
  available: true,
  rates: { local: { ...local }, intl: { ...intl } },
})

const DEFAULT_ROOMS = {
  'standard':     room('Standard',     'Standard Room',     2, { bb: 3500,  hb: 4500,  fb: 5500 },  { bb: 62,  hb: 80,  fb: 97 }),
  'deluxe':       room('Deluxe',       'Deluxe Room',       3, { bb: 6000,  hb: 7000,  fb: 8000 },  { bb: 106, hb: 124, fb: 142 }),
  'super-deluxe': room('Super Deluxe', 'Super Deluxe Room', 3, { bb: 7000,  hb: null, fb: null }, NONE),
  'executive':    room('Executive',    'Executive Room',    4, { bb: 10000, hb: 11000, fb: 12000 }, { bb: 162, hb: 179, fb: 197 }),
}

const DEFAULT_SETTINGS = {
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
  festiveTheme: 'auto',
}

// ---- field validators: a clean value, or undefined = "use the default" ----
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
// An optional rate: in range = used (KES whole shillings, USD to the cent); 0 = stop
// offering this plan; anything else (blank, junk, out of range) keeps the built-in value.
const optionalRate = (value, min, max, builtIn, decimals) => {
  if (value === 0) return null
  const n = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(n) || n < min || n > max) return builtIn
  const f = 10 ** decimals
  return Math.round(n * f) / f
}
const pick = (value, fallback) => (value === undefined ? fallback : value)

function normalizeSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const d = DEFAULT_SETTINGS
  const phones = (Array.isArray(r.phones) ? r.phones : []).map(phone).filter(Boolean).slice(0, 5)
  return {
    phones: phones.length ? phones : [...d.phones],
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
    bookingOpen: r.bookingOpen !== false,
    bookingPausedMessage: text(r.bookingPausedMessage, 300) ?? '',
    festiveTheme: r.festiveTheme === 'off' ? 'off' : 'auto',
  }
}

function normalizeRooms(rawRooms) {
  const list = Array.isArray(rawRooms) ? rawRooms : []
  const rooms = {}
  for (const [id, base] of Object.entries(DEFAULT_ROOMS)) {
    const doc = list.find((r) => r && r.roomType === id)
    if (!doc) {
      rooms[id] = { ...base, rates: { local: { ...base.rates.local }, intl: { ...base.rates.intl } } }
      continue
    }
    const bb = pick(price(doc.pricePerNight), base.price)
    const l = base.rates.local
    const i = base.rates.intl
    rooms[id] = {
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
  }
  return rooms
}

// ---- rates ----
const bucket = (residency) => (residency === 'international' ? 'intl' : 'local')
const currencyOf = (residency) => (residency === 'international' ? 'USD' : 'KES')
const planLabel = (plan) => PLANS.find((p) => p.id === plan)?.label ?? plan

/** Nightly rate for a room / guest type / meal plan, or null if it is not offered. */
const rateFor = (room, residency, plan) => room?.rates?.[bucket(residency)]?.[plan] ?? null

/** "KES 3,500" / "USD 62": the currency is always spelled out. */
const formatMoney = (amount, currency = 'KES') =>
  `${currency} ${Number(amount).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`

// ---- fetching ----

const QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    phones, whatsapp, email, addressLine, town, reservationsHours, frontDeskHours,
    checkInTime, checkOutTime, breakfastHours, lunchHours, dinnerHours,
    facebookUrl, instagramUrl, bookingOpen, bookingPausedMessage, festiveTheme
  },
  "rooms": *[_type == "room" && defined(roomType)] | order(order asc){
    roomType, title, tag, pricePerNight, maxGuests, available, priceNote,
    halfBoardPrice, fullBoardPrice, intlBedAndBreakfast, intlHalfBoard, intlFullBoard
  }
}`

function endpoint() {
  const project = process.env.SANITY_PROJECT_ID || 'okmatxt0'
  const dataset = process.env.SANITY_DATASET || 'production'
  // The live API, not the CDN: this decides what a guest is charged, so it must
  // not lag behind an edit. SANITY_API_HOST exists so tests can point at a stub.
  const host = process.env.SANITY_API_HOST || `https://${project}.api.sanity.io`
  return `${host}/v2024-06-01/data/query/${dataset}?${new URLSearchParams({ query: QUERY })}`
}

async function fetchRemote() {
  const res = await fetch(endpoint(), { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`Sanity responded ${res.status}`)
  const body = await res.json()
  return body.result || {}
}

let cache = null          // { data, fetchedAt }
let inflight = null

function build(result, source) {
  const hasContent = Boolean(result.settings) || (Array.isArray(result.rooms) && result.rooms.length > 0)
  return {
    rooms: normalizeRooms(result.rooms),
    settings: normalizeSettings(result.settings),
    source: hasContent ? source : 'defaults',
  }
}

/**
 * Current rooms + settings. `force` skips the cache (used when a guest's price
 * disagrees with ours, so a just-published change is picked up immediately).
 */
async function getSiteData({ force = false } = {}) {
  const now = Date.now()
  if (!force && cache && now - cache.fetchedAt < TTL_MS) return cache.data
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const data = build(await fetchRemote(), 'sanity')
      cache = { data, fetchedAt: Date.now() }
      return data
    } catch (err) {
      console.error('siteData: could not reach Sanity:', err.message)
      if (cache && Date.now() - cache.fetchedAt < STALE_MS) return { ...cache.data, source: 'stale' }
      return build({}, 'defaults')
    } finally {
      inflight = null
    }
  })()
  return inflight
}

// For tests
function resetSiteDataCache() { cache = null; inflight = null }

module.exports = {
  getSiteData, resetSiteDataCache, normalizeRooms, normalizeSettings,
  PLANS, RESIDENCIES, rateFor, currencyOf, planLabel, formatMoney,
  DEFAULT_ROOMS, DEFAULT_SETTINGS, PRICE_MIN, PRICE_MAX, USD_MIN, USD_MAX, GUESTS_MIN, GUESTS_MAX, TTL_MS,
}
