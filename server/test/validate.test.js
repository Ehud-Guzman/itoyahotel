const test = require('node:test')
const assert = require('node:assert/strict')
const {
  nairobiToday, isIsoDate, isEmail, isPhone, isMpesaPhone, validateStay,
  safeFilePart, safeExtension, MAX_NIGHTS,
} = require('../lib/validate')

test('nairobiToday uses Nairobi (UTC+3), not UTC', () => {
  // 21:30 UTC on the 31st is already 00:30 on the 1st in Kenya.
  assert.equal(nairobiToday(new Date('2026-10-31T21:30:00Z')), '2026-11-01')
  assert.equal(nairobiToday(new Date('2026-10-31T20:59:00Z')), '2026-10-31')
})

test('isIsoDate accepts real dates only', () => {
  assert.equal(isIsoDate('2026-12-24'), true)
  assert.equal(isIsoDate('2026-02-30'), false)   // would silently roll into March
  assert.equal(isIsoDate('2026-2-3'), false)
  assert.equal(isIsoDate('24/12/2026'), false)
  assert.equal(isIsoDate(20261224), false)
  assert.equal(isIsoDate(undefined), false)
})

test('isEmail', () => {
  assert.equal(isEmail('guest@example.com'), true)
  assert.equal(isEmail('a.b+c@sub.example.co.ke'), true)
  for (const bad of ['', 'nope', 'a@b', 'a b@c.com', 'a@@b.com', '@b.com', 'a@b.', 'x'.repeat(250) + '@b.com', null, {}]) {
    assert.equal(isEmail(bad), false, String(bad))
  }
})

test('isPhone / isMpesaPhone', () => {
  assert.equal(isPhone('0712 345 678'), true)
  assert.equal(isPhone('+254 712-345-678'), true)
  assert.equal(isPhone('12345'), false)
  assert.equal(isPhone('call me maybe'), false)
  assert.equal(isMpesaPhone('254712345678'), true)
  assert.equal(isMpesaPhone('254112345678'), true)
  assert.equal(isMpesaPhone('0712345678'), false)
  assert.equal(isMpesaPhone('254512345678'), false)
})

test('validateStay', () => {
  const today = '2026-11-01'
  assert.deepEqual(validateStay({ checkIn: '2026-11-01', checkOut: '2026-11-03' }, today), { nights: 2 })
  assert.equal(validateStay({ checkIn: '2026-10-31', checkOut: '2026-11-02' }, today).field, 'checkIn')   // past
  assert.equal(validateStay({ checkIn: '2026-11-05', checkOut: '2026-11-05' }, today).field, 'checkOut')  // zero nights
  assert.equal(validateStay({ checkIn: '2026-11-05', checkOut: '2026-11-04' }, today).field, 'checkOut')
  assert.equal(validateStay({ checkIn: 'soon', checkOut: '2026-11-04' }, today).field, 'checkIn')
  assert.equal(validateStay({ checkIn: '2026-11-05', checkOut: '2026-02-30' }, today).field, 'checkOut')
  assert.equal(validateStay({ checkIn: '2026-11-01', checkOut: '2026-12-01' }, today).nights, 30)         // exactly the limit
  assert.equal(validateStay({ checkIn: '2026-11-01', checkOut: '2026-12-02' }, today).field, 'checkOut')  // 31 > MAX_NIGHTS
  assert.equal(MAX_NIGHTS, 30)
  assert.equal(validateStay({ checkIn: '2030-01-01', checkOut: '2030-01-02' }, today).field, 'checkIn')   // too far ahead
})

test('safeFilePart / safeExtension keep guest input out of filenames', () => {
  assert.equal(safeFilePart('Jane Doe'), 'Jane-Doe')
  assert.equal(safeFilePart('../../etc/passwd\r\nBcc: x'), 'etc-passwd-Bcc-x')
  assert.equal(safeFilePart('   '), 'guest')
  assert.equal(safeFilePart('Zoë'), 'Zoe')
  assert.equal(safeExtension('id.JPG'), 'jpg')
  assert.equal(safeExtension('id.php'), 'bin')
  assert.equal(safeExtension('noext'), 'bin')
})
