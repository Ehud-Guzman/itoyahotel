// Shared by the store/payment tests so the same suite can run against either
// the in-memory store (default) or a real Postgres:
//
//   TEST_DATABASE_URL=postgres://postgres:test@localhost:5432/postgres npm test
//
// The database MUST be a throwaway one on localhost: tests truncate `bookings`.
// Tests must never reach the real CMS: point the site-data fetch at a closed port so it
// falls back to the built-in prices (tests that need CMS data start their own stub server).
process.env.SANITY_API_HOST ||= 'http://127.0.0.1:9'

const url = process.env.TEST_DATABASE_URL
if (url && !/localhost|127\.0\.0\.1/.test(url)) {
  throw new Error('TEST_DATABASE_URL must point at a local throwaway database (it gets truncated).')
}
if (url) process.env.DATABASE_URL = url
else delete process.env.DATABASE_URL

let pool
const usingPostgres = Boolean(url)

async function sql(query, params) {
  pool ||= new (require('pg').Pool)({ connectionString: url })
  return pool.query(query, params)
}

// Start each run from an empty table (Postgres only; memory starts empty anyway).
async function resetBookings() {
  if (usingPostgres) await sql('DROP TABLE IF EXISTS bookings')
}

async function closeHelpers() {
  await pool?.end()
}

module.exports = { usingPostgres, sql, resetBookings, closeHelpers }
