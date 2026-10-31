// Route-level tests for the M-Pesa flow with Safaricom and SMTP stubbed out.
// They prove the two money-adjacent guarantees:
//   1. /retry never fires a second STK push while the first prompt may be live
//   2. a booking is confirmed (and emailed) exactly once, however the callback
//      and the status poll race
const { usingPostgres, sql, resetBookings, closeHelpers } = require('./helpers')
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

// ---- stubs: must be installed before the routes are required ----
const calls = { stkPush: 0, stkQuery: 0 }
let queryBehaviour = () => { throw new Error('still processing') }   // default: prompt in flight
axios.get = async () => ({ data: { access_token: 'tok' } })
axios.post = async (url) => {
  if (url.includes('stkpushquery')) { calls.stkQuery++; return { data: await queryBehaviour() } }
  calls.stkPush++
  return { data: { CheckoutRequestID: `ws_CO_${calls.stkPush}` } }
}
const sent = []
require('../lib/mailer').createTransporter = () => ({ sendMail: async (m) => { sent.push(m.to) } })

const store = require('../store')
const bookingRouter = require('../routes/booking')
const mpesaRouter = require('../routes/mpesa')

let server, base
test.before(async () => {
  await resetBookings()
  await store.init()
  const app = express()
  app.use(express.json())
  app.use('/api/booking', bookingRouter)
  app.use('/api/mpesa', mpesaRouter)
  server = http.createServer(app)
  await new Promise((r) => server.listen(0, r))
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(async () => {
  server.close()
  await store.close()
  await closeHelpers()
})

const settle = () => new Promise((r) => setTimeout(r, 30))   // let fire-and-forget emails finish
const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

async function pendingBooking(ref, { ageMs = 0 } = {}) {
  await store.create({
    b: { ref, room: 'standard', roomLabel: 'Standard Room', checkIn: '2026-12-24', checkOut: '2026-12-26', nights: 2,
         guests: 1, name: 'Jane Doe', phone: '0712345678', email: 'jane@example.com', amount: 7000, mpesaPhone: '254712345678' },
    idFrontBuffer: Buffer.from('f'), idBackBuffer: Buffer.from('b'), idFrontName: 'f.jpg', idBackName: 'b.jpg',
    status: 'pending', checkoutRequestId: null,
  })
  await store.updateStatus(ref, 'pending', { checkoutRequestId: `ck-${ref}` })
  if (ageMs) {
    if (usingPostgres) {
      await sql(`UPDATE bookings SET stk_requested_at = now() - ($2::int * interval '1 millisecond') WHERE ref = $1`, [ref, ageMs])
    } else {
      (await store.getByRef(ref)).stkRequestedAt = Date.now() - ageMs
    }
  }
}

test.beforeEach(() => {
  calls.stkPush = 0; calls.stkQuery = 0; sent.length = 0
  queryBehaviour = () => { throw new Error('still processing') }
})

test('retry while the first prompt is still live is refused (no second push)', async () => {
  await pendingBooking('T-LIVE', { ageMs: 10_000 })
  const res = await post('/api/booking/T-LIVE/retry', { mpesaPhone: '254712345678', clientRequestId: 'a1' })
  assert.equal(res.status, 409)
  assert.equal(calls.stkPush, 0)
})

test('retry after the prompt window has passed sends a fresh push', async () => {
  await pendingBooking('T-OLD', { ageMs: 5 * 60_000 })
  queryBehaviour = () => ({ ResultCode: '1032' })     // cancelled by the guest: definitely not paid
  const res = await post('/api/booking/T-OLD/retry', { mpesaPhone: '254712345678', clientRequestId: 'a2' })
  assert.equal(res.status, 200)
  assert.equal(calls.stkPush, 1)
})

test('retry when the first prompt was actually paid settles it instead of charging again', async () => {
  await pendingBooking('T-PAID', { ageMs: 5 * 60_000 })
  queryBehaviour = () => ({ ResultCode: '0' })
  const res = await post('/api/booking/T-PAID/retry', { mpesaPhone: '254712345678', clientRequestId: 'a3' })
  assert.equal(res.status, 200)
  assert.equal(calls.stkPush, 0)
  assert.equal((await store.getByRef('T-PAID')).status, 'success')
  await settle()
  assert.equal(sent.length, 2)    // one hotel email + one guest email
})

test('retry rejects a malformed M-Pesa number before touching Safaricom', async () => {
  await pendingBooking('T-BADPHONE', { ageMs: 5 * 60_000 })
  const res = await post('/api/booking/T-BADPHONE/retry', { mpesaPhone: '0712345678', clientRequestId: 'a4' })
  assert.equal(res.status, 400)
  assert.equal(calls.stkPush + calls.stkQuery, 0)
})

test('callback and status poll racing settle the booking exactly once', async () => {
  await pendingBooking('T-RACE')
  queryBehaviour = () => ({ ResultCode: '0' })
  const callback = post('/api/mpesa/callback', {
    Body: { stkCallback: { CheckoutRequestID: 'ck-T-RACE', ResultCode: 0,
      CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'QGH123' }] } } },
  })
  const poll = fetch(`${base}/api/booking/status/T-RACE`)
  await Promise.all([callback, poll])
  await settle()
  assert.equal((await store.getByRef('T-RACE')).status, 'success')
  assert.equal(sent.length, 2, `expected one set of emails (2 messages), got ${sent.length}`)
})

test('a redelivered callback does not re-send emails', async () => {
  await pendingBooking('T-DUP')
  const cb = { Body: { stkCallback: { CheckoutRequestID: 'ck-T-DUP', ResultCode: 0, CallbackMetadata: { Item: [] } } } }
  await post('/api/mpesa/callback', cb)
  await post('/api/mpesa/callback', cb)
  await settle()
  assert.equal(sent.length, 2)
})

test('a late failed callback cannot overwrite a paid booking', async () => {
  await pendingBooking('T-LATEFAIL')
  const ok = { Body: { stkCallback: { CheckoutRequestID: 'ck-T-LATEFAIL', ResultCode: 0, CallbackMetadata: { Item: [] } } } }
  const fail = { Body: { stkCallback: { CheckoutRequestID: 'ck-T-LATEFAIL', ResultCode: 1032 } } }
  await post('/api/mpesa/callback', ok)
  await post('/api/mpesa/callback', fail)
  assert.equal((await store.getByRef('T-LATEFAIL')).status, 'success')
})
