// Route-level tests for POST /api/booking/initiate, the public endpoint that
// receives guests' details and ID photos (multipart/form-data via multer).
// Reservation mode (no live M-Pesa), with the mailer stubbed.
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
  sendMail: async (m) => { sent.push({ to: m.to, attachments: (m.attachments || []).map((a) => a.filename) }) },
})

const store = require('../store')
const bookingRouter = require('../routes/booking')

let server, base
test.before(async () => {
  await resetBookings()
  await store.init()
  const app = express()
  app.set('trust proxy', 1)          // same as server/index.js: req.ip comes from X-Forwarded-For
  app.use(express.json())
  app.use('/api/booking', bookingRouter)
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

const settle = () => new Promise((r) => setTimeout(r, 40))
const future = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10)
const jpeg = () => new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], { type: 'image/jpeg' })

function form(overrides = {}, { files = true } = {}) {
  const fd = new FormData()
  const fields = {
    room: 'standard', checkIn: future(10), checkOut: future(12), guests: '1',
    name: 'Jane Doe', phone: '0712345678', email: 'jane@example.com',
    requests: 'Quiet room please', mpesaPhone: '254712345678', clientRequestId: crypto.randomUUID(),
    ...overrides,
  }
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(k, v)
  if (files) {
    fd.append('idFront', jpeg(), 'front.jpg')
    fd.append('idBack', jpeg(), 'back.jpg')
  }
  return fd
}
// Each call comes from a fresh client IP unless one is given, because the route
// rate-limits per IP (8 attempts / 15 min) and a real guest only ever sends a few.
let nextClient = 1
const initiate = (fd, ip = `10.1.${Math.floor(nextClient / 250)}.${nextClient++ % 250}`) =>
  fetch(`${base}/api/booking/initiate`, { method: 'POST', body: fd, headers: { 'x-forwarded-for': ip } })

test('a valid booking with two ID photos is stored and both emails go out', async () => {
  const res = await initiate(form())
  const body = await res.json()
  assert.equal(res.status, 200, JSON.stringify(body))
  assert.equal(body.live, false)
  await settle()
  const saved = await store.getByRef(body.ref)
  assert.equal(saved.status, 'reservation')
  assert.equal(saved.b.amount, 7000)                // 2 nights x KES 3,500, computed on the server
  assert.ok(saved.idFrontBuffer?.length > 0 && saved.idBackBuffer?.length > 0)
  assert.equal(sent.length, 2)                       // hotel + guest
  assert.deepEqual(sent[0].attachments.sort(), ['ID-back-Jane-Doe.jpg', 'ID-front-Jane-Doe.jpg'])
})

test('the price comes from the server, whatever the client claims', async () => {
  const res = await initiate(form({ amount: '1', nights: '99', roomLabel: 'Free Room' }))
  const saved = await store.getByRef((await res.json()).ref)
  assert.equal(saved.b.amount, 7000)
  assert.equal(saved.b.nights, 2)
  assert.equal(saved.b.roomLabel, 'Standard Room')
})

test('a hostile guest name cannot reach the attachment filenames', async () => {
  const res = await initiate(form({ name: '../../etc/passwd\r\nBcc: attacker@evil.test' }))
  assert.equal(res.status, 200)
  await settle()
  for (const f of sent[0].attachments) assert.match(f, /^ID-(front|back)-[A-Za-z0-9-]+\.jpg$/, f)
})

test('invalid input is rejected with the step and field to fix', async () => {
  const cases = [
    [{ email: 'not-an-email' }, 1, 'email'],
    [{ phone: 'abc' }, 1, 'phone'],
    [{ name: 'x'.repeat(101) }, 1, 'name'],
    [{ requests: 'x'.repeat(1001) }, 1, 'requests'],
    [{ checkIn: future(-3), checkOut: future(2) }, 0, 'checkIn'],
    [{ checkOut: future(10) }, 0, 'checkOut'],                       // zero nights
    [{ checkOut: future(60) }, 0, 'checkOut'],                       // over the night limit
    [{ guests: '9' }, 0, 'guests'],
    [{ room: 'penthouse' }, 0, 'room'],
    [{ room: '__proto__' }, 0, 'room'],
  ]
  for (const [overrides, step, field] of cases) {
    const res = await initiate(form(overrides))
    const body = await res.json()
    assert.equal(res.status, 400, JSON.stringify(overrides))
    assert.equal(body.field, field, JSON.stringify(overrides) + ' -> ' + JSON.stringify(body))
    assert.equal(body.step, step)
  }
  assert.equal(sent.length, 0)
})

test('missing ID photos are rejected', async () => {
  const res = await initiate(form({}, { files: false }))
  assert.equal(res.status, 400)
  assert.equal((await res.json()).step, 2)
})

test('a file that is too large is rejected cleanly (not a crash)', async () => {
  const fd = form({}, { files: false })
  fd.append('idFront', new Blob([Buffer.alloc(6 * 1024 * 1024 + 1024)], { type: 'image/jpeg' }), 'big.jpg')
  fd.append('idBack', jpeg(), 'back.jpg')
  const res = await initiate(fd)
  assert.equal(res.status, 400)
  assert.match((await res.json()).message, /6MB/)
})

test('a disallowed file type is not accepted as an ID', async () => {
  const fd = form({}, { files: false })
  fd.append('idFront', new Blob(['<?php echo 1;'], { type: 'application/x-php' }), 'shell.php')
  fd.append('idBack', jpeg(), 'back.jpg')
  const res = await initiate(fd)
  assert.equal(res.status, 400)
})

test('retrying the same submission (same clientRequestId) does not create a second booking', async () => {
  const id = crypto.randomUUID()
  const a = await (await initiate(form({ clientRequestId: id }))).json()
  const b = await (await initiate(form({ clientRequestId: id }))).json()
  assert.equal(a.ref, b.ref)
  await settle()
  assert.equal(sent.length, 2)                       // one set of emails, not two
})

test('the per-IP rate limit stops a flood of booking attempts from one address', async () => {
  const statuses = []
  for (let i = 0; i < 10; i++) statuses.push((await initiate(form({ email: 'bad' }), '203.0.113.9')).status)
  assert.deepEqual(statuses.slice(0, 8), Array(8).fill(400))   // validation errors, still counted
  assert.deepEqual(statuses.slice(8), [429, 429])               // then blocked
  // ...while a different guest is unaffected
  assert.equal((await initiate(form())).status, 200)
})
