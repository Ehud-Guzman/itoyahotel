// Postgres-only: upgrading a database that was created by the OLD code.
// Skipped unless TEST_DATABASE_URL is set (see helpers.js).
const { usingPostgres, sql, closeHelpers } = require('./helpers')
process.env.NODE_ENV = 'test'

const test = require('node:test')
const assert = require('node:assert/strict')

// The bookings table exactly as it was before stk_requested_at existed.
const OLD_SCHEMA = `
  CREATE TABLE bookings (
    ref TEXT PRIMARY KEY, room TEXT NOT NULL, room_label TEXT,
    check_in DATE NOT NULL, check_out DATE NOT NULL, nights INTEGER NOT NULL, guests INTEGER,
    name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, requests TEXT, mpesa_phone TEXT,
    amount NUMERIC NOT NULL, mpesa_ref TEXT, status TEXT NOT NULL DEFAULT 'pending',
    checkout_request_id TEXT, id_front BYTEA, id_back BYTEA, id_front_name TEXT, id_back_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`

test('an existing production-shaped database upgrades in place, keeping its bookings', { skip: !usingPostgres }, async () => {
  await sql('DROP TABLE IF EXISTS bookings')
  await sql(OLD_SCHEMA)
  await sql(`INSERT INTO bookings (ref, room, check_in, check_out, nights, name, phone, email, amount, status, checkout_request_id, id_front)
             VALUES ('OLD-1', 'standard', '2026-12-24', '2026-12-26', 2, 'Old Guest', '0712345678', 'o@example.com', 7000, 'success', 'ck-old', 'x'::bytea)`)

  const store = require('../store')
  await store.init()                 // must add the column, not fail on the existing table
  await store.init().catch(() => {}) // (a second init in the same process is harmless to ignore)

  const col = await sql(`SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='stk_requested_at'`)
  assert.equal(col.rowCount, 1, 'stk_requested_at column was not added')

  const old = await store.getByRef('OLD-1')
  assert.equal(old.b.name, 'Old Guest')
  assert.equal(old.status, 'success')
  assert.equal(old.stkRequestedAt, null)          // pre-existing rows simply have no timestamp

  // and the new code paths work on the upgraded table
  await store.create({
    b: { ref: 'NEW-1', room: 'standard', roomLabel: 'Standard Room', checkIn: '2026-12-24', checkOut: '2026-12-26', nights: 2,
         guests: 1, name: 'New Guest', phone: '0712345678', email: 'n@example.com', amount: 7000 },
    idFrontBuffer: Buffer.from('f'), idBackBuffer: Buffer.from('b'), idFrontName: 'f.jpg', idBackName: 'b.jpg',
    status: 'pending', checkoutRequestId: null,
  })
  await store.updateStatus('NEW-1', 'pending', { checkoutRequestId: 'ck-new' })
  assert.ok(Date.now() - (await store.getByRef('NEW-1')).stkRequestedAt < 10_000)
  assert.equal(await store.transitionStatus('NEW-1', ['pending'], 'success', { mpesaRef: 'ABC' }), true)
  assert.equal(await store.transitionStatus('NEW-1', ['pending'], 'success'), false)

  await store.close()
  await closeHelpers()
})
