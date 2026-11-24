// "Export bookings": the admin page's own copy of every booking, as a spreadsheet
// (CSV opens in Excel and Google Sheets). Deliberately leaves out the ID images.
const COLUMNS = [
  ['ref', 'Reference'], ['createdAt', 'Booked at'], ['status', 'Status'], ['name', 'Name'],
  ['phone', 'Phone'], ['email', 'Email'], ['roomLabel', 'Room'], ['plan', 'Meal plan'],
  ['residency', 'Residency'], ['checkIn', 'Check-in'], ['checkOut', 'Check-out'],
  ['nights', 'Nights'], ['guests', 'Guests'], ['currency', 'Currency'], ['amount', 'Amount'],
  ['mpesaPhone', 'M-Pesa phone'], ['mpesaRef', 'M-Pesa ref'], ['requests', 'Special requests'],
  ['emailHotel', 'Hotel email'], ['emailGuest', 'Guest email'],
  ['cancelledAt', 'Cancelled at'], ['cancelReason', 'Cancellation reason'],
]

function cell(value) {
  let text = value == null ? '' : String(value)
  // a guest-typed "=HYPERLINK(...)" must not run as a formula when the file is opened
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function bookingsToCsv(bookings) {
  const rows = [COLUMNS.map(([, label]) => label), ...bookings.map((b) => COLUMNS.map(([key]) => b[key]))]
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') // BOM: Excel reads UTF-8 names correctly
}

export function downloadBookings(bookings) {
  const url = URL.createObjectURL(new Blob([bookingsToCsv(bookings)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `itoya-bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
