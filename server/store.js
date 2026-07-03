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
`

async function init() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
    })
    await pool.query(SCHEMA)
    console.log('Booking store: Postgres connected — bookings persist across restarts.')
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
    },
    idFrontBuffer: row.id_front, idBackBuffer: row.id_back,
    idFrontName: row.id_front_name, idBackName: row.id_back_name,
    status: row.status, checkoutRequestId: row.checkout_request_id,
  }
}

async function create(record) {
  const { b } = record
  if (pool) {
    await pool.query(
      `INSERT INTO bookings
         (ref, room, room_label, check_in, check_out, nights, guests, name, phone, email,
          requests, mpesa_phone, amount, status, checkout_request_id,
          id_front, id_back, id_front_name, id_back_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        b.ref, b.room, b.roomLabel, b.checkIn, b.checkOut, b.nights, b.guests,
        b.name, b.phone, b.email, b.requests || null, b.mpesaPhone, b.amount,
        record.status, record.checkoutRequestId,
        record.idFrontBuffer, record.idBackBuffer, record.idFrontName, record.idBackName,
      ],
    )
  } else {
    memory.set(b.ref, record)
  }
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
           checkout_request_id = COALESCE($4, checkout_request_id)
       WHERE ref = $1`,
      [ref, status, extra.mpesaRef || null, extra.checkoutRequestId || null],
    )
  } else {
    const record = memory.get(ref)
    if (!record) return
    record.status = status
    if (extra.mpesaRef) record.b.mpesaRef = extra.mpesaRef
    if (extra.checkoutRequestId) record.checkoutRequestId = extra.checkoutRequestId
  }
}

async function deleteByRef(ref) {
  if (pool) await pool.query('DELETE FROM bookings WHERE ref = $1', [ref])
  else memory.delete(ref)
}

module.exports = { init, create, getByRef, getByCheckoutRequestId, updateStatus, deleteByRef }
