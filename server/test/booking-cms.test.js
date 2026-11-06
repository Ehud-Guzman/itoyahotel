// The booking route against a stub CMS: the hotel edits prices, occupancy,
// availability and the "pause booking" switch in the Studio, and the server must
// follow, and must never charge a guest a price they were not shown.
const { resetBookings, closeHelpers } = require('./helpers')
Object.assign(process.env, { NODE_ENV: 'test', EMAIL_USER: 'bookings@example.test', HOTEL_EMAIL: 'hotel@example.test' })
delete process.env.MPESA_ENV
delete process.env.MPESA_CONSUMER_KEY

const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const express = require('express')

const sent = []
require('../lib/mailer').createTransporter = () => ({
  sendMail: async (m) => { sent.push({ to: m.to, html: m.html }) },
})

const store = require('../store')
const { resetSiteDataCache } = require('../lib/siteData')
const bookingRouter = require('../routes/booking')

const cms = { settings: null, rooms: [] }
let cmsServer, server, base

test.before(async () => {
  cmsServer = http.createServer((_req, res) => {
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ result: cms }))
  })
  await new Promise((r) => cmsServer.listen(0, r))
  process.env.SANITY_API_HOST = `http://127.0.0.1:${cmsServer.address().port}`

  await resetBookings()
  await store.init()
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json())
  app.use('/api/booking', bookingRouter)
  server = http.createServer(app)
  await new Promise((r) => server.listen(0, r))
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(async () => {
  server.close(); cmsServer.close()
  await store.close()
  await closeHelpers()
})
test.beforeEach(() => {
  sent.length = 0
  cms.settings = null
  cms.rooms = []
  resetSiteDataCache()
})

let client = 1
const future = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)
const png = () => new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], { type: 'image/jpeg' })
function book(overrides = {}) {
  const fd = new FormData()
  const fields = {
    room: 'standard', checkIn: future(10), checkOut: future(12), guests: '1', name: 'Jane Doe',
    phone: '0712345678', email: 'jane@example.com', mpesaPhone: '254712345678', clientRequestId: crypto.randomUUID(),
    ...overrides,
  }
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(k, v)
  fd.append('idFront', png(), 'f.jpg'); fd.append('idBack', png(), 'b.jpg')
  return fetch(`${base}/api/booking/initiate`, { method: 'POST', body: fd, headers: { 'x-forwarded-for': `10.9.0.${client++}` } })
}
const settle = () => new Promise((r) => setTimeout(r, 40))

test('with an empty CMS the built-in prices apply', async () => {
  const res = await book({ expectedAmount: '7000' })
  assert.equal(res.status, 200)
  assert.equal((await store.getByRef((await res.json()).ref)).b.amount, 7000)
})

test('a price the hotel sets in the Studio is the price charged', async () => {
  cms.rooms = [{ roomType: 'standard', pricePerNight: 5000 }]
  const res = await book({ expectedAmount: '10000' })              // 2 nights x 5,000, as the site would show
  assert.equal(res.status, 200)
  const saved = await store.getByRef((await res.json()).ref)
  assert.equal(saved.b.amount, 10000)
  assert.equal(saved.b.roomLabel, 'Standard Room')
})

test('a rename in the Studio shows up on the booking and in the emails', async () => {
  cms.rooms = [{ roomType: 'deluxe', title: 'Garden Deluxe', pricePerNight: 6000 }]
  const res = await book({ room: 'deluxe', guests: '2' })
  assert.equal(res.status, 200)
  await settle()
  assert.equal((await store.getByRef((await res.json()).ref)).b.roomLabel, 'Garden Deluxe')
  assert.match(sent[0].html, /Garden Deluxe/)
})

test('a price published seconds ago is picked up even though the server had the old one cached', async () => {
  await book({ expectedAmount: '7000' })                            // primes the cache with the old price (3,500)
  cms.rooms = [{ roomType: 'standard', pricePerNight: 5000 }]       // hotel publishes 5,000; the guest's page already shows it
  const res = await book({ expectedAmount: '10000' })               // guest saw 2 x 5,000
  assert.equal(res.status, 200)
  assert.equal((await store.getByRef((await res.json()).ref)).b.amount, 10000)
})

test('a guest who was shown a different price is stopped, told the real one, and nothing is created', async () => {
  cms.rooms = [{ roomType: 'standard', pricePerNight: 5000 }]
  const res = await book({ expectedAmount: '7000' })                // saw the old price
  const body = await res.json()
  assert.equal(res.status, 409)
  assert.equal(body.code, 'price_changed')
  assert.equal(body.amount, 10000)
  assert.equal(body.nightlyRate, 5000)
  assert.equal(body.rooms.standard.price, 5000)
  assert.match(body.message, /KES 5,000 per night/)
  assert.match(body.message, /KES 10,000/)
  await settle()
  assert.equal(sent.length, 0)

  const retry = await book({ expectedAmount: String(body.amount) })  // after the guest confirms the new total
  assert.equal(retry.status, 200)
})

test('an unavailable room cannot be booked online', async () => {
  cms.rooms = [{ roomType: 'executive', pricePerNight: 10000, available: false }]
  const res = await book({ room: 'executive', guests: '1' })
  const body = await res.json()
  assert.equal(res.status, 400)
  assert.equal(body.code, 'room_unavailable')
  assert.equal(body.field, 'room')
  assert.equal((await book({ room: 'deluxe' })).status, 200)         // other rooms are unaffected
})

test('max guests follows the Studio', async () => {
  cms.rooms = [{ roomType: 'standard', maxGuests: 1 }]
  const res = await book({ guests: '2' })
  assert.equal(res.status, 400)
  assert.match((await res.json()).message, /up to 1 guest/)
  cms.rooms = [{ roomType: 'standard', maxGuests: 4 }]
  resetSiteDataCache()
  assert.equal((await book({ guests: '4' })).status, 200)
})

test('pausing online booking in the Studio stops new bookings with the hotel\'s own message', async () => {
  cms.settings = { bookingOpen: false, bookingPausedMessage: 'We are fully booked this weekend. Please call us.' }
  const res = await book()
  const body = await res.json()
  assert.equal(res.status, 503)
  assert.equal(body.code, 'booking_paused')
  assert.equal(body.message, 'We are fully booked this weekend. Please call us.')

  cms.settings = { bookingOpen: false }                              // no custom message: a sensible default with the phone number
  resetSiteDataCache()
  const plain = await (await book()).json()
  assert.match(plain.message, /paused/i)
  assert.match(plain.message, /\+254 714 302 777/)
})

test('/config tells the page whether booking is open and the exact prices the server will charge', async () => {
  cms.rooms = [{ roomType: 'standard', pricePerNight: 4800, available: true }]
  cms.settings = { bookingOpen: true }
  const cfg = await (await fetch(`${base}/api/booking/config`)).json()
  assert.equal(cfg.bookingOpen, true)
  assert.equal(cfg.rooms.standard.price, 4800)
  assert.equal(cfg.rooms.executive.price, 10000)
  assert.deepEqual(Object.keys(cfg.rooms.standard).sort(), ['available', 'label', 'maxGuests', 'price'])
})

test('guest emails carry the contact details the hotel set in the Studio', async () => {
  cms.settings = { phones: ['+254 700 555 000'], email: 'frontdesk@hotel.example', addressLine: '1 New Road', town: 'Busia' }
  assert.equal((await book()).status, 200)
  await settle()
  const guest = sent.find((m) => m.to === 'jane@example.com')
  assert.match(guest.html, /\+254 700 555 000/)
  assert.match(guest.html, /frontdesk@hotel\.example/)
  assert.match(guest.html, /1 New Road/)
  assert.doesNotMatch(guest.html, /714 302 777/)
})

test('a broken value in the Studio cannot become a price', async () => {
  cms.rooms = [{ roomType: 'standard', pricePerNight: 5 }]           // typo: 5 instead of 5000
  const res = await book({ expectedAmount: '7000' })
  assert.equal(res.status, 200)                                      // falls back to 3,500, never charges KES 10
  assert.equal((await store.getByRef((await res.json()).ref)).b.amount, 7000)
})
