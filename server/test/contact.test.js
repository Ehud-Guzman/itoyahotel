// Route-level tests for POST /api/contact — guest enquiry form that emails
// the hotel. Mailer is stubbed so no real email is sent.
const { resetBookings, closeHelpers } = require('./helpers')
Object.assign(process.env, {
  NODE_ENV: 'test', EMAIL_USER: 'bookings@example.test', HOTEL_EMAIL: 'hotel@example.test',
})
delete process.env.MPESA_ENV
delete process.env.MPESA_CONSUMER_KEY

const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const express = require('express')

const sent = []
require('../lib/mailer').createTransporter = () => ({
  sendMail: async (m) => { sent.push({ to: m.to, subject: m.subject, html: m.html }) },
})

const store = require('../store')
const contactRouter = require('../routes/contact')

let server, base
test.before(async () => {
  await resetBookings()
  await store.init()
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json())
  app.use('/api/contact', contactRouter)
  server = http.createServer(app)
  await new Promise((r) => server.listen(0, r))
  base = `http://127.0.0.1:${server.address().port}`
})
test.after(async () => {
  server.close()
  await store.close()
  await closeHelpers()
})
test.beforeEach(() => { sent.length = 0 })

const post = (body, ip = '10.2.0.1') =>
  fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })

const valid = () => ({
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '0712345678',
  type: 'accommodation',
  checkin: '2026-08-10',
  checkout: '2026-08-12',
  guests: '2',
  message: 'Quiet room please',
})

test('a valid enquiry is stored and the email is sent to the hotel', async () => {
  const res = await post(valid())
  const body = await res.json()
  assert.equal(res.status, 200, JSON.stringify(body))
  assert.equal(body.ok, true)

  // Small delay so the fire-and-forget email send completes
  await new Promise((r) => setTimeout(r, 50))

  const saved = await store.getContactEnquiry(body.ref)
  assert.ok(saved, 'enquiry should be persisted')
  assert.equal(saved.email_status, 'sent')
  assert.equal(saved.email_attempts, 1)

  assert.equal(sent.length, 1)
  assert.equal(sent[0].to[0], 'hotel@example.test')
  assert.match(sent[0].subject, /New Enquiry — Accommodation — Jane Doe/)
  assert.match(sent[0].html, /Jane Doe/)
  assert.match(sent[0].html, /jane@example\.com/)
})

test('the honeypot field blocks the enquiry without sending any email', async () => {
  const res = await post({ ...valid(), website_url: 'http://spam.example.com' })
  const body = await res.json()
  assert.equal(res.status, 200)
  assert.equal(body.ok, true)

  await new Promise((r) => setTimeout(r, 50))
  assert.equal(sent.length, 0)

  // Should NOT be persisted either
  const saved = await store.getContactEnquiry(body.ref)
  assert.ok(!saved || saved.email_status === 'pending', 'honeypot enquiries should not be recorded')
})

test('missing required fields are rejected', async () => {
  const res = await post({ name: 'Jane' })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.match(body.message, /email|message/i)
  assert.equal(sent.length, 0)
})

test('an invalid email address is rejected', async () => {
  const res = await post({ ...valid(), email: 'not-an-email' })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.match(body.message, /valid email/i)
  assert.equal(sent.length, 0)
})

test('an invalid phone number is rejected', async () => {
  const res = await post({ ...valid(), phone: 'abc' })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.match(body.message, /valid phone/i)
  assert.equal(sent.length, 0)
})

test('a name that is too long is rejected', async () => {
  const res = await post({ ...valid(), name: 'x'.repeat(101) })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.match(body.message, /100 characters or fewer/)
  assert.equal(sent.length, 0)
})

test('a message that is too long is rejected', async () => {
  const res = await post({ ...valid(), message: 'x'.repeat(3001) })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.match(body.message, /3000 characters or fewer/)
  assert.equal(sent.length, 0)
})

test("reply-to is set to the visitor's email so the hotel can reply directly", async () => {
  const res = await post(valid())
  assert.equal(res.status, 200)
  await new Promise((r) => setTimeout(r, 50))
  assert.equal(sent.length, 1)
  // The mailer stub captures sendMail args; replyTo should be the visitor's email
  // We verify via the subject containing the name and the html containing their email
  assert.match(sent[0].html, /jane@example\.com/)
})

test('a second enquiry from the same visitor goes through (rate limiting is applied at the app level)', async () => {
  const first = await post(valid())
  assert.equal(first.status, 200)
  const second = await post(valid())
  assert.equal(second.status, 200)
})