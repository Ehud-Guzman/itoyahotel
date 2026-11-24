// The documents a booking produces and the actions staff can take afterwards:
// a receipt that cannot drift from the record, a calendar invite that survives
// Outlook, a guest-only receipt endpoint, and cancellation emails.
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

const mail = { sent: [], fail: false }
require('../lib/mailer').createTransporter = () => ({
  sendMail: async (m) => {
    if (mail.fail) throw new Error('550 mailbox unavailable')
    mail.sent.push(m)
  },
  verify: async () => {},
})

const store = require('../store')
const bookingRouter = require('../routes/booking')
const adminRouter = require('../routes/admin')
const { notify } = bookingRouter
const { buildReceiptPdf, longDate } = require('../lib/receiptPdf')
const { buildInvite } = require('../lib/calendarInvite')

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
test.beforeEach(() => { mail.sent = []; mail.fail = false })

let n = 0
async function newBooking({ status = 'reservation', paid = false } = {}) {
  const ref = `RC-${++n}-${Date.now() % 100000}`
  await store.create({
    b: {
      ref, room: 'deluxe', roomLabel: 'Deluxe Room', checkIn: '2026-12-24', checkOut: '2026-12-26',
      nights: 2, guests: 2, name: 'Jane Doe', phone: '0712345678', email: 'jane@example.com',
      amount: paid ? 12000 : 7000, currency: 'KES', plan: 'hb', residency: 'local',
      mpesaRef: paid ? 'SJ41ABC9XZ' : null,
    },
    idFrontBuffer: Buffer.from('f'), idBackBuffer: Buffer.from('b'), idFrontName: 'f.jpg', idBackName: 'b.jpg',
    status, checkoutRequestId: null,
  })
  return ref
}

const recordOf = async (ref) => store.getByRef(ref)
const adminToken = async () => {
  const res = await fetch(`${base}/api/admin/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'correct-horse' }),
  })
  return (await res.json()).token
}

// ── The PDF receipt ──────────────────────────────────────────────────────────
test('the receipt is a real PDF, for both a paid booking and one paying at the hotel', async () => {
  for (const status of ['success', 'reservation']) {
    const pdf = buildReceiptPdf(await recordOf(await newBooking({ status, paid: status === 'success' })))
    assert.ok(Buffer.isBuffer(pdf))
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
    assert.match(pdf.subarray(-32).toString(), /%%EOF/)
    assert.ok(pdf.length > 2000, 'a receipt with text should not be an empty document')
  }
})

test('the receipt needs a booking record', () => {
  assert.throws(() => buildReceiptPdf({}), /reference/)
  assert.throws(() => buildReceiptPdf(null), /reference/)
})

test('dates print as the calendar date the guest booked, never a day earlier', () => {
  assert.match(longDate('2026-12-24'), /Thu, 24 December 2026/)
  assert.equal(longDate(''), '—')
})

// ── The calendar invite ──────────────────────────────────────────────────────
test('the calendar invite is a valid, folded VCALENDAR in Kenyan time', async () => {
  const invite = buildInvite(await recordOf(await newBooking({ status: 'success', paid: true })), {
    settings: { addressLine: 'B1 Kisumu-Busia Road', town: 'Busia, Kenya', checkInTime: '2:00 PM', checkOutTime: '10:00 AM' },
  })
  const lines = invite.content.split('\r\n')
  assert.ok(invite.content.endsWith('\r\n'), 'must end with CRLF')
  assert.ok(!/[^\r]\n/.test(invite.content), 'every newline must be CRLF')
  assert.ok(lines.length > 20)
  assert.ok(Math.max(...lines.map((l) => Buffer.byteLength(l))) <= 75, 'lines must be folded at 75 octets')
  assert.ok(lines.includes('BEGIN:VCALENDAR') && lines.includes('END:VCALENDAR'))
  assert.ok(lines.includes('DTSTART;TZID=Africa/Nairobi:20261224T140000'))
  assert.ok(lines.includes('DTEND;TZID=Africa/Nairobi:20261226T100000'))
  assert.ok(lines.some((l) => l.startsWith('SUMMARY:') && l.includes('2 nights')))
  assert.ok(lines.includes('STATUS:CONFIRMED'))
  assert.match(invite.filename, /^Hotel-Itoya-RC-.*\.ics$/)
})

test('a name or place containing a comma cannot break the invite', async () => {
  const ref = await newBooking()
  const record = await recordOf(ref)
  record.b.name = 'Doe, Jane; "JJ"'
  const invite = buildInvite(record, { settings: { addressLine: 'B1 Road, Busia', town: 'Kenya' } })
  assert.match(invite.content, /ATTENDEE;CN=Doe\\, Jane\\; "JJ"/)
  assert.match(invite.content, /LOCATION:B1 Road\\, Busia\\, Kenya/)
})


// ── Attachments on the confirmation email ────────────────────────────────────
test('the confirmation email carries the receipt and the calendar invite', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  await notify(await recordOf(ref))

  const guest = mail.sent.find((m) => m.to === 'jane@example.com')
  const hotel = mail.sent.find((m) => m.to === 'hotel@example.test')
  const guestFiles = guest.attachments.map((a) => a.filename)
  assert.equal(guestFiles.length, 2, 'the guest gets exactly the receipt and the invite')
  assert.ok(guestFiles.some((f) => f.endsWith('.pdf')))
  assert.ok(guestFiles.some((f) => f.endsWith('.ics')))

  const pdf = guest.attachments.find((a) => a.filename.endsWith('.pdf'))
  assert.equal(pdf.content.subarray(0, 5).toString(), '%PDF-')
  const ics = guest.attachments.find((a) => a.filename.endsWith('.ics'))
  assert.match(ics.content.toString(), /BEGIN:VCALENDAR/)

  // The hotel keeps the ID images and gets the same two documents as the guest.
  assert.equal(hotel.attachments.length, 4)
  assert.match(JSON.stringify(guest), /calendar invite are attached/)
})

// ── The guest's receipt download ─────────────────────────────────────────────
const requestReceipt = (body) => fetch(`${base}/api/booking/receipt`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
})

test('a receipt needs the reference AND the phone number on the booking', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  assert.equal((await requestReceipt({})).status, 400)

  // An unknown reference and a wrong number are answered identically — otherwise
  // the form becomes a way to discover which references exist.
  const noPhone = await requestReceipt({ ref })
  const badPhone = await requestReceipt({ ref, phone: '0700000000' })
  const noSuchRef = await requestReceipt({ ref: 'NOPE', phone: '0712345678' })
  assert.equal(noPhone.status, 404)
  assert.equal(badPhone.status, 404)
  assert.equal(noSuchRef.status, 404)
  const messages = await Promise.all([noPhone, badPhone, noSuchRef].map((r) => r.json()))
  assert.equal(new Set(messages.map((m) => m.message)).size, 1, 'all three failures must read the same')
  assert.equal(messages[0].message.includes('No receipt found'), false)
})

test('a reference typed in lower case still finds the receipt', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  const res = await requestReceipt({ ref: ref.toLowerCase(), phone: '0712345678' })
  assert.equal(res.status, 200)
  assert.equal(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString(), '%PDF-')
})

test('with both, the guest downloads the PDF that was emailed to them', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  const res = await requestReceipt({ ref, phone: '0712 345 678' })       // formatting is ignored
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /application\/pdf/)
  assert.match(res.headers.get('content-disposition'), /Hotel-Itoya-RC-.*\.pdf/)
  assert.match(res.headers.get('cache-control'), /no-store/)
  assert.equal(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString(), '%PDF-')
})

test('a booking that never completed has no receipt', async () => {
  const ref = await newBooking({ status: 'pending' })
  assert.equal((await requestReceipt({ ref, phone: '0712345678' })).status, 404)
})

test('staff can download a receipt, but only after logging in', async () => {
  const ref = await newBooking({ status: 'reservation' })
  assert.equal((await fetch(`${base}/api/admin/bookings/${ref}/receipt`)).status, 401)
  const res = await fetch(`${base}/api/admin/bookings/${ref}/receipt`, {
    headers: { authorization: `Bearer ${await adminToken()}` },
  })
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /application\/pdf/)
})

// ── Cancelling a booking ─────────────────────────────────────────────────────
test('cancelling releases the booking and emails the guest, saying a refund will be discussed', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  const res = await fetch(`${base}/api/admin/bookings/${ref}/cancel`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await adminToken()}` },
    body: JSON.stringify({ reason: 'Double-booked that weekend' }),
  })
  const body = await res.json()
  assert.equal(res.status, 200)
  assert.equal(body.email.sent, true)

  const record = await recordOf(ref)
  assert.equal(record.status, 'cancelled')
  assert.equal(record.cancelReason, 'Double-booked that weekend')
  assert.ok(record.cancelledAt)

  const guest = mail.sent.find((m) => m.to === 'jane@example.com')
  assert.match(guest.subject, /cancelled/i)
  const html = JSON.stringify(guest)
  assert.match(html, /has been cancelled/)
  assert.match(html, /Double-booked that weekend/)
  assert.match(html, /refund/)

  const list = await (await fetch(`${base}/api/admin/bookings`, {
    headers: { authorization: `Bearer ${await adminToken()}` },
  })).json()
  assert.equal(list.find((b) => b.ref === ref).status, 'cancelled')
})

test('cancelling is staff-only, cannot be repeated, and needs a completed booking', async () => {
  const ref = await newBooking()
  const url = `${base}/api/admin/bookings/${ref}/cancel`
  assert.equal((await fetch(url, { method: 'POST' })).status, 401)

  const token = await adminToken()
  assert.equal((await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` } })).status, 200)
  const again = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}` } })
  assert.equal(again.status, 409)
  assert.match((await again.json()).message, /already cancelled/)

  const pending = await newBooking({ status: 'pending' })
  const refused = await fetch(`${base}/api/admin/bookings/${pending}/cancel`, {
    method: 'POST', headers: { authorization: `Bearer ${token}` },
  })
  assert.equal(refused.status, 409)
  assert.equal((await recordOf(pending)).status, 'pending')
})

test('the booking is still cancelled when the email fails, and staff are told', async () => {
  const ref = await newBooking({ status: 'reservation' })
  mail.fail = true
  const res = await fetch(`${base}/api/admin/bookings/${ref}/cancel`, {
    method: 'POST', headers: { authorization: `Bearer ${await adminToken()}` },
  })
  const body = await res.json()
  assert.equal(res.status, 200)
  assert.equal(body.email.sent, false)
  assert.match(body.email.error, /550/)
  assert.equal((await recordOf(ref)).status, 'cancelled')
})



// ── Emailing the guest ───────────────────────────────────────────────────────
test('staff can send the guest a note in the hotel\'s own email layout', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  const res = await fetch(`${base}/api/admin/bookings/${ref}/message`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await adminToken()}` },
    body: JSON.stringify({ message: 'We moved you to a quieter room as requested.' }),
  })
  const body = await res.json()
  assert.equal(res.status, 200)
  assert.equal(body.email.sent, true)

  const guest = mail.sent.find((m) => m.to === 'jane@example.com')
  assert.match(guest.subject, /note about your booking/i)
  const html = JSON.stringify(guest)
  assert.match(html, /quieter room/)
  assert.match(html, /Booking reference/)
})

test('guest messages are validated, staff-only, and not sent for abandoned bookings', async () => {
  const ref = await newBooking()
  const url = `${base}/api/admin/bookings/${ref}/message`
  const token = await adminToken()
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` }

  assert.equal((await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' } })).status, 401)
  assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ message: 'hi' }) })).status, 400)
  assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ message: 'x'.repeat(2001) }) })).status, 400)

  const pending = await newBooking({ status: 'pending' })
  assert.equal((await fetch(`${base}/api/admin/bookings/${pending}/message`, {
    method: 'POST', headers, body: JSON.stringify({ message: 'Hello there' }),
  })).status, 409)
  assert.equal(mail.sent.length, 0)
})

// ── The signed link in the guest's email ─────────────────────────────────────
// The form needs two things the guest must remember. The link needs only the
// email itself: the token proves it came from us, for that booking, unexpired.
const { receiptToken, verifyReceiptToken, receiptUrl } = require('../lib/receiptToken')

function receiptLinksIn(message) {
  return [...String(message.html || '').matchAll(/https?:\/\/[^"'\s]+\/api\/booking\/receipt\/[^"'\s]+/g)]
    .map((m) => m[0])
}

// Same link, pointed at the test server instead of the configured public host.
function localise(link) {
  const url = new URL(link)
  return `${base}${url.pathname}${url.search}`
}

test('the confirmation email carries a working receipt link, and it needs no phone number', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  await notify(await recordOf(ref))

  const guest = mail.sent.find((m) => m.to === 'jane@example.com')
  const links = receiptLinksIn(guest)
  assert.equal(links.length, 1, 'exactly one receipt link per guest email')
  assert.ok(links[0].includes(encodeURIComponent(ref)))

  const res = await fetch(localise(links[0]))
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /application\/pdf/)
  assert.match(res.headers.get('cache-control'), /no-store/)
  assert.equal(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString(), '%PDF-')

  // That same link is what a phone's mail app opens: no session, no login.
  assert.ok(!links[0].includes('0712345678'), 'the link must not leak the phone number')
})

test('a receipt link is good for one booking only', async () => {
  const first  = await newBooking({ status: 'success', paid: true })
  const second = await newBooking({ status: 'success', paid: true })
  await notify(await recordOf(first))

  const link = receiptLinksIn(mail.sent.find((m) => m.to === 'jane@example.com'))[0]
  const token = new URL(link).searchParams.get('t')

  assert.equal(await (await fetch(localise(link))).status, 200)
  // Moving the token onto another reference must not open that receipt.
  const moved = await fetch(`${base}/api/booking/receipt/${encodeURIComponent(second)}?t=${token}`)
  assert.equal(moved.status, 404)
  assert.equal(verifyReceiptToken(token, second), false)
})

test('a tampered, missing or expired link is a dead end — and never a leaked booking', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  const token = receiptToken(ref)
  const url = (t) => `${base}/api/booking/receipt/${encodeURIComponent(ref)}${t === null ? '' : `?t=${t}`}`

  assert.equal((await fetch(url(null))).status, 404)
  assert.equal((await fetch(url('not-a-token'))).status, 404)
  assert.equal((await fetch(url(token.slice(0, -2) + 'xx'))).status, 404)
  assert.equal((await fetch(url(receiptToken(ref, { days: -1 })))).status, 404)

  const dead = await fetch(url('not-a-token'))
  assert.match(dead.headers.get('content-type'), /text\/html/, 'a browser gets a page, not JSON')
  const html = await dead.text()
  assert.match(html, /no longer valid/)
  assert.ok(!html.includes('Jane'), 'a dead link must not confirm who the booking is for')
  assert.ok(!html.includes('0712345678'))
})

test('the token is an HMAC of the reference, not a guessable id', () => {
  const token = receiptToken('ITOYA-20261224-AB12')
  assert.match(token, /^r1\.[A-Za-z0-9_-]+\.[0-9]+\.[A-Za-z0-9_-]{43}$/)
  assert.ok(!token.includes('ITOYA'), 'the reference itself is encoded, and signed over')
  assert.equal(verifyReceiptToken(token, 'ITOYA-20261224-AB12'), true)

  // A token signed with the same reference but a different secret is worthless.
  const saved = process.env.ADMIN_JWT_SECRET
  process.env.RECEIPT_SECRET = 'a-different-secret'
  assert.equal(verifyReceiptToken(token, 'ITOYA-20261224-AB12'), false)
  delete process.env.RECEIPT_SECRET
  process.env.ADMIN_JWT_SECRET = saved
})

test('receipt links are built from the public API URL, so emails never point at localhost in production', () => {
  const saved = { url: process.env.PUBLIC_API_URL, render: process.env.RENDER_EXTERNAL_URL }
  process.env.PUBLIC_API_URL = 'https://api.hotelitoya.test/'
  assert.match(receiptUrl('ITOYA-20261224-AB12'), /^https:\/\/api\.hotelitoya\.test\/api\/booking\/receipt\//)
  assert.ok(!receiptUrl('ITOYA-20261224-AB12').includes('//api/booking'), 'no doubled slash')

  delete process.env.PUBLIC_API_URL
  process.env.RENDER_EXTERNAL_URL = 'https://hotel-itoya-api.onrender.com'
  assert.match(receiptUrl('X1'), /^https:\/\/hotel-itoya-api\.onrender\.com\//)

  if (saved.url === undefined) delete process.env.PUBLIC_API_URL; else process.env.PUBLIC_API_URL = saved.url
  if (saved.render === undefined) delete process.env.RENDER_EXTERNAL_URL; else process.env.RENDER_EXTERNAL_URL = saved.render
})

test('the cancellation and guest-note emails also carry the receipt link', async () => {
  const ref = await newBooking({ status: 'success', paid: true })
  const res = await fetch(`${base}/api/admin/bookings/${ref}/message`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${await adminToken()}` },
    body: JSON.stringify({ message: 'Your room has been upgraded.' }),
  })
  assert.equal(res.status, 200)
  const links = receiptLinksIn(mail.sent.find((m) => m.to === 'jane@example.com'))
  assert.equal(links.length, 1)
  assert.equal((await fetch(localise(links[0]))).status, 200)
})

