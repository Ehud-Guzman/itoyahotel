const express      = require('express')
const crypto       = require('crypto')
const jwt          = require('jsonwebtoken')
const rateLimit    = require('express-rate-limit')
const store        = require('../store')
const { createTransporter } = require('../lib/mailer')
const { notify } = require('./booking')

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

// ── GET /api/admin/email-status ────────────────────────────────────────────
// Is the server able to send email at all right now? Asks the mail server to
// check the login (no message is sent). Cached briefly: it opens a connection.
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
      new Promise((_, reject) => setTimeout(() => reject(new Error('The mail server did not answer in time.')), 10_000)),
    ])
    value = { ok: true }
  } catch (err) {
    value = { ok: false, error: String(err.message || err).slice(0, 200) }
  }
  emailHealth = { at: Date.now(), value }
  res.json(value)
})

module.exports = router
