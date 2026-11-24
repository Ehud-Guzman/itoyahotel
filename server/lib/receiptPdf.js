// The booking receipt, rendered once and used everywhere: it is attached to the
// guest's confirmation email and served to the browser when the guest presses
// "Download Receipt". One renderer is the point — a receipt emailed to the guest
// and one downloaded from the confirmation screen can never disagree, and the
// guest keeps a copy in their inbox long after the browser tab is gone.
//
// jsPDF draws with the PDF standard fonts (Times/Helvetica), so nothing is
// embedded and the file stays ~3 KB — small enough to attach to every email.
//
// Everything printed comes from the stored booking record, never from the
// browser: a guest cannot talk the receipt into a lower amount or a different
// M-Pesa code than the one Safaricom confirmed.
const { jsPDF } = require('jspdf')
const { planLabel } = require('./siteData')

const FALLBACK_HOTEL = {
  phones: ['+254 714 302 777'],
  email: 'hotel.itoya@ayotigroup.com',
  addressLine: 'B1 Kisumu-Busia Road',
  town: 'Busia, Kenya',
}

const GOLD  = [199, 165, 107]
const INK   = [26, 22, 18]
const GREY  = [120, 112, 102]
const BODY  = [70, 64, 58]
const RULE  = [230, 226, 218]
const CREAM = [249, 245, 239]
const GREEN = [30, 112, 66]

/** "KES 24,000" / "USD 62" — the currency is always spelled out. */
function money(amount, currency = 'KES') {
  const n = Number(amount)
  return `${currency} ${(Number.isFinite(n) ? n : 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
}

// Booking dates are stored as `YYYY-MM-DD`, which JS would otherwise read as UTC
// midnight — a day earlier than the guest booked anywhere west of Greenwich.
// Parsed and printed in UTC, the calendar date is exactly what was saved.
function longDate(iso) {
  if (!iso) return '—'
  const date = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return String(iso)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

function nightsLabel(nights) {
  const count = Number(nights) || 0
  return `${count} night${count === 1 ? '' : 's'}`
}

/** The filename the guest sees, both in the browser and as an email attachment. */
function receiptFilename(ref) {
  return `Hotel-Itoya-${String(ref || 'booking').replace(/[^\w-]/g, '')}.pdf`
}

/**
 * @param {object} record   A booking record as returned by store.getByRef()
 * @param {object} [options]
 * @param {object} [options.settings]  Site Settings: phones, email, addressLine, town
 * @param {Date}   [options.issuedAt]  Defaults to now; tests pass a fixed date
 * @returns {Buffer} the PDF file
 */
function buildReceiptPdf(record, { settings = {}, issuedAt = new Date() } = {}) {
  const b = record?.b
  if (!b?.ref) throw new Error('buildReceiptPdf needs a booking record with a reference.')

  const hotel = {
    phones: Array.isArray(settings.phones) && settings.phones.length ? settings.phones : FALLBACK_HOTEL.phones,
    email: settings.email || FALLBACK_HOTEL.email,
    addressLine: settings.addressLine || FALLBACK_HOTEL.addressLine,
    town: settings.town || FALLBACK_HOTEL.town,
  }

  const paid          = record.status === 'success'
  const cancelled     = record.status === 'cancelled'
  const international = b.residency === 'international'
  const currency      = b.currency || (international ? 'USD' : 'KES')
  const stayNights    = Number(b.nights) || 0
  const total         = Number(b.amount) || 0
  const perNight      = stayNights > 0 ? total / stayNights : total

  // When the hotel cancels a booking that was already paid for, the stored status
  // is only 'cancelled' and no longer says money changed hands, so the amount is
  // read from the snapshot taken at cancellation. A booking cancelled before that
  // snapshot existed falls back to its M-Pesa code, which only exists once
  // Safaricom confirmed the payment.
  const refundDue = cancelled ? Number(record.paidAmount) || (b.mpesaRef ? total : 0) : 0

  // What the guest has to know about money, stated in words first. The dot that
  // carries this onto the page only reinforces the label, so the wording has to
  // stand alone — printed greyscale, faxed, or read by someone who can't tell
  // green from gold. A cancelled booking is its own state: it must never tell
  // anyone to pay at the hotel, and if it was paid for it has to say so.
  const state = paid
    ? { label: 'PAID IN FULL', dot: GREEN, boxLabel: 'AMOUNT PAID', boxNote: 'Received with thanks', boxAmount: total }
    : cancelled && refundDue > 0
      ? { label: 'CANCELLED — REFUND DUE', dot: GOLD, boxLabel: 'AMOUNT PAID', boxNote: 'Refund due', boxAmount: refundDue }
      : cancelled
        ? { label: 'CANCELLED', dot: GREY, boxLabel: 'BOOKING TOTAL', boxNote: 'No payment due', boxAmount: total }
        : {
            label: international ? 'PAYABLE AT THE HOTEL (USD)' : 'PAYABLE AT THE HOTEL',
            dot: GOLD,
            boxLabel: 'AMOUNT DUE AT CHECK-IN',
            boxNote: international ? 'Pay in cash or by card on arrival' : 'M-Pesa or card at the hotel',
            boxAmount: total,
          }

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 56
  let y = 66

  // Small caps label — the letter-spacing makes it read as a label, not a sentence.
  const label = (text, x, top, size = 8) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...GREY)
    doc.text(text, x, top, { charSpace: 1.1 })
  }

  // ── Header ──
  doc.setFillColor(...GOLD); doc.rect(0, 0, pageWidth, 4, 'F')

  doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(...INK)
  doc.text('Hotel Itoya', margin, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY)
  doc.text([hotel.addressLine, hotel.town].filter(Boolean).join(', '), margin, y + 16)
  doc.text(hotel.phones.join('  ·  '), margin, y + 29)
  doc.text(hotel.email, margin, y + 42)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...INK)
  doc.text(paid || refundDue > 0 ? 'PAYMENT RECEIPT' : 'RESERVATION RECEIPT', pageWidth - margin, y - 6, { align: 'right', charSpace: 1 })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GREY)
  doc.text(issuedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin, y + 8, { align: 'right' })
  doc.text(
    `Issued ${issuedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin, y + 21, { align: 'right' },
  )

  y += 58
  doc.setDrawColor(...GOLD); doc.setLineWidth(1.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 28

  // ── Reference + status ──
  label('BOOKING REFERENCE', margin, y)
  doc.setFont('times', 'bold'); doc.setFontSize(18); doc.setTextColor(...INK)
  doc.text(b.ref, margin, y + 21)

  // The state shares a baseline with the reference: label right-aligned to the
  // margin, a 4.4 pt dot in front of it. No filled block — the page is cream,
  // gold and ink, and a solid green or blue slab was the only thing shouting.
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  const statusTrack = 1
  const statusWidth = doc.getTextWidth(state.label) + statusTrack * Math.max(0, state.label.length - 1)
  const statusX = pageWidth - margin - statusWidth
  doc.setFillColor(...state.dot)
  doc.circle(statusX - 7.5, y + 18.2, 2.2, 'F')
  doc.setTextColor(...INK)
  doc.text(state.label, statusX, y + 21, { charSpace: statusTrack })

  y += 46
  doc.setDrawColor(...RULE); doc.setLineWidth(0.75)
  doc.line(margin, y, pageWidth - margin, y)
  y += 26

  // ── Guest (left) and stay (right) ──
  label('GUEST', margin, y)
  label('STAY', margin + 290, y)
  y += 20

  const wrap = (text, x, top, width, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(9.5)
    doc.setTextColor(...(bold ? INK : BODY))
    const lines = doc.splitTextToSize(String(text ?? '—'), width)
    doc.text(lines, x, top)
    return lines.length * 14
  }

  const left = [
    ['Guest', b.name],
    ['Phone', b.phone],
    ['Email', b.email],
  ]
  const right = [
    ['Room', b.roomLabel || b.room],
    ['Meal plan', planLabel(b.plan || 'bb')],
    ['Rate', international ? 'International visitor (USD)' : 'Kenyan resident (KES)'],
    ['Check-in', longDate(b.checkIn)],
    ['Check-out', longDate(b.checkOut)],
    ['Duration', nightsLabel(stayNights)],
    ['Guests', String(b.guests ?? '—')],
    ...(b.mpesaRef ? [['M-Pesa code', b.mpesaRef]] : []),
    ...(record.status === 'cancelled' ? [['Status', 'Cancelled']] : []),
  ]

  let ly = y
  left.forEach(([key, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GREY)
    doc.text(key, margin, ly)
    ly += wrap(value, margin + 58, ly, 200, true)
  })

  let ry = y
  right.forEach(([key, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GREY)
    doc.text(key, margin + 290, ry)
    ry += wrap(value, margin + 290 + 64, ry, 129, true)
  })

  y = Math.max(ly, ry) + 16
  doc.setDrawColor(...RULE)
  doc.line(margin, y, pageWidth - margin, y)
  y += 22

  // ── Price breakdown ──
  // Line by line, so the guest can check the arithmetic: rate × nights = total.
  const breakdown = [
    ['Rate per night', money(perNight, currency)],
    [nightsLabel(stayNights), ''],
    [paid || refundDue > 0 ? 'Total paid' : cancelled ? 'Total' : 'Total due', money(total, currency)],
  ]
  const colX = pageWidth - margin - 190
  breakdown.forEach(([key, value], index) => {
    const last = index === breakdown.length - 1
    if (last) {
      doc.setDrawColor(...RULE); doc.setLineWidth(0.75)
      doc.line(colX, y - 10, pageWidth - margin, y - 10)
    }
    doc.setFont('helvetica', last ? 'bold' : 'normal'); doc.setFontSize(last ? 10 : 9.5)
    doc.setTextColor(...(last ? INK : BODY))
    doc.text(key, colX, y + (last ? 4 : 0))
    if (value) doc.text(value, pageWidth - margin, y + (last ? 4 : 0), { align: 'right' })
    y += last ? 0 : 18
  })

  // ── Amount box ──
  // The one number the guest actually needs gets its own block rather than being
  // buried in the table above.
  const boxHeight = 62
  const boxY = y + 16
  doc.setFillColor(...CREAM); doc.rect(margin, boxY, pageWidth - margin * 2, boxHeight, 'F')
  doc.setFillColor(...GOLD);  doc.rect(margin, boxY, 3, boxHeight, 'F')

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GREY)
  doc.text(state.boxLabel, margin + 20, boxY + 22, { charSpace: 1.1 })
  doc.setFont('times', 'bold'); doc.setFontSize(24); doc.setTextColor(...INK)
  doc.text(money(state.boxAmount, currency), margin + 20, boxY + 48)

  // Instructions for settling, in body ink rather than a signal colour: the
  // label above already says whether money is owed, so this line only explains
  // how — and on a cancelled or paid receipt it drops out of the way entirely.
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.setTextColor(...BODY)
  doc.text(state.boxNote, pageWidth - margin - 20, boxY + 34, { align: 'right' })

  y = boxY + boxHeight + 26

  // ── Notes ──
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY)
  // One sentence per state, and the refund case names the money back: a guest who
  // was charged and then cancelled on should not have to infer it from a code.
  let note
  if (paid) {
    note = 'This receipt confirms payment was received for this booking. Please present it, with your ID or passport, at check-in.'
  } else if (refundDue > 0) {
    note = `This booking was cancelled after ${money(refundDue, currency)} was paid for it. Our team will contact you about the refund — nothing further is due from you.`
  } else if (cancelled) {
    note = 'This booking was cancelled, so there is nothing to settle at the hotel. Keep this receipt for your records.'
  } else {
    note = 'This is a reservation receipt, not proof of payment. Please settle the amount above at the hotel on arrival.'
  }
  doc.text(doc.splitTextToSize(note, pageWidth - margin * 2), margin, y)

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 56
  doc.setDrawColor(...GOLD); doc.setLineWidth(1)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GREY)
  doc.text([hotel.addressLine, hotel.town].filter(Boolean).join(', '), margin, footerY + 16)
  doc.text(hotel.phones.join('  ·  '), margin, footerY + 27)
  doc.text(`${hotel.email}  ·  ${b.ref}`, pageWidth - margin, footerY + 16, { align: 'right' })
  doc.text('Computer-generated receipt — no signature required.', pageWidth - margin, footerY + 27, { align: 'right' })

  return Buffer.from(doc.output('arraybuffer'))
}

module.exports = { buildReceiptPdf, receiptFilename, money, longDate, nightsLabel }
