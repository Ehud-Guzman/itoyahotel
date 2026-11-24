// Downloads the guest's booking receipt.
//
// The PDF is rendered by the booking server, not in the browser: it is the very
// file attached to the guest's confirmation email, so the copy downloaded here
// and the copy in their inbox can never disagree. It also means the receipt is
// built from what was stored and charged rather than from page state.
//
// The booking reference alone is not enough to fetch a receipt from this form —
// the phone number on the booking is required too, since the PDF shows the
// guest's name, phone and email address. The link in the guest's confirmation
// email is the other way in: it carries a signed, expiring token instead, so a
// guest who still has that email never types anything.
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function downloadReceipt({ ref, phone }) {
  const res = await fetch(`${API}/api/booking/receipt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ref, phone }),
  })

  if (!res.ok) {
    // The server explains what went wrong (wrong number, unknown reference);
    // fall back to something the guest can act on if the body isn't readable.
    let message = 'Could not prepare your receipt. A copy is attached to your confirmation email.'
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch { /* not JSON — keep the default */ }
    throw new Error(message)
  }

  const filename = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') || '')?.[1]
    || `Hotel-Itoya-${ref}.pdf`
  const url = URL.createObjectURL(await res.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke a little later: revoking immediately cancels the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
