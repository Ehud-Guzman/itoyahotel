// International (US dollar) rates, local and international meal plans, and the
// guarantee that matters most: M-Pesa is never involved for a dollar booking, even
// when M-Pesa is live. A dollar guest must never receive a shilling payment prompt.
const { resetBookings, closeHelpers } = require('./helpers')
Object.assign(process.env, {
  NODE_ENV: 'test', MPESA_ENV: 'production', MPESA_CONSUMER_KEY: 'k', MPESA_CONSUMER_SECRET: 's',
  MPESA_SHORTCODE: '174379', MPESA_PASSKEY: 'p', MPESA_CALLBACK_URL: 'https://example.test/cb',
  EMAIL_USER: 'bookings@example.test', HOTEL_EMAIL: 'hotel@example.test',
})

const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const axios = require('axios')
const express = require('express')

// Safaricom + mail stubs (installed before the routes are required)
const calls = { stkPush: [] }
axios.get = async () => ({ data: { access_token: 'tok' } })
axios.post = async (url, body) => {
  if (url.includes('stkpushquery')) return { data: { ResultCode: '1032' } }
  calls.stkPush.push(body)
  return { data: { CheckoutRequestID: `ws_CO_${calls.stkPush.length}` } }
}
const sent = []
require('../lib/mailer').createTransporter = () => ({
  sendMail: async (m) => { sent.push({ to: m.to, subject: m.subject, html: m.html, attachments: (m.attachments || []).map((a) => a.filename) }) },
})

const store = require('../store')
const { resetSiteDataCache } = require('../lib/siteData')
const bookingRouter = require('../routes/booking')

const cms = { settings: null, rooms: [] }
let cmsServer, server, base
test.before(async () => {
  cmsServer = http.createServer((_q, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ result: cms })) })
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
test.after(async () => { server.close(); cmsServer.close(); await store.close(); await closeHelpers() })
test.beforeEach(() => { sent.length = 0; calls.stkPush.length = 0; cms.settings = null; cms.rooms = []; resetSiteDataCache() })

let client = 1
const future = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)
const jpg = () => new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], { type: 'image/jpeg' })
function book(overrides = {}, { back = true } = {}) {
  const fd = new FormData()
  const fields = {
    room: 'standard', checkIn: future(10), checkOut: future(12), guests: '1', name: 'Anna Visitor',
    phone: '+441234567890', email: 'anna@example.com', mpesaPhone: '254712345678', clientRequestId: crypto.randomUUID(),
    ...overrides,
  }
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(k, v)
  fd.append('idFront', jpg(), 'passport.jpg')
  if (back) fd.append('idBack', jpg(), 'b.jpg')
  return fetch(`${base}/api/booking/initiate`, { method: 'POST', body: fd, headers: { 'x-forwarded-for': `10.7.0.${client++}` } })
}
const settle = () => new Promise((r) => setTimeout(r, 50))
const intl = (o = {}) => ({ residency: 'international', ...o })

test('an international booking is a reservation in US dollars, and M-Pesa is NEVER asked, even though it is live', async () => {
  const res = await book(intl({ plan: 'hb' }), { back: false })
  const body = await res.json()
  assert.equal(res.status, 200, JSON.stringify(body))
  assert.equal(body.live, false)                                      // the page shows the "pay at the hotel" flow
  assert.equal(calls.stkPush.length, 0, 'no M-Pesa prompt may be sent to an international guest')
  const saved = await store.getByRef(body.ref)
  assert.equal(saved.status, 'reservation')
  assert.equal(saved.b.currency, 'USD')
  assert.equal(saved.b.residency, 'international')
  assert.equal(saved.b.plan, 'hb')
  assert.equal(saved.b.amount, 160)                                   // 2 nights x USD 80 (Standard, Half Board)
})

test('a Kenyan resident booking still goes through M-Pesa in shillings when it is live', async () => {
  const res = await book({ residency: 'local', plan: 'bb', mpesaPhone: '254712345678' })
  const body = await res.json()
  assert.equal(res.status, 200, JSON.stringify(body))
  assert.equal(body.live, true)
  assert.equal(calls.stkPush.length, 1)
  assert.equal(calls.stkPush[0].Amount, 7000)                          // KES 3,500 x 2
  assert.equal((await store.getByRef(body.ref)).b.currency, 'KES')
})

test('the dollar rates are exactly the ones the hotel quoted', async () => {
  const expectations = [
    ['standard', 'bb', 62], ['standard', 'hb', 80], ['standard', 'fb', 97],
    ['deluxe', 'bb', 106], ['deluxe', 'hb', 124], ['deluxe', 'fb', 142],
    ['executive', 'bb', 162], ['executive', 'hb', 179], ['executive', 'fb', 197],
  ]
  for (const [room, plan, usd] of expectations) {
    const guests = room === 'standard' ? '1' : '2'
    const res = await book(intl({ room, plan, guests, expectedAmount: String(usd * 2) }), { back: false })
    assert.equal(res.status, 200, `${room} ${plan}: ${JSON.stringify(await res.clone().json())}`)
    assert.equal((await store.getByRef((await res.json()).ref)).b.amount, usd * 2, `${room} ${plan}`)
  }
})

test('Super Deluxe has no dollar rate yet, so international guests cannot book it online', async () => {
  const res = await book(intl({ room: 'super-deluxe', guests: '2' }), { back: false })
  const body = await res.json()
  assert.equal(res.status, 400)
  assert.equal(body.code, 'plan_unavailable')
  assert.equal(body.field, 'plan')
  assert.equal(calls.stkPush.length, 0)
})

test('a plan that is not offered is refused (Super Deluxe has no shilling Half Board yet)', async () => {
  const res = await book({ residency: 'local', plan: 'hb', room: 'super-deluxe', guests: '2' })
  assert.equal(res.status, 400)
  assert.equal((await res.json()).code, 'plan_unavailable')
  assert.equal(calls.stkPush.length, 0)
})

test('the Kenyan resident rates are exactly the ones the hotel quoted, charged through M-Pesa in shillings', async () => {
  const expectations = [
    ['standard', 'bb', 3500], ['standard', 'hb', 4500], ['standard', 'fb', 5500],
    ['deluxe', 'bb', 6000], ['deluxe', 'hb', 7000], ['deluxe', 'fb', 8000],
    ['executive', 'bb', 10000], ['executive', 'hb', 11000], ['executive', 'fb', 12000],
  ]
  for (const [room, plan, kes] of expectations) {
    const res = await book({ residency: 'local', room, plan, guests: '2', expectedAmount: String(kes * 2) }, {})
    assert.equal(res.status, 200, `${room} ${plan}: ${JSON.stringify(await res.clone().json())}`)
    const saved = await store.getByRef((await res.json()).ref)
    assert.equal(saved.b.amount, kes * 2, `${room} ${plan}`)
    assert.equal(saved.b.currency, 'KES')
    assert.equal(calls.stkPush.at(-1).Amount, kes * 2, `M-Pesa amount for ${room} ${plan}`)
  }
})

test('older pages that send no residency or plan still book as a Kenyan resident, Bed & Breakfast', async () => {
  const res = await book({ residency: undefined, plan: undefined, expectedAmount: '7000' })
  assert.equal(res.status, 200)
  const saved = await store.getByRef((await res.json()).ref)
  assert.deepEqual([saved.b.residency, saved.b.plan, saved.b.currency, saved.b.amount], ['local', 'bb', 'KES', 7000])
})

test('nonsense guest type or plan is rejected', async () => {
  assert.equal((await book({ residency: 'martian' })).status, 400)
  assert.equal((await book({ plan: 'all-inclusive' })).status, 400)
  assert.equal(calls.stkPush.length, 0)
})

test('the guest is only ever charged the total they were shown, in the right currency', async () => {
  const wrong = await book(intl({ plan: 'fb', expectedAmount: '7000' }), { back: false })     // a shilling total on a dollar booking
  const body = await wrong.json()
  assert.equal(wrong.status, 409)
  assert.equal(body.code, 'price_changed')
  assert.equal(body.currency, 'USD')
  assert.equal(body.amount, 194)
  assert.match(body.message, /Full Board/)
  assert.match(body.message, /USD 97 per night/)
  assert.match(body.message, /USD 194/)
  const ok = await book(intl({ plan: 'fb', expectedAmount: '194' }), { back: false })
  assert.equal(ok.status, 200)
})

test('a Studio edit to a dollar rate applies, to the cent, and 0 stops offering a plan', async () => {
  cms.rooms = [{ roomType: 'standard', pricePerNight: 3500, intlHalfBoard: 82.5, intlFullBoard: 0 }]
  const hb = await book(intl({ plan: 'hb', expectedAmount: '165' }), { back: false })
  assert.equal(hb.status, 200)
  assert.equal((await store.getByRef((await hb.json()).ref)).b.amount, 165)
  const fb = await book(intl({ plan: 'fb' }), { back: false })
  assert.equal(fb.status, 400)
  assert.equal((await fb.json()).code, 'plan_unavailable')
  // a shilling Half Board rate entered in the Studio replaces the built-in KES 4,500
  cms.rooms[0].halfBoardPrice = 4800
  resetSiteDataCache()
  const local = await book({ residency: 'local', plan: 'hb', expectedAmount: '9600', mpesaPhone: '254712345678' })
  assert.equal(local.status, 200)
  assert.equal(calls.stkPush.at(-1).Amount, 9600)
})

test('a passport has no back: the second file is optional for international guests only', async () => {
  assert.equal((await book(intl(), { back: false })).status, 200)
  const local = await book({ residency: 'local' }, { back: false })
  assert.equal(local.status, 400)
  assert.equal((await local.json()).field, 'idBack')
})

test('emails show the currency, guest type and meal plan, and attach just the passport page', async () => {
  const res = await book(intl({ plan: 'hb', room: 'deluxe', guests: '2' }), { back: false })
  assert.equal(res.status, 200)
  await settle()
  const hotel = sent.find((m) => m.to === 'hotel@example.test')
  const guest = sent.find((m) => m.to === 'anna@example.com')
  assert.match(hotel.subject, /\[International\]/)
  assert.match(hotel.html, /USD 248/)                                  // 2 nights x USD 124
  assert.match(hotel.html, /Half Board/)
  assert.match(hotel.html, /International visitor \(USD\)/)
  assert.deepEqual(hotel.attachments, ['ID-front-Anna-Visitor.jpg'])
  assert.match(guest.html, /USD 248/)
  assert.doesNotMatch(guest.html, /M-Pesa/)                            // no mention of a payment method we do not offer them
})

test('/config exposes both rate tables so the page can show exactly what will be charged', async () => {
  const cfg = await (await fetch(`${base}/api/booking/config`)).json()
  assert.deepEqual(cfg.rooms.deluxe.rates.intl, { bb: 106, hb: 124, fb: 142 })
  assert.deepEqual(cfg.rooms.executive.rates.intl, { bb: 162, hb: 179, fb: 197 })
  assert.deepEqual(cfg.rooms['super-deluxe'].rates.intl, { bb: null, hb: null, fb: null })
  assert.deepEqual(cfg.rooms.standard.rates.local, { bb: 3500, hb: 4500, fb: 5500 })
  assert.deepEqual(cfg.rooms.executive.rates.local, { bb: 10000, hb: 11000, fb: 12000 })
  assert.equal(cfg.rooms.standard.price, 3500)                         // kept for older cached pages
})
