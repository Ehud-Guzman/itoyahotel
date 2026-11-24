// The calendar invite that rides along with the guest's confirmation email: one
// tap adds the stay to Google Calendar, Outlook, Apple Calendar or a phone.
//
// Details that matter to calendar apps:
//   - CRLF line endings and lines folded at 75 octets (RFC 5545 §3.1). A lone
//     "\n" or an over-long line makes Outlook drop the whole event.
//   - Times carry TZID=Africa/Nairobi with a VTIMEZONE block, so the event shows
//     at Kenyan wall-clock time no matter where the guest opens it. Floating
//     times (no zone) would silently shift for anyone abroad.
//   - Text values escape backslash, semicolon, comma and newlines, so a guest
//     name like "Doe, Jane" cannot break the file.
const TZID = 'Africa/Nairobi'

// "2:00 PM" / "2pm" / "14:00" -> "1400". Falls back when the Studio's hours are
// blank or unusual, so an invite is always produced.
function parseClock(label, fallback) {
  const text = String(label || '')
  const withMinutes = /(\d{1,2})[:.](\d{2})\s*(am|pm)?/i.exec(text)
  const hourOnly = /(\d{1,2})\s*(am|pm)/i.exec(text)
  let hour
  let minute = 0
  let meridiem = ''
  if (withMinutes) {
    hour = Number(withMinutes[1]); minute = Number(withMinutes[2]); meridiem = (withMinutes[3] || '').toLowerCase()
  } else if (hourOnly) {
    hour = Number(hourOnly[1]); meridiem = (hourOnly[2] || '').toLowerCase()
  } else {
    return fallback
  }
  if (meridiem === 'pm' && hour < 12) hour += 12
  if (meridiem === 'am' && hour === 12) hour = 0
  if (!(hour >= 0 && hour <= 23) || !(minute >= 0 && minute <= 59)) return fallback
  return `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`
}

const DEFAULT_CHECK_IN  = '1400'   // 2:00 PM
const DEFAULT_CHECK_OUT = '1000'   // 10:00 AM

/** RFC 5545 TEXT escaping — the difference between a valid file and a broken one. */
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

// Folds at 75 octets, splitting on character boundaries so multi-byte characters
// (a name with "é", an em dash in the room name) are never cut in half.
function fold(line) {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line
  const parts = []
  let current = ''
  let bytes = 0
  let limit = 75
  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8')
    if (bytes + size > limit) {
      parts.push(current)
      current = ` ${char}`            // continuation lines start with one space
      bytes = 1 + size
      limit = 75
    } else {
      current += char
      bytes += size
    }
  }
  parts.push(current)
  return parts.join('\r\n')
}

function stampUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function localStamp(isoDate, hhmm) {
  const day = String(isoDate || '').slice(0, 10).replace(/-/g, '')
  if (!/^\d{8}$/.test(day)) return null
  return `${day}T${hhmm}00`
}

function inviteFilename(ref) {
  return `Hotel-Itoya-${String(ref || 'stay').replace(/[^\w-]/g, '')}.ics`
}

/**
 * @param {object} record   A booking record as returned by store.getByRef()
 * @param {object} [options]
 * @param {object} [options.settings]  Site Settings: addressLine, town, email, phones, check-in/out times
 * @param {Date}   [options.now]       Defaults to now; tests pass a fixed date
 * @returns {{ filename: string, content: string }}
 */
function buildInvite(record, { settings = {}, now = new Date() } = {}) {
  const b = record?.b
  if (!b?.ref) throw new Error('buildInvite needs a booking record with a reference.')

  const checkIn  = localStamp(b.checkIn,  parseClock(settings.checkInTime,  DEFAULT_CHECK_IN))
  const checkOut = localStamp(b.checkOut, parseClock(settings.checkOutTime, DEFAULT_CHECK_OUT))
  if (!checkIn || !checkOut) throw new Error('buildInvite needs valid check-in and check-out dates.')

  const paid      = record.status === 'success'
  const nights    = Number(b.nights) || 0
  const place     = [settings.addressLine, settings.town].filter(Boolean).join(', ') || 'Busia, Kenya'
  const organiser = settings.email || 'hotel.itoya@ayotigroup.com'

  const description = [
    `Booking reference: ${b.ref}`,
    `Room: ${b.roomLabel || b.room}`,
    `Guests: ${b.guests ?? '—'}`,
    `Check-in: from ${settings.checkInTime || '2:00 PM'}`,
    `Check-out: by ${settings.checkOutTime || '10:00 AM'}`,
    paid ? 'Paid in full.' : 'Payable at the hotel on arrival.',
    `Questions? ${settings.phones?.[0] || organiser}`,
  ].join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hotel Itoya//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    `TZID:${TZID}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:EAT',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${escapeText(b.ref)}@hotelitoya.co.ke`,
    `DTSTAMP:${stampUtc(now)}`,
    `DTSTART;TZID=${TZID}:${checkIn}`,
    `DTEND;TZID=${TZID}:${checkOut}`,
    `SUMMARY:${escapeText(`Hotel Itoya — ${b.roomLabel || b.room}, ${nights} night${nights === 1 ? '' : 's'}`)}`,
    `LOCATION:${escapeText(place)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `STATUS:${paid ? 'CONFIRMED' : 'TENTATIVE'}`,
    `ORGANIZER;CN=${escapeText('Hotel Itoya')}:mailto:${organiser}`,
    `ATTENDEE;CN=${escapeText(b.name || 'Guest')};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${b.email}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText('Check-in at Hotel Itoya is tomorrow')}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return {
    filename: inviteFilename(b.ref),
    // Trailing CRLF: several clients reject a file that does not end with one.
    content: lines.map(fold).join('\r\n') + '\r\n',
  }
}

module.exports = { buildInvite, inviteFilename, parseClock, escapeText, TZID }
