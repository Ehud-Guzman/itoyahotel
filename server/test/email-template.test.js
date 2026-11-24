const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { renderEmail } = require('../lib/emailTemplate')

const settings = {
  phones: ['+254 700 111 222', '+254 700 333 444'],
  email: 'frontdesk@hotel.example',
  addressLine: '1 New Road',
  town: 'Busia, Kenya',
}

const bookingEmail = () => renderEmail({
  heading:   'Your booking is in',
  preheader: 'Garden Deluxe · 2026-11-27 → 2026-11-29 · KES 24,000',
  intro:     'Dear Jane, thank you for choosing Hotel Itoya.',
  reference: 'ITOYA-20261127-ABCD',
  rows: [
    { label: 'Room',      value: 'Garden Deluxe' },
    { label: 'Check-in',  value: 'Fri, 27 Nov 2026 — from 2:00 PM' },
    { label: 'Requests',  value: 'Quiet room please\nHigh floor' },
  ],
  total: { label: 'Amount due at check-in', value: 'KES 24,000', note: 'Nothing has been charged.' },
  note: 'To change or cancel this reservation, reply to this email.',
  footerNote: 'We look forward to welcoming you.',
  settings,
})

test('renderEmail produces both an HTML body and a plain-text body', () => {
  const { html, text } = bookingEmail()
  assert.match(html, /^<!DOCTYPE html>/)
  assert.match(html, /ITOYA-20261127-ABCD/)
  assert.match(text, /Booking reference: ITOYA-20261127-ABCD/)
  assert.match(text, /Room: Garden Deluxe/)
  assert.match(text, /Amount due at check-in: KES 24,000/)
  assert.doesNotMatch(text, /<[a-z]/i, 'the text part must not contain markup')
})

test('renderEmail prints the Studio contact details in the footer', () => {
  const { html, text } = bookingEmail()
  for (const needle of ['1 New Road, Busia, Kenya', '+254 700 111 222', 'frontdesk@hotel.example']) {
    assert.ok(html.includes(needle), `html is missing ${needle}`)
    assert.ok(text.includes(needle), `text is missing ${needle}`)
  }
})

test('renderEmail escapes guest-supplied text instead of rendering it', () => {
  const { html, text } = renderEmail({
    heading: 'New website enquiry',
    rows: [{ label: 'Message', value: '<a href="evil">click</a>' }],
    settings,
  })
  assert.match(html, /&lt;a href=&quot;evil&quot;&gt;click&lt;\/a&gt;/)
  assert.doesNotMatch(html, /<a href="evil">/)
  assert.match(text, /<a href="evil">click<\/a>/)
})

test('renderEmail keeps line breaks inside a row value', () => {
  const { html } = bookingEmail()
  assert.match(html, /Quiet room please<br>High floor/)
})

test('no customer-facing copy still contains the truncated "CREDIT CARDS)" sentence', () => {
  // A stray closing parenthesis used to ship in the receipt, the guest email and
  // the confirmation screen ("pay at check-in MPESA OR CREDIT CARDS)"). Copy is
  // customer-facing, so it is worth a guard.
  const roots = ['../routes', '../lib']
  const offenders = []
  for (const root of roots) {
    const dir = path.join(__dirname, root)
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.js'))) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8')
      if (source.includes('CREDIT CARDS)')) offenders.push(`${root}/${file}`)
    }
  }
  assert.deepEqual(offenders, [])
})
