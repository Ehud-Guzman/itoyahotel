import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import {
  DEFAULT_ROOMS, DEFAULT_SETTINGS, mergeRooms, mergeSettings, telHref, waLink, kesFormat, PRICE_MIN, PRICE_MAX, USD_MIN, USD_MAX,
  rateFor, availablePlans, lowestRate, formatMoney, currencyOf, planLabel,
} from '../src/lib/hotelData.js'
import { buildSeed } from '../scripts/generate-studio-seed.mjs'

const require = createRequire(import.meta.url)
const server = require('../server/lib/siteData.js')

// ---------- the website's rules ----------

test('rooms: a Studio edit changes that room only, and untouched fields keep their built-in values', () => {
  const rooms = mergeRooms([{ roomType: 'deluxe', pricePerNight: 6500, maxGuests: 4, title: 'Garden Deluxe' }])
  const deluxe = rooms.find((r) => r.id === 'deluxe')
  assert.equal(deluxe.price, 6500)
  assert.equal(deluxe.maxGuests, 4)
  assert.equal(deluxe.label, 'Garden Deluxe')
  assert.equal(deluxe.tag, 'Deluxe')                              // not edited
  assert.deepEqual(rooms.find((r) => r.id === 'standard'), DEFAULT_ROOMS[0])
  assert.equal(rooms.length, 4)
})

test('rooms: a bad price or guest count never reaches the page', () => {
  for (const bad of [0, 5, PRICE_MIN - 1, PRICE_MAX + 1, NaN, '3500', null]) {
    assert.equal(mergeRooms([{ roomType: 'standard', pricePerNight: bad }])[0].price, 3500, String(bad))
  }
  assert.equal(mergeRooms([{ roomType: 'standard', maxGuests: 99 }])[0].maxGuests, 2)
  assert.equal(mergeRooms([{ roomType: 'standard', available: false }])[0].available, false)
})

test('settings: bad entries fall back one field at a time', () => {
  const s = mergeSettings({ phones: ['+254 700 111 222', 'nope'], email: 'not-an-email', facebookUrl: 'javascript:alert(1)', checkInTime: '1:00 PM' })
  assert.deepEqual(s.phones, ['+254 700 111 222'])
  assert.equal(s.email, DEFAULT_SETTINGS.email)
  assert.equal(s.facebookUrl, DEFAULT_SETTINGS.facebookUrl)
  assert.equal(s.checkInTime, '1:00 PM')
  assert.equal(mergeSettings(null).bookingOpen, true)
  assert.equal(mergeSettings({ bookingOpen: false }).bookingOpen, false)
})

test('helpers', () => {
  assert.equal(telHref('+254 714 302 777'), 'tel:+254714302777')
  assert.equal(telHref('0714-302-777'), 'tel:0714302777')
  assert.equal(waLink(DEFAULT_SETTINGS), 'https://wa.me/254714302777')
  assert.equal(waLink(DEFAULT_SETTINGS, "Hi, I'd like to ask"), 'https://wa.me/254714302777?text=Hi%2C%20I\'d%20like%20to%20ask')
  assert.equal(kesFormat(10000), 'KES 10,000')
})

// ---------- website and server must agree ----------
// They are separate copies of the same rules (the server deploys on its own and
// cannot import from src/). If these fail, one was changed without the other.

test('parity: built-in rooms and settings are identical on the website and the server', () => {
  for (const r of DEFAULT_ROOMS) {
    const { id, ...rest } = r
    assert.deepEqual(server.DEFAULT_ROOMS[id], rest, `room ${id}`)          // includes the KES and USD rate tables
  }
  assert.equal(server.USD_MIN, USD_MIN)
  assert.equal(server.USD_MAX, USD_MAX)
  assert.equal(Object.keys(server.DEFAULT_ROOMS).length, DEFAULT_ROOMS.length)
  assert.deepEqual(server.DEFAULT_SETTINGS, DEFAULT_SETTINGS)
  assert.equal(server.PRICE_MIN, PRICE_MIN)
  assert.equal(server.PRICE_MAX, PRICE_MAX)
})

test('parity: the same CMS data gives the same rooms and settings on the website and the server', () => {
  const awkward = [undefined, null, 0, 1, 499, 500, 3500, 3500.6, 200000, 200001, -1, NaN, Infinity, '3500', '', ' ', {}, [], [1], true, 'x'.repeat(100)]
  const roomSets = [
    [],
    [{ roomType: 'standard', pricePerNight: 4200, maxGuests: 3, available: false, title: 'Garden', tag: 'G', priceNote: 'B&B' }],
    [{ roomType: 'penthouse', pricePerNight: 9999 }, { roomType: 'executive', pricePerNight: 12345 }],
    [{ roomType: 'deluxe', pricePerNight: 6000 }, { roomType: 'deluxe', pricePerNight: 9000 }],
    ...awkward.map((v) => [{ roomType: 'super-deluxe', pricePerNight: v, maxGuests: v, available: v, title: v, tag: v, priceNote: v }]),
    ...awkward.map((v) => [{ roomType: 'standard', halfBoardPrice: v, fullBoardPrice: v, intlBedAndBreakfast: v, intlHalfBoard: v, intlFullBoard: v }]),
    [{ roomType: 'deluxe', intlHalfBoard: 82.555, intlFullBoard: 0, halfBoardPrice: 4800.4, fullBoardPrice: 0 }],
  ]
  for (const raw of roomSets) {
    const web = Object.fromEntries(mergeRooms(raw).map(({ id, ...r }) => [id, r]))
    assert.deepEqual(web, server.normalizeRooms(raw), JSON.stringify(raw))
  }

  const settingSets = [
    null, {}, 'x', 7,
    { phones: ['+254 700 111 222', '0711 222 333', 'bad', 5, null], whatsapp: '+254 700 111 222', email: 'a@b.co', addressLine: ' 1  Road ', town: 'Busia',
      facebookUrl: 'https://fb.com/x', instagramUrl: 'ftp://x', bookingOpen: false, bookingPausedMessage: 'Full', festiveTheme: 'off' },
    ...awkward.map((v) => ({ phones: v, whatsapp: v, email: v, addressLine: v, town: v, reservationsHours: v, frontDeskHours: v, checkInTime: v,
      checkOutTime: v, breakfastHours: v, lunchHours: v, dinnerHours: v, facebookUrl: v, instagramUrl: v, bookingOpen: v, bookingPausedMessage: v, festiveTheme: v })),
  ]
  for (const raw of settingSets) {
    assert.deepEqual(mergeSettings(raw), server.normalizeSettings(raw), JSON.stringify(raw))
  }
})

// ---------- the Studio starter file ----------

test('studio/seed.ndjson matches the site\'s built-in values (regenerate with scripts/generate-studio-seed.mjs)', () => {
  const onDisk = fs.readFileSync(new URL('../studio/seed.ndjson', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  assert.equal(onDisk, buildSeed())
  const docs = onDisk.trim().split('\n').map((l) => JSON.parse(l))
  assert.equal(docs.filter((d) => d._type === 'room').length, 4)
  assert.equal(docs.filter((d) => d._type === 'siteSettings').length, 1)
  assert.ok(docs.every((d) => d._id), 'every document has a fixed _id, so re-importing never duplicates')
})

// ---------- rates: guest types, meal plans, currencies ----------

test('the dollar rates are exactly the ones the hotel quoted', () => {
  const intl = (id) => DEFAULT_ROOMS.find((r) => r.id === id).rates.intl
  assert.deepEqual(intl('standard'), { bb: 62, hb: 80, fb: 97 })
  assert.deepEqual(intl('deluxe'), { bb: 106, hb: 124, fb: 142 })
  assert.deepEqual(intl('executive'), { bb: 162, hb: 179, fb: 197 })
  assert.deepEqual(intl('super-deluxe'), { bb: null, hb: null, fb: null })   // not quoted yet
})

test('rateFor / availablePlans / lowestRate by guest type', () => {
  const standard = DEFAULT_ROOMS[0]
  assert.equal(rateFor(standard, 'local', 'bb'), 3500)
  assert.equal(rateFor(standard, 'local', 'hb'), 4500)
  assert.equal(rateFor(standard, 'international', 'hb'), 80)
  assert.deepEqual(availablePlans(standard, 'local').map((p) => p.id), ['bb', 'hb', 'fb'])
  assert.deepEqual(availablePlans(standard, 'international').map((p) => p.id), ['bb', 'hb', 'fb'])
  assert.equal(lowestRate(standard, 'international'), 62)
  const superDeluxe = DEFAULT_ROOMS.find((r) => r.id === 'super-deluxe')
  assert.equal(lowestRate(superDeluxe, 'international'), null)               // cannot be booked online at dollar rates
  assert.equal(lowestRate(superDeluxe, 'local'), 7000)
  assert.deepEqual(availablePlans(superDeluxe, 'local').map((p) => p.id), ['bb'])         // Super Deluxe: Bed & Breakfast only so far
  assert.equal(rateFor(null, 'local', 'bb'), null)
})

test('rates: edits, cents, 0 = stop offering, junk keeps the built-in value', () => {
  const r = mergeRooms([{ roomType: 'standard', halfBoardPrice: 4800, intlHalfBoard: 82.5, intlFullBoard: 0, intlBedAndBreakfast: 'sixty' }])[0]
  assert.equal(rateFor(r, 'local', 'hb'), 4800)                              // overrides the built-in KES 4,500
  assert.equal(rateFor(r, 'international', 'hb'), 82.5)                      // dollars to the cent
  assert.equal(rateFor(r, 'international', 'fb'), null)                      // 0 stops offering it
  assert.equal(rateFor(r, 'international', 'bb'), 62)                        // junk falls back to the built-in rate
  for (const bad of [USD_MIN - 1, USD_MAX + 1, -5, NaN, '80']) {
    assert.equal(rateFor(mergeRooms([{ roomType: 'standard', intlHalfBoard: bad }])[0], 'international', 'hb'), 80, String(bad))
  }
})

test('currency and plan helpers', () => {
  assert.equal(currencyOf('international'), 'USD')
  assert.equal(currencyOf('local'), 'KES')
  assert.equal(currencyOf(undefined), 'KES')
  assert.equal(planLabel('hb'), 'Half Board')
  assert.equal(formatMoney(62, 'USD'), 'USD 62')
  assert.equal(formatMoney(82.5, 'USD'), 'USD 82.5')
  assert.equal(formatMoney(10000), 'KES 10,000')
})

test('the Kenyan resident rates are exactly the ones the hotel quoted', () => {
  const local = (id) => DEFAULT_ROOMS.find((r) => r.id === id).rates.local
  assert.deepEqual(local('standard'), { bb: 3500, hb: 4500, fb: 5500 })
  assert.deepEqual(local('deluxe'), { bb: 6000, hb: 7000, fb: 8000 })
  assert.deepEqual(local('executive'), { bb: 10000, hb: 11000, fb: 12000 })
  assert.deepEqual(local('super-deluxe'), { bb: 7000, hb: null, fb: null })               // only Bed & Breakfast quoted
})
