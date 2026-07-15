const express      = require('express')
const crypto       = require('crypto')
const jwt          = require('jsonwebtoken')
const rateLimit    = require('express-rate-limit')
const store        = require('../store')

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
  const token = jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '12h' })
  res.json({ token })
})

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not authenticated.' })
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET)
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
    res.send(buffer)
  } catch (err) {
    console.error('Admin ID image error:', err)
    res.status(500).json({ message: 'Could not load image.' })
  }
})

module.exports = router
