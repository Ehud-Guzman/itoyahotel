// Input validation shared by the booking and contact routes. Pure functions
// only (no Express, no env) so they can be unit-tested directly.

const MAX_NIGHTS = 30
const MAX_ADVANCE_DAYS = 548            // ~18 months ahead
const LIMITS = {
  name: 100, email: 254, phone: 20, requests: 1000,
  message: 3000, short: 60,             // short: enquiry date/guest-count fields
}

// Kenya has no daylight saving, so Africa/Nairobi is a fixed UTC+3. Using the
// UTC date instead would call 00:00-03:00 on the 1st "still the 31st".
function nairobiToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

// Strict calendar date: "2026-12-24" and nothing else. Rejects "2026-02-30",
// which `new Date()` would silently roll over to March.
function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

function daysBetween(fromIso, toIso) {
  return Math.round((new Date(`${toIso}T00:00:00Z`) - new Date(`${fromIso}T00:00:00Z`)) / 86_400_000)
}

// Pragmatic email check: one @, a dot in the domain, no whitespace. Deliverability
// can't be proven by a regex, so this only rejects obvious typos and junk.
function isEmail(value) {
  return typeof value === 'string'
    && value.length <= LIMITS.email
    && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

// Contact number as typed: digits plus the usual separators, 9-15 digits.
function isPhone(value) {
  if (typeof value !== 'string' || value.length > LIMITS.phone) return false
  if (!/^[+\d\s()-]+$/.test(value)) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 15
}

// The number M-Pesa will push a prompt to must already be in 2547XXXXXXXX /
// 2541XXXXXXXX form (the client normalises before sending).
function isMpesaPhone(value) {
  return typeof value === 'string' && /^254[17]\d{8}$/.test(value)
}

function tooLong(value, max) {
  return typeof value === 'string' && value.length > max
}

// Validates a stay. Returns { error, field } for the first problem, or
// { nights } when it is fine. `today` is injectable for tests.
function validateStay({ checkIn, checkOut }, today = nairobiToday()) {
  if (!isIsoDate(checkIn))  return { error: 'Select a valid check-in date.', field: 'checkIn' }
  if (!isIsoDate(checkOut)) return { error: 'Select a valid check-out date.', field: 'checkOut' }
  const nights = daysBetween(checkIn, checkOut)
  if (!(nights > 0)) return { error: 'Check-out must be after check-in.', field: 'checkOut' }
  if (checkIn < today) return { error: 'Check-in date cannot be in the past.', field: 'checkIn' }
  if (daysBetween(today, checkIn) > MAX_ADVANCE_DAYS) {
    return { error: 'Check-in is too far ahead. Please contact the hotel to book that far in advance.', field: 'checkIn' }
  }
  if (nights > MAX_NIGHTS) {
    return { error: `Online bookings are limited to ${MAX_NIGHTS} nights. Please contact the hotel for longer stays.`, field: 'checkOut' }
  }
  return { nights }
}

// Guest names end up in attachment filenames ("ID-front-<name>.jpg"). Keep
// letters, digits, dash and underscore only, so a crafted name can't inject
// path separators, control characters or an extension.
function safeFilePart(value, fallback = 'guest') {
  const cleaned = String(value ?? '').normalize('NFKD').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return cleaned || fallback
}

// File extension from an uploaded filename, restricted to what we accept.
function safeExtension(filename) {
  const ext = String(filename ?? '').split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext) ? ext : 'bin'
}

module.exports = {
  MAX_NIGHTS, MAX_ADVANCE_DAYS, LIMITS,
  nairobiToday, isIsoDate, daysBetween, isEmail, isPhone, isMpesaPhone, tooLong,
  validateStay, safeFilePart, safeExtension,
}
