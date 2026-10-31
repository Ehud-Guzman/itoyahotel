// Runs against the in-memory store by default. Set TEST_DATABASE_URL to a local
// throwaway Postgres to run the very same assertions against the real SQL
// (see helpers.js).
const { usingPostgres, sql, resetBookings, closeHelpers } = require('./helpers')
process.env.NODE_ENV = 'test'

const test = require('node:test')
const assert = require('node:assert/strict')
const store = require('../store')

const DAY = 86_400_000
const isoDay = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10)

function booking(ref, { status = 'pending', checkOut = isoDay(2) } = {}) {
  return {
    b: { ref, room: 'standard', roomLabel: 'Standard Room', checkIn: isoDay(0), checkOut, nights: 2,
         guests: 1, name: 'Test Guest', phone: '0712345678', email: 'g@example.com', amount: 7000 },
    idFrontBuffer: Buffer.from('front'), idBackBuffer: Buffer.from('back'),
    idFrontName: 'f.jpg', idBackName: 'b.jpg', status, checkoutRequestId: null,
  }
}

test.before(async () => {
  await resetBookings()
  await store.init()
})
test.after(async () => {
  await store.close()
  await closeHelpers()
})

// create() stamps createdAt itself, so back-date a stored booking after the fact.
async function backdate(ref, days) {
  if (usingPostgres) {
    await sql('UPDATE bookings SET created_at = now() - make_interval(days => $2::int) WHERE ref = $1', [ref, days])
  } else {
    ;(await store.getByRef(ref)).createdAt = new Date(Date.now() - days * DAY).toISOString()
  }
}

test('transitionStatus: only one of two racing settlers wins', async () => {
  await store.create(booking('R1'))
  const results = await Promise.all([
    store.transitionStatus('R1', ['pending'], 'success', { mpesaRef: 'ABC' }),
    store.transitionStatus('R1', ['pending'], 'success', { mpesaRef: 'ABC' }),
  ])
  assert.deepEqual(results.sort(), [false, true])
  assert.equal((await store.getByRef('R1')).status, 'success')
  assert.equal((await store.getByRef('R1')).b.mpesaRef, 'ABC')
})

test('transitionStatus: a late "failed" cannot overwrite a paid booking', async () => {
  await store.create(booking('R2', { status: 'success' }))
  assert.equal(await store.transitionStatus('R2', ['pending'], 'failed'), false)
  assert.equal((await store.getByRef('R2')).status, 'success')
})

test('transitionStatus: unknown booking is a no-op', async () => {
  assert.equal(await store.transitionStatus('NOPE', ['pending'], 'success'), false)
})

test('updateStatus with a checkout id stamps stkRequestedAt', async () => {
  await store.create(booking('R3'))
  assert.equal((await store.getByRef('R3')).stkRequestedAt ?? null, null)
  await store.updateStatus('R3', 'pending', { checkoutRequestId: 'ws_CO_1' })
  const rec = await store.getByRef('R3')
  assert.ok(Date.now() - rec.stkRequestedAt < 5000)
})

test('purgeIdDocuments removes IDs by retention rule and keeps the booking', async () => {
  await store.create(booking('P-OLD-PAID',   { status: 'reservation', checkOut: isoDay(-100) }))
  await store.create(booking('P-NEW-PAID',   { status: 'reservation', checkOut: isoDay(-10) }))
  await store.create(booking('P-FUTURE',     { status: 'success',     checkOut: isoDay(5) }))
  await store.create(booking('P-OLD-ABAND',  { status: 'failed' }))
  await backdate('P-OLD-ABAND', 30)
  await store.create(booking('P-NEW-ABAND',  { status: 'pending' }))

  const purged = await store.purgeIdDocuments({ retentionDays: 90, abandonedDays: 7 })
  assert.equal(purged, 2)

  const has = async (ref) => !!(await store.getByRef(ref)).idFrontBuffer
  assert.equal(await has('P-OLD-PAID'), false)
  assert.equal(await has('P-OLD-ABAND'), false)
  assert.equal(await has('P-NEW-PAID'), true)    // inside the 90-day window
  assert.equal(await has('P-FUTURE'), true)      // hasn't even checked out
  assert.equal(await has('P-NEW-ABAND'), true)   // just started

  // The booking record survives, and the admin list reports no ID on file.
  const listed = (await store.listAll()).find((r) => r.ref === 'P-OLD-PAID')
  assert.ok(listed)
  assert.equal(listed.hasIdFront, false)
  assert.equal(listed.name, 'Test Guest')

  // Idempotent: a second run has nothing left to do.
  assert.equal(await store.purgeIdDocuments({ retentionDays: 90, abandonedDays: 7 }), 0)
})
