// Booking storage — Postgres when DATABASE_URL is set, in-memory otherwise.
// The in-memory fallback exists so the server still runs without a database
// configured, but bookings will NOT survive a restart/redeploy in that mode.
// Set DATABASE_URL (any standard Postgres connection string — Neon, Supabase,
// Railway, etc. all work) before relying on this for real guest payments.
const { Pool } = require('pg')

let pool = null
let memory = null

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookings (
    ref                  TEXT PRIMARY KEY,
    room                 TEXT NOT NULL,
    room_label           TEXT,
    check_in             DATE NOT NULL,
    check_out            DATE NOT NULL,
    nights               INTEGER NOT NULL,
    guests               INTEGER,
    name                 TEXT NOT NULL,
    phone                TEXT NOT NULL,
    email                TEXT NOT NULL,
    requests             TEXT,
    mpesa_phone          TEXT,
    amount               NUMERIC NOT NULL,
    mpesa_ref            TEXT,
    status               TEXT NOT NULL DEFAULT 'pending',
    checkout_request_id  TEXT,
    id_front             BYTEA,
    id_back              BYTEA,
    id_front_name        TEXT,
    id_back_name         TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_checkout_request ON bookings (checkout_request_id);
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stk_requested_at TIMESTAMPTZ;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency  TEXT NOT NULL DEFAULT 'KES';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS plan      TEXT NOT NULL DEFAULT 'bb';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS residency TEXT NOT NULL DEFAULT 'local';
  -- Whether each email was actually delivered: 'pending' | 'sent' | 'failed'.
  -- The default is 'sent' so every booking that already exists counts as handled and
  -- the retry job can never re-send emails for old bookings; new bookings are
  -- inserted explicitly as 'pending'.
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_email_status TEXT NOT NULL DEFAULT 'sent';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email_status TEXT NOT NULL DEFAULT 'sent';
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_attempts     INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_error        TEXT;
  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email_last_attempt TIMESTAMPTZ;
`

async function init() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
    })
    await pool.query(SCHEMA)
    console.log('Booking store: Postgres connected — bookings persist across restarts.')
  } else if (process.env.NODE_ENV === 'production') {
    // Refuse to start in production without persistence — guests would be
    // paying real money into a store that's wiped on the next restart or
    // redeploy, with no way to recover an in-flight booking.
    throw new Error(
      'DATABASE_URL is not set. Refusing to start in production with in-memory ' +
      'booking storage — every restart/redeploy would silently lose all bookings, ' +
      'including ones with completed M-Pesa payments. Provision Postgres (Neon, ' +
      'Supabase, Railway, etc.) and set DATABASE_URL before deploying.',
    )
  } else {
    memory = new Map()
    console.warn(
      'Booking store: DATABASE_URL not set — using in-memory storage. ' +
      'Bookings will be LOST on restart/redeploy. Set DATABASE_URL before taking real payments.',
    )
  }
}

function rowToRecord(row) {
  if (!row) return null
  return {
    b: {
      ref: row.ref, room: row.room, roomLabel: row.room_label,
      checkIn: row.check_in.toISOString().slice(0, 10),
      checkOut: row.check_out.toISOString().slice(0, 10),
      nights: row.nights, guests: row.guests, name: row.name, phone: row.phone,
      email: row.email, requests: row.requests, mpesaPhone: row.mpesa_phone,
      amount: Number(row.amount), mpesaRef: row.mpesa_ref,
      currency: row.currency, plan: row.plan, residency: row.residency,
    },
    email: {
      hotel: row.hotel_email_status, guest: row.guest_email_status, attempts: row.email_attempts,
      error: row.email_error, lastAttempt: row.email_last_attempt ? row.email_last_attempt.getTime() : null,
    },
    idFrontBuffer: row.id_front, idBackBuffer: row.id_back,
    idFrontName: row.id_front_name, idBackName: row.id_back_name,
    status: row.status, checkoutRequestId: row.checkout_request_id,
    stkRequestedAt: row.stk_requested_at ? row.stk_requested_at.getTime() : null,
  }
}

async function create(record) {
  const { b } = record
  if (pool) {
    await pool.query(
      `INSERT INTO bookings
         (ref, room, room_label, check_in, check_out, nights, guests, name, phone, email,
          requests, mpesa_phone, amount, status, checkout_request_id,
          id_front, id_back, id_front_name, id_back_name, currency, plan, residency,
          hotel_email_status, guest_email_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'pending','pending')`,
      [
        b.ref, b.room, b.roomLabel, b.checkIn, b.checkOut, b.nights, b.guests,
        b.name, b.phone, b.email, b.requests || null, b.mpesaPhone, b.amount,
        record.status, record.checkoutRequestId,
        record.idFrontBuffer, record.idBackBuffer, record.idFrontName, record.idBackName,
        b.currency || 'KES', b.plan || 'bb', b.residency || 'local',
      ],
    )
  } else {
    memory.set(b.ref, {
      ...record, createdAt: new Date().toISOString(),
      email: { hotel: 'pending', guest: 'pending', attempts: 0, error: null, lastAttempt: null },
    })
  }
}

// Admin dashboard listing — deliberately excludes id_front/id_back (BYTEA)
// so the list payload stays small; fetch those per-row via getByRef.
async function listAll() {
  if (pool) {
    const { rows } = await pool.query(
      `SELECT ref, room, room_label, check_in, check_out, nights, guests,
              name, phone, email, requests, mpesa_phone, amount, mpesa_ref,
              status, (id_front IS NOT NULL) AS has_id_front,
              (id_back IS NOT NULL) AS has_id_back, created_at,
              currency, plan, residency,
              hotel_email_status, guest_email_status, email_attempts, email_error
       FROM bookings ORDER BY created_at DESC`,
    )
    return rows.map((row) => ({
      ref: row.ref, room: row.room, roomLabel: row.room_label,
      checkIn: row.check_in.toISOString().slice(0, 10),
      checkOut: row.check_out.toISOString().slice(0, 10),
      nights: row.nights, guests: row.guests, name: row.name, phone: row.phone,
      email: row.email, requests: row.requests, mpesaPhone: row.mpesa_phone,
      amount: Number(row.amount), mpesaRef: row.mpesa_ref, status: row.status,
      currency: row.currency, plan: row.plan, residency: row.residency,
      emailHotel: row.hotel_email_status, emailGuest: row.guest_email_status,
      emailAttempts: row.email_attempts, emailError: row.email_error,
      hasIdFront: row.has_id_front, hasIdBack: row.has_id_back,
      createdAt: row.created_at.toISOString(),
    }))
  }
  return [...memory.values()]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map((record) => ({
      ...record.b, status: record.status,
      emailHotel: record.email?.hotel, emailGuest: record.email?.guest,
      emailAttempts: record.email?.attempts, emailError: record.email?.error,
      hasIdFront: !!record.idFrontBuffer, hasIdBack: !!record.idBackBuffer,
      createdAt: record.createdAt,
    }))
}

async function getByRef(ref) {
  if (pool) {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE ref = $1', [ref])
    return rowToRecord(rows[0])
  }
  return memory.get(ref) || null
}

async function getByCheckoutRequestId(checkoutRequestId) {
  if (pool) {
    const { rows } = await pool.query(
      'SELECT * FROM bookings WHERE checkout_request_id = $1',
      [checkoutRequestId],
    )
    return rowToRecord(rows[0])
  }
  for (const record of memory.values()) {
    if (record.checkoutRequestId === checkoutRequestId) return record
  }
  return null
}

async function updateStatus(ref, status, extra = {}) {
  if (pool) {
    await pool.query(
      `UPDATE bookings
       SET status = $2,
           mpesa_ref = COALESCE($3, mpesa_ref),
           checkout_request_id = COALESCE($4, checkout_request_id),
           stk_requested_at = CASE WHEN $4::text IS NOT NULL THEN now() ELSE stk_requested_at END
       WHERE ref = $1`,
      [ref, status, extra.mpesaRef || null, extra.checkoutRequestId || null],
    )
  } else {
    const record = memory.get(ref)
    if (!record) return
    record.status = status
    if (extra.mpesaRef) record.b.mpesaRef = extra.mpesaRef
    if (extra.checkoutRequestId) {
      record.checkoutRequestId = extra.checkoutRequestId
      record.stkRequestedAt = Date.now()
    }
  }
}

// Compare-and-set: moves a booking to `status` only if it is currently in one
// of `from`, and reports whether THIS call made the change. Settling a payment
// has side effects (confirmation emails), and two paths can race to settle the
// same booking: Safaricom's callback and the client's status poll. With a plain
// "read, then update" both can see 'pending' and both send emails; with this,
// exactly one gets `true`. It also stops a late "failed" callback from
// overwriting a booking that was already confirmed as paid.
async function transitionStatus(ref, from, status, extra = {}) {
  if (pool) {
    const { rowCount } = await pool.query(
      `UPDATE bookings
       SET status = $3,
           mpesa_ref = COALESCE($4, mpesa_ref)
       WHERE ref = $1 AND status = ANY($2::text[])`,
      [ref, from, status, extra.mpesaRef || null],
    )
    return rowCount === 1
  }
  const record = memory.get(ref)
  if (!record || !from.includes(record.status)) return false
  record.status = status
  if (extra.mpesaRef) record.b.mpesaRef = extra.mpesaRef
  return true
}

// ── Email delivery tracking ────────────────────────────────────────────────────
// A booking is only "handled" once the hotel alert AND the guest confirmation have
// actually gone out. Until then it is retried with backoff and shown in the admin
// dashboard, so a failed email can never silently lose a booking.

const MAX_EMAIL_ATTEMPTS = 5
const RETRY_WINDOW_HOURS = 48                      // never go back further than this
const FIRST_RETRY_AFTER_MS = 2 * 60 * 1000         // a booking whose first attempt never reported back

// Records the outcome of one delivery attempt. `hotel` / `guest` are 'sent' or
// 'failed' for the parts that were tried, and left undefined for parts that were not.
async function recordEmailResult(ref, { hotel, guest, error }) {
  if (pool) {
    await pool.query(
      `UPDATE bookings
       SET hotel_email_status = COALESCE($2, hotel_email_status),
           guest_email_status = COALESCE($3, guest_email_status),
           email_attempts     = email_attempts + 1,
           email_last_attempt = now(),
           email_error        = CASE WHEN COALESCE($2, hotel_email_status) = 'sent'
                                      AND COALESCE($3, guest_email_status) = 'sent'
                                     THEN NULL ELSE COALESCE($4, email_error) END
       WHERE ref = $1`,
      [ref, hotel || null, guest || null, error ? String(error).slice(0, 300) : null],
    )
    return
  }
  const record = memory.get(ref)
  if (!record) return
  const e = record.email
  if (hotel) e.hotel = hotel
  if (guest) e.guest = guest
  e.attempts += 1
  e.lastAttempt = Date.now()
  e.error = e.hotel === 'sent' && e.guest === 'sent' ? null : (error ? String(error).slice(0, 300) : e.error)
}

// Is this booking due for another attempt? Wait 2, 4, 8, 16 minutes after attempts
// 1-4. A booking whose first attempt never reported back (the server stopped
// mid-send) is picked up once it is a couple of minutes old. The arithmetic lives
// here, not in SQL, so Postgres and the in-memory store behave identically.
function dueForRetry({ createdAt, attempts, lastAttempt }, now) {
  if (attempts >= MAX_EMAIL_ATTEMPTS) return false
  if (createdAt < now - RETRY_WINDOW_HOURS * 3_600_000) return false
  return lastAttempt == null
    ? createdAt < now - FIRST_RETRY_AFTER_MS
    : lastAttempt < now - (2 ** attempts) * 60_000
}

// Bookings whose emails still need to go out and whose backoff has elapsed.
async function findEmailsToRetry({ limit = 20 } = {}) {
  const now = Date.now()
  if (pool) {
    // Plain SQL: only the small set of unfinished recent bookings; dueForRetry decides.
    const { rows } = await pool.query(
      `SELECT ref, created_at, email_attempts, email_last_attempt FROM bookings
       WHERE status IN ('reservation', 'success')
         AND (hotel_email_status <> 'sent' OR guest_email_status <> 'sent')
         AND email_attempts < $1
         AND created_at > $2
       ORDER BY created_at
       LIMIT 200`,
      [MAX_EMAIL_ATTEMPTS, new Date(now - RETRY_WINDOW_HOURS * 3_600_000)],
    )
    return rows
      .filter((r) => dueForRetry({
        createdAt: r.created_at.getTime(), attempts: r.email_attempts,
        lastAttempt: r.email_last_attempt ? r.email_last_attempt.getTime() : null,
      }, now))
      .slice(0, limit)
      .map((r) => r.ref)
  }
  return [...memory.values()]
    .filter((r) => {
      if (r.status !== 'reservation' && r.status !== 'success') return false
      const e = r.email
      if (!e || (e.hotel === 'sent' && e.guest === 'sent')) return false
      return dueForRetry({ createdAt: new Date(r.createdAt).getTime(), attempts: e.attempts, lastAttempt: e.lastAttempt }, now)
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit)
    .map((r) => r.b.ref)
}

// A staff member pressed "Resend": start the attempt count again.
async function resetEmailAttempts(ref) {
  if (pool) await pool.query('UPDATE bookings SET email_attempts = 0, email_last_attempt = NULL WHERE ref = $1', [ref])
  else { const r = memory.get(ref); if (r) { r.email.attempts = 0; r.email.lastAttempt = null } }
}

// Data minimisation: removes the stored ID images (the booking record itself
// stays) once they have served their purpose.
//   - settled bookings (paid / reserved): `retentionDays` after check-out
//   - abandoned attempts (never paid, still pending/failed): `abandonedDays`
//     after they were created
// Returns the number of bookings whose images were removed.
async function purgeIdDocuments({ retentionDays, abandonedDays = 7 }) {
  if (pool) {
    const { rowCount } = await pool.query(
      `UPDATE bookings
       SET id_front = NULL, id_back = NULL
       WHERE (id_front IS NOT NULL OR id_back IS NOT NULL)
         AND (
           (status IN ('success', 'reservation') AND check_out < CURRENT_DATE - $1::int)
           OR (status IN ('pending', 'failed') AND created_at < now() - make_interval(days => $2::int))
         )`,
      [retentionDays, abandonedDays],
    )
    return rowCount
  }
  const day = 86_400_000
  let purged = 0
  for (const record of memory.values()) {
    if (!record.idFrontBuffer && !record.idBackBuffer) continue
    const settled = record.status === 'success' || record.status === 'reservation'
    const expired = settled
      ? new Date(`${record.b.checkOut}T00:00:00Z`).getTime() < Date.now() - retentionDays * day
      : new Date(record.createdAt).getTime() < Date.now() - abandonedDays * day
    if (!expired) continue
    record.idFrontBuffer = null
    record.idBackBuffer = null
    purged++
  }
  return purged
}

async function deleteByRef(ref) {
  if (pool) await pool.query('DELETE FROM bookings WHERE ref = $1', [ref])
  else memory.delete(ref)
}

// Lets tests (and graceful shutdowns) release the connection pool.
async function close() {
  if (pool) await pool.end()
}

module.exports = {
  close, init, create, getByRef, getByCheckoutRequestId, updateStatus, transitionStatus,
  deleteByRef, listAll, purgeIdDocuments,
  recordEmailResult, findEmailsToRetry, resetEmailAttempts, MAX_EMAIL_ATTEMPTS,
}
