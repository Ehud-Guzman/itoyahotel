const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const {
  getSiteData, resetSiteDataCache, normalizeRooms, normalizeSettings,
  DEFAULT_ROOMS, DEFAULT_SETTINGS, PRICE_MIN, PRICE_MAX,
} = require('../lib/siteData')

// ---------- validation: a bad value in the CMS must never reach a guest ----------

test('rooms: valid edits are applied per room type', () => {
  const rooms = normalizeRooms([
    { roomType: 'standard', title: 'Garden Room', tag: 'Garden', pricePerNight: 4200, maxGuests: 3, available: true, priceNote: 'Breakfast included' },
    { roomType: 'executive', pricePerNight: 12000.4 },
  ])
  assert.deepEqual(rooms.standard, { tag: 'Garden', label: 'Garden Room', price: 4200, maxGuests: 3, note: 'Breakfast included', available: true })
  assert.equal(rooms.executive.price, 12000)                   // rounded
  assert.equal(rooms.executive.label, 'Executive Room')        // untouched fields keep defaults
  assert.deepEqual(rooms.deluxe, DEFAULT_ROOMS.deluxe)         // rooms without a document keep defaults
})

test('rooms: nonsense prices fall back to the built-in price, never to 0 or NaN', () => {
  for (const bad of [0, 1, PRICE_MIN - 1, PRICE_MAX + 1, -3500, NaN, Infinity, '5000', null, undefined, {}, [4000]]) {
    const rooms = normalizeRooms([{ roomType: 'standard', pricePerNight: bad }])
    assert.equal(rooms.standard.price, DEFAULT_ROOMS.standard.price, `price ${String(bad)}`)
  }
  assert.equal(normalizeRooms([{ roomType: 'standard', pricePerNight: PRICE_MIN }]).standard.price, PRICE_MIN)
  assert.equal(normalizeRooms([{ roomType: 'standard', pricePerNight: PRICE_MAX }]).standard.price, PRICE_MAX)
})

test('rooms: occupancy, availability, unknown types and duplicates', () => {
  assert.equal(normalizeRooms([{ roomType: 'deluxe', maxGuests: 0 }]).deluxe.maxGuests, DEFAULT_ROOMS.deluxe.maxGuests)
  assert.equal(normalizeRooms([{ roomType: 'deluxe', maxGuests: 11 }]).deluxe.maxGuests, DEFAULT_ROOMS.deluxe.maxGuests)
  assert.equal(normalizeRooms([{ roomType: 'deluxe', maxGuests: 2.5 }]).deluxe.maxGuests, DEFAULT_ROOMS.deluxe.maxGuests)
  assert.equal(normalizeRooms([{ roomType: 'deluxe', maxGuests: 5 }]).deluxe.maxGuests, 5)
  assert.equal(normalizeRooms([{ roomType: 'deluxe', available: false }]).deluxe.available, false)
  assert.equal(normalizeRooms([{ roomType: 'deluxe' }]).deluxe.available, true)                  // missing = available
  assert.deepEqual(Object.keys(normalizeRooms([{ roomType: 'penthouse', pricePerNight: 1 }])), Object.keys(DEFAULT_ROOMS))
  assert.equal(normalizeRooms([{ roomType: 'standard', pricePerNight: 4000 }, { roomType: 'standard', pricePerNight: 9000 }]).standard.price, 4000)
  assert.deepEqual(normalizeRooms(null), normalizeRooms([]))
  assert.deepEqual(normalizeRooms('garbage'), normalizeRooms([]))
})

test('settings: contact details are validated field by field', () => {
  const s = normalizeSettings({
    phones: ['+254 700 111 222', 'call me', '12', '0711 222 333'],
    whatsapp: '+254 700 111 222', email: 'front@hotel.example', checkInTime: '  1:00   PM ',
    facebookUrl: 'https://facebook.com/itoya', instagramUrl: 'javascript:alert(1)',
  })
  assert.deepEqual(s.phones, ['+254 700 111 222', '0711 222 333'])     // junk entries dropped, good ones kept
  assert.equal(s.whatsapp, '254700111222')
  assert.equal(s.email, 'front@hotel.example')
  assert.equal(s.checkInTime, '1:00 PM')                                 // whitespace tidied
  assert.equal(s.facebookUrl, 'https://facebook.com/itoya')
  assert.equal(s.instagramUrl, DEFAULT_SETTINGS.instagramUrl)            // a javascript: link can never become an href
})

test('settings: empty or broken settings fall back entirely, and booking stays open', () => {
  for (const raw of [null, undefined, {}, 'x', 42, { phones: 'not-a-list', email: 5, bookingOpen: 'maybe' }]) {
    const s = normalizeSettings(raw)
    assert.deepEqual(s.phones, DEFAULT_SETTINGS.phones)
    assert.equal(s.email, DEFAULT_SETTINGS.email)
    assert.equal(s.bookingOpen, true)
    assert.equal(s.festiveTheme, 'auto')
  }
  assert.equal(normalizeSettings({ bookingOpen: false }).bookingOpen, false)       // only an explicit "off" pauses booking
  assert.equal(normalizeSettings({ festiveTheme: 'off' }).festiveTheme, 'off')
  assert.equal(normalizeSettings({ festiveTheme: 'whatever' }).festiveTheme, 'auto')
  assert.deepEqual(normalizeSettings({ phones: Array(9).fill('0712 345 678') }).phones.length, 5)   // capped
})

// ---------- fetching, caching and outages (against a stub Sanity) ----------

function stubSanity() {
  const state = { requests: 0, mode: 'ok', result: { settings: null, rooms: [] } }
  const server = http.createServer((req, res) => {
    state.requests++
    if (state.mode === 'down') { res.statusCode = 503; return res.end('unavailable') }
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ result: state.result }))
  })
  return new Promise((resolve) => server.listen(0, () => {
    process.env.SANITY_API_HOST = `http://127.0.0.1:${server.address().port}`
    resolve({ state, server })
  }))
}

test('getSiteData: reads the CMS, caches briefly, and force skips the cache', async () => {
  const { state, server } = await stubSanity()
  resetSiteDataCache()
  state.result = { settings: { phones: ['+254 700 000 001'] }, rooms: [{ roomType: 'standard', pricePerNight: 4000 }] }

  const a = await getSiteData()
  assert.equal(a.source, 'sanity')
  assert.equal(a.rooms.standard.price, 4000)
  assert.deepEqual(a.settings.phones, ['+254 700 000 001'])

  state.result.rooms[0].pricePerNight = 5000                  // the hotel publishes a change...
  assert.equal((await getSiteData()).rooms.standard.price, 4000)   // ...a normal read can still see the cached copy
  assert.equal(state.requests, 1)
  assert.equal((await getSiteData({ force: true })).rooms.standard.price, 5000)   // ...but force sees it immediately
  server.close()
})

test('getSiteData: concurrent callers share one request', async () => {
  const { state, server } = await stubSanity()
  resetSiteDataCache()
  await Promise.all(Array.from({ length: 10 }, () => getSiteData({ force: true })))
  assert.equal(state.requests, 1)
  server.close()
})

test('getSiteData: if the CMS goes down, the last good copy keeps serving', async () => {
  const { state, server } = await stubSanity()
  resetSiteDataCache()
  state.result = { settings: null, rooms: [{ roomType: 'deluxe', pricePerNight: 6500 }] }
  await getSiteData({ force: true })
  state.mode = 'down'
  const during = await getSiteData({ force: true })
  assert.equal(during.source, 'stale')
  assert.equal(during.rooms.deluxe.price, 6500)               // not the default 6000: it kept what it knew
  server.close()
})

test('getSiteData: CMS unreachable and nothing cached means the built-in prices (booking still works)', async () => {
  const { state, server } = await stubSanity()
  resetSiteDataCache()
  state.mode = 'down'
  const data = await getSiteData({ force: true })
  assert.equal(data.source, 'defaults')
  assert.equal(data.rooms.standard.price, DEFAULT_ROOMS.standard.price)
  assert.equal(data.settings.bookingOpen, true)
  server.close()
})

test('getSiteData: an empty CMS (no documents yet) behaves like the defaults', async () => {
  const { state, server } = await stubSanity()
  resetSiteDataCache()
  state.result = { settings: null, rooms: [] }
  const data = await getSiteData({ force: true })
  assert.equal(data.source, 'defaults')
  assert.deepEqual(data.rooms.executive, DEFAULT_ROOMS.executive)
  server.close()
})
