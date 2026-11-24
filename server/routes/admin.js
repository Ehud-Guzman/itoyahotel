const express      = require('express')
const crypto       = require('crypto')
const jwt          = require('jsonwebtoken')
const rateLimit    = require('express-rate-limit')
const store        = require('../store')
const { createTransporter } = require('../lib/mailer')
const { notify, sendCancellationEmail, sendGuestMessage } = require('./booking')
const { buildReceiptPdf, receiptFilename } = require('../lib/receiptPdf')
const { getSiteData } = require('../lib/siteData')

const router = express.Router()

const MIME_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', pdf: 'application/pdf',
}

function timingSafeStringsEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal length so a length mismatch doesn't
    // return faster than a same-length mismatch.
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait a few minutes and try again.' },
})

// ── POST /api/admin/login ─────────────────────────────────────────────────
router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body
  if (!password || !timingSafeStringsEqual(password, process.env.ADMIN_PASSWORD || '')) {
    return res.status(401).json({ message: 'Incorrect password.' })
  }
  try {
    const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, {
      expiresIn: '12h', algorithm: 'HS256',
    })
    res.json({ token })
  } catch (err) {
    console.error('Admin login token signing error:', err.message)
    res.status(500).json({ message: 'Server is not configured for admin login yet.' })
  }
})

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not authenticated.' })
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET, { algorithms: ['HS256'] })
    next()
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}

// ── GET /api/admin/bookings ───────────────────────────────────────────────
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    res.json(await store.listAll())
  } catch (err) {
    console.error('Admin bookings list error:', err)
    res.status(500).json({ message: 'Could not load bookings.' })
  }
})

// ── GET /api/admin/bookings/:ref/id/:side ─────────────────────────────────
router.get('/bookings/:ref/id/:side', requireAdmin, async (req, res) => {
  const { ref, side } = req.params
  if (side !== 'front' && side !== 'back') return res.status(400).json({ message: 'Invalid side.' })

  try {
    const record = await store.getByRef(ref)
    if (!record) return res.status(404).json({ message: 'Booking not found.' })

    const buffer   = side === 'front' ? record.idFrontBuffer : record.idBackBuffer
    const filename = side === 'front' ? record.idFrontName   : record.idBackName
    if (!buffer) return res.status(404).json({ message: 'No ID image on file for this side.' })

    const ext = (filename || '').split('.').pop()?.toLowerCase()
    res.set('Content-Type', MIME_BY_EXT[ext] || 'application/octet-stream')
    // Guest ID documents: never let a browser or intermediary cache them.
    res.set('Cache-Control', 'private, no-store')
    res.send(buffer)
  } catch (err) {
    console.error('Admin ID image error:', err)
    res.status(500).json({ message: 'Could not load image.' })
  }
})

// ── POST /api/admin/bookings/:ref/resend-emails ─────────────────────────────
// Staff pressed "Resend" on a booking whose email did not arrive. Sends whatever
// has not been delivered yet (an email that already arrived is never sent twice).
router.post('/bookings/:ref/resend-emails', requireAdmin, async (req, res) => {
  try {
    const record = await store.getByRef(req.params.ref)
    if (!record) return res.status(404).json({ message: 'Booking not found.' })
    await store.resetEmailAttempts(record.b.ref)
    const result = await notify(record)
    const fresh = await store.getByRef(record.b.ref)
    res.json({ hotel: fresh.email.hotel, guest: fresh.email.guest, error: fresh.email.error, attempted: result })
  } catch (err) {
    console.error('Admin resend error:', err)
    res.status(500).json({ message: 'Could not resend the emails.' })
  }
})

// ── GET /api/admin/bookings/:ref/receipt ─────────────────────────────────────
// The guest's own PDF receipt, for when someone calls and asks for another copy.
// Same renderer as the emailed attachment, so the two can never differ.
router.get('/bookings/:ref/receipt', requireAdmin, async (req, res) => {
  try {
    const record = await store.getByRef(req.params.ref)
    if (!record) return res.status(404).json({ message: 'Booking not found.' })
    if (!['success', 'reservation', 'cancelled'].includes(record.status)) {
      return res.status(409).json({ message: 'This booking was never completed, so there is no receipt.' })
    }
    const { settings } = await getSiteData()
    const pdf = buildReceiptPdf(record, { settings })
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receiptFilename(record.b.ref)}"`,
      'Cache-Control': 'private, no-store',
    })
    res.send(pdf)
  } catch (err) {
    console.error('Admin receipt error:', err)
    res.status(500).json({ message: 'Could not prepare the receipt.' })
  }
})

// ── POST /api/admin/bookings/:ref/cancel ─────────────────────────────────────
// The room is released and the guest is told, in one action. The status changes
// first and the email second: if the email fails the booking is still correctly
// cancelled (staff see the error and can send the note again), whereas emailing
// first could tell a guest they were cancelled while the room stayed booked.
router.post('/bookings/:ref/cancel', requireAdmin, async (req, res) => {
  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 400) : ''
    const record = await store.getByRef(req.params.ref)
    if (!record) return res.status(404).json({ message: 'Booking not found.' })
    if (record.status === 'cancelled') return res.status(409).json({ message: 'This booking is already cancelled.' })
    if (!store.CANCELLABLE_STATUSES.includes(record.status)) {
      return res.status(409).json({ message: 'Only a confirmed or paid booking can be cancelled — this one never completed.' })
    }

    // Snapshot the status before the compare-and-set. The in-memory store mutates
    // the very object `record` points at, so reading record.status afterwards
    // would say "cancelled" and the guest would be told nothing was charged.
    const wasPaid = record.status === 'success'
    // The amount paid is snapshotted here too, and the store keeps it for good:
    // the receipt a guest can still download months later has to say whether a
    // refund is owed, and by then the record simply says 'cancelled'.
    const paidAmount = wasPaid ? Number(record.b.amount) || 0 : 0
    const cancelled = await store.cancel(record.b.ref, { reason, paidAmount })
    if (!cancelled) return res.status(409).json({ message: 'This booking changed while you were cancelling it. Refresh to see its current status.' })

    // A paid booking is still recognised as paid, so the refund sentence is included.
    const email = await sendCancellationEmail({ ...record, status: wasPaid ? 'success' : 'reservation' }, { reason })
    res.json({ status: 'cancelled', cancelledAt: new Date().toISOString(), email })
  } catch (err) {
    console.error('Admin cancel error:', err)
    res.status(500).json({ message: 'Could not cancel the booking.' })
  }
})

// ── POST /api/admin/bookings/:ref/message ────────────────────────────────────
// A note to the guest in the hotel's own email layout — the usual way to confirm
// a change agreed on the phone. The subject is optional; the body is required.
router.post('/bookings/:ref/message', requireAdmin, async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim().slice(0, 140) : ''
    if (message.length < 5) return res.status(400).json({ message: 'Write a message of at least a few words.' })
    if (message.length > 2000) return res.status(400).json({ message: 'That message is too long. Please keep it under 2000 characters.' })

    const record = await store.getByRef(req.params.ref)
    if (!record) return res.status(404).json({ message: 'Booking not found.' })
    if (!['reservation', 'success', 'cancelled'].includes(record.status)) {
      return res.status(409).json({ message: 'This booking never completed, so there is no guest to email.' })
    }

    const email = await sendGuestMessage(record, { message, subject })
    res.json({ email })
  } catch (err) {
    console.error('Admin guest message error:', err)
    res.status(500).json({ message: 'Could not send the message.' })
  }
})

// ── GET /api/admin/email-status ────────────────────────────────────────────
// Is the server able to send email at all right now? Checks Brevo credentials
// without sending a message. Cached briefly to avoid unnecessary API calls.
// A good result is remembered for a minute; a failure for only a few seconds, so the
// warning clears promptly once email is working again instead of lingering.
const HEALTHY_TTL_MS = 60_000
const FAILING_TTL_MS = 5_000
let emailHealth = { at: 0, value: null }
router.get('/email-status', requireAdmin, async (req, res) => {
  const ttl = emailHealth.value?.ok ? HEALTHY_TTL_MS : FAILING_TTL_MS
  if (emailHealth.value && Date.now() - emailHealth.at < ttl) return res.json(emailHealth.value)
  let value
  try {
    const transporter = createTransporter()
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('The email provider did not answer in time.')), 10_000)),
    ])
    value = { ok: true }
  } catch (err) {
    value = { ok: false, error: String(err.response?.data?.message || err.message || err).slice(0, 200) }
  }
  emailHealth = { at: Date.now(), value }
  res.json(value)
})

module.exports = router
