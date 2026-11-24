// Signed links to a guest's receipt.
//
// The form (reference + phone) needs the guest to remember two things. This is
// the path for the guest who still has their confirmation email: the link in
// that email carries a token proving it came from us, for that booking, and is
// still valid. Possession of the guest's inbox is the credential — the same
// model every airline and bank uses for "view your invoice".
//
// Why an HMAC and not a random stored id:
//   - No extra table or migration: the token is derived from the reference, so
//     GET /receipt/:ref?t=... can be verified without a lookup of its own.
//   - Bound to the reference. Cut the token off booking A and paste it onto
//     booking B and it fails, so one leaked link cannot be walked across
//     references.
//   - It expires. A link in a two-year-old inbox stops working on its own.
//   - It is revocable wholesale: change RECEIPT_SECRET and every link ever
//     emailed dies at once. (Per-booking revocation would need stored state;
//     a cancelled booking still legitimately needs its receipt, so nothing in
//     the booking lifecycle should kill a link anyway.)
//
// Deliberately not a session token: it grants one thing — a PDF for the one
// reference it names — and nothing in the admin API accepts it.

const crypto = require('crypto')

const VERSION       = 'r1'
const DEFAULT_DAYS  = 60

// Keyed off RECEIPT_SECRET when set, otherwise derived from ADMIN_JWT_SECRET so
// a deployment already running the dashboard needs no new variable. The prefix
// is domain separation: even sharing one secret, a value signed for a receipt
// can never be replayed as an admin session (or vice versa).
function signingKey() {
  const source = process.env.RECEIPT_SECRET || process.env.ADMIN_JWT_SECRET
  if (!source) {
    throw new Error('Set RECEIPT_SECRET (or ADMIN_JWT_SECRET) to sign receipt links.')
  }
  return crypto.createHash('sha256').update(`hotel-itoya/receipt/${VERSION}:${source}`).digest()
}

function signature(payload) {
  return crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url')
}

// Length-safe constant-time compare: timingSafeEqual throws on unequal lengths,
// and the length of an HMAC is not a secret.
function sameValue(a, b) {
  const left  = Buffer.from(String(a ?? ''))
  const right = Buffer.from(String(b ?? ''))
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

/**
 * Token for one booking reference.
 * @param {string} ref
 * @param {{ days?: number, now?: number }} [options]
 */
function receiptToken(ref, { days = DEFAULT_DAYS, now = Date.now() } = {}) {
  const expires = Math.floor(now / 1000) + Math.round(days * 86400)
  const payload = `${VERSION}.${Buffer.from(String(ref)).toString('base64url')}.${expires}`
  return `${payload}.${signature(payload)}`
}

/**
 * True only if `token` was issued by us, for this exact reference, and has not
 * expired. Never throws — a missing secret is a configuration fault, and the
 * safe answer to a caller is "not verified".
 */
function verifyReceiptToken(token, ref, { now = Date.now() } = {}) {
  if (!ref) return false
  const parts = String(token ?? '').split('.')
  if (parts.length !== 4) return false

  const [version, refPart, expiresPart, presented] = parts
  if (version !== VERSION) return false

  let expected
  try {
    expected = signature(`${version}.${refPart}.${expiresPart}`)
  } catch (err) {
    console.error('[RECEIPT LINK]', err.message)
    return false
  }
  if (!sameValue(presented, expected)) return false

  if (!/^\d{10,12}$/.test(expiresPart)) return false
  if (Number(expiresPart) * 1000 <= now) return false

  let claimed
  try {
    claimed = Buffer.from(refPart, 'base64url').toString('utf8')
  } catch {
    return false
  }
  return sameValue(claimed, String(ref))
}

// Absolute base for links we put in email. PUBLIC_API_URL is the explicit
// setting; RENDER_EXTERNAL_URL is filled in automatically by Render, so a
// deploy that forgets the variable still links somewhere correct.
function publicBaseUrl() {
  const raw = process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL
    || `http://localhost:${process.env.PORT || 4000}`
  return String(raw).replace(/\/+$/, '')
}

/** The link a guest clicks in their email: downloads the PDF directly. */
function receiptUrl(ref, options = {}) {
  return `${publicBaseUrl()}/api/booking/receipt/${encodeURIComponent(String(ref))}?t=${receiptToken(ref, options)}`
}

module.exports = { receiptToken, verifyReceiptToken, receiptUrl, publicBaseUrl, DEFAULT_DAYS }
