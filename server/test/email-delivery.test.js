// A failed email must never silently lose a booking: it is recorded, retried with
// backoff, never sent twice, and visible to staff.
const { resetBookings, closeHelpers } = require('./helpers')
Object.assign(process.env, {
  NODE_ENV: 'test', EMAIL_USER: 'bookings@example.test', HOTEL_EMAIL: 'hotel@example.test',
  ADMIN_PASSWORD: 'correct-horse', ADMIN_JWT_SECRET: 'test-secret',
})
delete process.env.MPESA_ENV
delete process.env.MPESA_CONSUMER_KEY

const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const express = require('express')

// ---- a mail server we can break on demand ----
const mail = { sent: [], failHotel: false, failGuest: false, brokenTransport: false, verifyError: null }
require('../lib/mailer').createTransporter = () => {
  if (mail.brokenTransport) throw new Error('mail is not configured')
  return {
    sendMail: async (m) => {
      const toHotel = m.to === 'hotel@example.test'
      if ((toHotel && mail.failHotel) || (!toHotel && mail.failGuest)) throw new Error('535 Username and Password not accepted')
      mail.sent.push({ to: m.to, subject: m.subject })
    },
    verify: async () => { if (mail.verifyError) throw new Error(mail.verifyError) },
  }
}

const store = require('../store')
const bookingRouter = require('../routes/booking')
const adminRouter = require('../routes/admin')
const { notify, runEmailRetries } = bookingRouter

let server, base
test.before(async () => {
  await resetBookings()
  await store.init()
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json())
  app.use('/api/booking', bookingRouter)
  app.use('/api/admin', adminRouter)
  server = http.createServer(app)
  await new Promise((r) => server.listen(0, r))
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(async () => { server.close(); await store.close(); await closeHelpers() })
test.beforeEach(() => { Object.assign(mail, { sent: [], failHotel: false, failGuest: false, brokenTransport: false, verifyError: null }) })

let n = 0
async function newBooking({ status = 'reservation', ageMs = 0 } = {}) {
  const ref = `EM-${++n}-${Date.now() % 100000}`
  await store.create({
    b: { ref, room: 'standard', roomLabel: 'Standard Room', checkIn: '2026-12-24', checkOut: '2026-12-26', nights: 2, guests: 1,
         name: 'Jane Doe', phone: '0712345678', email: 'jane@example.com', amount: 7000, currency: 'KES', plan: 'bb', residency: 'local' },
    idFrontBuffer: Buffer.from('f'), idBackBuffer: Buffer.from('b'), idFrontName: 'f.jpg', idBackName: 'b.jpg',
    status, checkoutRequestId: null,
  })
  if (ageMs) (await store.getByRef(ref)).createdAt = new Date(Date.now() - ageMs).toISOString()   // memory store: back-date
  return ref
}
// Pretend `ms` have passed since the last attempt (the retry backoff is clock-based).
const ago = async (ref, ms) => { (await store.getByRef(ref)).email.lastAttempt = Date.now() - ms }
const state = async (ref) => { const e = (await store.getByRef(ref)).email; return { hotel: e.hotel, guest: e.guest, attempts: e.attempts, error: e.error } }
const MIN = 60_000

test('both emails delivered: recorded as sent after one attempt', async () => {
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  assert.deepEqual(await state(ref), { hotel: 'sent', guest: 'sent', attempts: 1, error: null })
  assert.equal(mail.sent.length, 2)
})

test('a failed hotel alert is recorded, the guest confirmation still goes out, and nothing throws', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  const s = await state(ref)
  assert.equal(s.hotel, 'failed')
  assert.equal(s.guest, 'sent')
  assert.match(s.error, /535/)
  assert.deepEqual(mail.sent.map((m) => m.to), ['jane@example.com'])
})

test('a misconfigured mail setup is recorded as failed for both emails', async () => {
  mail.brokenTransport = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  const s = await state(ref)
  assert.deepEqual([s.hotel, s.guest], ['failed', 'failed'])
  assert.match(s.error, /not configured/)
})

test('the retry sends ONLY what did not arrive: the guest is never emailed twice', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))                  // attempt 1: hotel fails, guest delivered
  mail.failHotel = false; mail.sent = []
  await ago(ref, 3 * MIN)
  assert.equal(await runEmailRetries(), 1)
  assert.deepEqual(mail.sent.map((m) => m.to), ['hotel@example.test'])      // just the hotel, not the guest again
  assert.deepEqual(await state(ref), { hotel: 'sent', guest: 'sent', attempts: 2, error: null })
  await ago(ref, 60 * MIN)
  assert.equal(await runEmailRetries(), 0)                                  // handled: never retried again
})

test('retries back off: 2, then 4, then 8 minutes', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))                                   // attempt 1
  await ago(ref, 1 * MIN);  assert.equal(await runEmailRetries(), 0)       // too soon after attempt 1 (needs 2 min)
  await ago(ref, 2.1 * MIN); assert.equal(await runEmailRetries(), 1)      // attempt 2
  await ago(ref, 3 * MIN);  assert.equal(await runEmailRetries(), 0)       // needs 4 min after attempt 2
  await ago(ref, 4.1 * MIN); assert.equal(await runEmailRetries(), 1)      // attempt 3
  await ago(ref, 7 * MIN);  assert.equal(await runEmailRetries(), 0)       // needs 8 min after attempt 3
  await ago(ref, 8.1 * MIN); assert.equal(await runEmailRetries(), 1)      // attempt 4
  assert.equal((await state(ref)).attempts, 4)
})

test('it gives up after 5 attempts, and the booking stays flagged as failed for staff', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  for (let i = 0; i < 6; i++) { await ago(ref, 60 * MIN); await runEmailRetries() }
  const s = await state(ref)
  assert.equal(s.attempts, 5)
  assert.equal(s.hotel, 'failed')
  assert.equal(await runEmailRetries(), 0)
})

test('existing bookings are never emailed again (legacy rows count as handled)', async () => {
  const ref = await newBooking({ ageMs: 10 * 24 * 3_600_000 })
  await store.recordEmailResult(ref, { hotel: 'sent', guest: 'sent' })       // how a pre-migration row looks
  await ago(ref, 60 * MIN)
  assert.equal(await runEmailRetries(), 0)
  assert.equal(mail.sent.length, 0)
})

test('very old failures are not retried forever (48 hour window)', async () => {
  mail.failHotel = true
  const ref = await newBooking({ ageMs: 3 * 24 * 3_600_000 })
  await store.recordEmailResult(ref, { hotel: 'failed', error: 'x' })
  await ago(ref, 60 * MIN)
  assert.equal(await runEmailRetries(), 0)
})

test('a booking whose first attempt never reported back (server crashed) is picked up after 2 minutes', async () => {
  const fresh = await newBooking({ ageMs: 30_000 })
  const stuck = await newBooking({ ageMs: 5 * MIN })                         // email pending, never attempted
  assert.equal(await runEmailRetries(), 1)                                   // only the one older than 2 minutes
  assert.equal((await state(stuck)).hotel, 'sent')
  assert.equal((await state(fresh)).hotel, 'pending')
})

test('bookings that never completed (pending payment, failed) are not emailed', async () => {
  const ref = await newBooking({ status: 'pending', ageMs: 10 * MIN })
  assert.equal(await runEmailRetries(), 0)
  assert.equal((await state(ref)).hotel, 'pending')
})

test('a confirmed (paid) booking uses the "New Booking" wording', async () => {
  const ref = await newBooking({ status: 'success' })
  await notify(await store.getByRef(ref))
  assert.match(mail.sent.find((m) => m.to === 'hotel@example.test').subject, /^New Booking /)
})

// ---------------- what staff see and can do ----------------

async function adminToken() {
  const res = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'correct-horse' }) })
  return (await res.json()).token
}

test('the admin booking list shows email delivery state', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  const list = await (await fetch(`${base}/api/admin/bookings`, { headers: { authorization: `Bearer ${await adminToken()}` } })).json()
  const row = list.find((b) => b.ref === ref)
  assert.equal(row.emailHotel, 'failed')
  assert.equal(row.emailGuest, 'sent')
  assert.match(row.emailError, /535/)
})

test('staff can press Resend: only the missing email goes out, and it needs a login', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  mail.failHotel = false; mail.sent = []

  const anon = await fetch(`${base}/api/admin/bookings/${ref}/resend-emails`, { method: 'POST' })
  assert.equal(anon.status, 401)
  assert.equal(mail.sent.length, 0)

  const res = await fetch(`${base}/api/admin/bookings/${ref}/resend-emails`, { method: 'POST', headers: { authorization: `Bearer ${await adminToken()}` } })
  const body = await res.json()
  assert.equal(res.status, 200)
  assert.deepEqual([body.hotel, body.guest, body.error], ['sent', 'sent', null])
  assert.deepEqual(mail.sent.map((m) => m.to), ['hotel@example.test'])
  const missing = await fetch(`${base}/api/admin/bookings/NOPE/resend-emails`, { method: 'POST', headers: { authorization: `Bearer ${await adminToken()}` } })
  assert.equal(missing.status, 404)
})

test('Resend works again even after the automatic retries gave up', async () => {
  mail.failHotel = true
  const ref = await newBooking()
  await notify(await store.getByRef(ref))
  for (let i = 0; i < 6; i++) { await ago(ref, 60 * MIN); await runEmailRetries() }
  assert.equal((await state(ref)).attempts, 5)
  mail.failHotel = false; mail.sent = []
  const res = await fetch(`${base}/api/admin/bookings/${ref}/resend-emails`, { method: 'POST', headers: { authorization: `Bearer ${await adminToken()}` } })
  assert.equal((await res.json()).hotel, 'sent')
})

test('the mail health check tells staff whether email can be sent at all', async () => {
  const headers = { authorization: `Bearer ${await adminToken()}` }
  assert.equal((await fetch(`${base}/api/admin/email-status`)).status, 401)
  mail.verifyError = '535 Username and Password not accepted'
  const bad = await (await fetch(`${base}/api/admin/email-status`, { headers })).json()
  assert.equal(bad.ok, false)
  assert.match(bad.error, /535/)
})

test('the mail health warning clears within seconds of email coming back (a failure is not remembered for a minute)', async () => {
  const headers = { authorization: `Bearer ${await adminToken()}` }
  await new Promise((r) => setTimeout(r, 5200))              // let the earlier failing result expire
  mail.verifyError = 'connection refused'
  assert.equal((await (await fetch(`${base}/api/admin/email-status`, { headers })).json()).ok, false)
  mail.verifyError = null                                    // email is fixed
  await new Promise((r) => setTimeout(r, 5200))
  assert.equal((await (await fetch(`${base}/api/admin/email-status`, { headers })).json()).ok, true)
})
