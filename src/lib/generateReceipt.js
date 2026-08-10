// Builds and downloads a one-page PDF booking receipt. jsPDF is loaded on
// demand (not in the main bundle) since most visitors never reach this step.
function kes(n) {
  return `KES ${Number(n).toLocaleString('en-KE')}`
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export async function downloadReceipt({
  ref, roomLabel, checkIn, checkOut, nights, guests,
  name, phone, email, total, paid,
}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 56
  let y = 72

  const gold = [199, 165, 107]
  const ink  = [26, 22, 18]
  const grey = [120, 112, 102]

  // ── Header ──
  doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(...ink)
  doc.text('Hotel Itoya', margin, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grey)
  doc.text('B1 Kisumu-Busia Road, Busia, Kenya', margin, y + 16)
  doc.text('+254 714 302 777  ·  +254 714 666 222  ·  +254 714 777 333', margin, y + 23)
  doc.text('hotel.itoya@ayotigroup.com', margin, y + 35)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...ink)
  doc.text(paid ? 'PAYMENT RECEIPT' : 'RESERVATION RECEIPT', pageWidth - margin, y - 4, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grey)
  doc.text(new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin, y + 12, { align: 'right' })

  y += 50
  doc.setDrawColor(...gold); doc.setLineWidth(1.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 34

  // ── Reference ──
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...grey)
  doc.text('BOOKING REFERENCE', margin, y)
  doc.setFont('times', 'bold'); doc.setFontSize(18); doc.setTextColor(...ink)
  doc.text(ref, margin, y + 22)
  y += 50

  // ── Detail rows ──
  const rows = [
    ['Guest', name],
    ['Phone', phone],
    ['Email', email],
    ['Room', roomLabel],
    ['Check-in', fmtDate(checkIn)],
    ['Check-out', fmtDate(checkOut)],
    ['Duration', `${nights} night${nights !== 1 ? 's' : ''}`],
    ['Guests', String(guests)],
  ]

  doc.setFontSize(10)
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...grey)
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink)
    doc.text(String(value ?? '—'), margin + 130, y)
    y += 22
  })

  y += 14
  doc.setDrawColor(230, 226, 218); doc.setLineWidth(0.75)
  doc.line(margin, y, pageWidth - margin, y)
  y += 32

  // ── Amount ──
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...grey)
  doc.text(paid ? 'AMOUNT PAID' : 'AMOUNT DUE AT CHECK-IN', margin, y)
  doc.setFont('times', 'bold'); doc.setFontSize(26); doc.setTextColor(...ink)
  doc.text(kes(total), margin, y + 28)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.setTextColor(...(paid ? [30, 132, 73] : [37, 99, 143]))
  doc.text(paid ? 'PAID VIA M-PESA' : 'PAY AT HOTEL (CASH OR M-PESA)', pageWidth - margin, y + 20, { align: 'right' })

  y += 70
  doc.setDrawColor(...gold); doc.setLineWidth(1.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 24

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...grey)
  const note = paid
    ? 'This receipt confirms payment was received for this booking. Present it, along with your ID, at check-in.'
    : 'This receipt confirms your reservation request. It is not proof of payment — please pay the amount above at check-in.'
  doc.text(doc.splitTextToSize(note, pageWidth - margin * 2), margin, y)

  doc.save(`Hotel-Itoya-${ref}.pdf`)
}
