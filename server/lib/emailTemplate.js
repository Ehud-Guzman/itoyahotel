// One layout for every Hotel Itoya email, so the guest's confirmation, the
// hotel's alert and the contact-form replies all look like the same hotel.
//
// Two things are deliberate:
//   - Tables and inline styles only. Mail clients strip <style> blocks, and
//     Outlook ignores most modern CSS, so a flexbox/grid "template" arrives as
//     an unstyled wall of text. A 600px table with padding renders the same in
//     Gmail, Outlook, Apple Mail and a phone.
//   - Every email also gets a plain-text part built from the same data. That is
//     what watch previews and screen readers use, and a message with no text
//     alternative scores worse with spam filters.
//
// Values passed in are plain text and are escaped here; nothing a guest typed
// can arrive as live HTML.

const GOLD  = '#a4733c'
const INK   = '#1a1612'
const BODY  = '#57514a'
const MUTED = '#8a8178'
const RULE  = '#f0ece5'
const CREAM = '#faf7f2'
const FONT  = 'Helvetica,Arial,sans-serif'
const SERIF = "Georgia,'Times New Roman',serif"

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

/**
 * Builds the HTML and plain-text body of one email.
 *
 * @param {object}   email
 * @param {string}   email.heading        Big headline, e.g. "Booking Received"
 * @param {string}   [email.preheader]    Hidden line inboxes show after the subject
 * @param {string}   [email.intro]        Opening paragraph
 * @param {string}   [email.reference]    Reference shown in its own block
 * @param {string}   [email.referenceLabel='Booking reference']
 * @param {Array}    [email.rows]         [{ label, value }] label/value pairs
 * @param {object}   [email.total]        { label, value, note } highlighted amount
 * @param {object}   [email.cta]          { label, url } single button, http(s) only
 * @param {string}   [email.note]         Closing paragraph before the footer
 * @param {string}   [email.footerNote]   Small print above the contact details
 * @param {object}   email.settings       Site Settings: phones, email, addressLine, town
 * @returns {{ html: string, text: string }}
 */
function renderEmail({
  heading,
  preheader = '',
  intro = '',
  reference,
  referenceLabel = 'Booking reference',
  rows = [],
  total = null,
  cta = null,
  note = '',
  footerNote = '',
  settings = {},
}) {
  const phones  = (Array.isArray(settings.phones) ? settings.phones : []).filter(Boolean)
  const email   = settings.email || ''
  const address = [settings.addressLine, settings.town].filter(Boolean).join(', ')

  const refBlock = reference
    ? `<tr><td style="padding:22px 32px 0;">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border:1px solid #ece5da;">
           <tr><td style="padding:14px 18px 4px;font:11px ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${esc(referenceLabel)}</td></tr>
           <tr><td style="padding:0 18px 14px;font:18px ${SERIF};letter-spacing:1px;color:${INK};">${esc(reference)}</td></tr>
         </table>
       </td></tr>`
    : ''

  const rowsBlock = rows.length
    ? `<tr><td style="padding:24px 32px 0;">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
           ${rows.map(({ label, value }) => `
             <tr>
               <td style="padding:10px 0;border-bottom:1px solid ${RULE};width:44%;vertical-align:top;font:13px ${FONT};color:${MUTED};">${esc(label)}</td>
               <td style="padding:10px 0;border-bottom:1px solid ${RULE};vertical-align:top;font:600 13px ${FONT};color:${INK};">${esc(value).replace(/\n/g, '<br>')}</td>
             </tr>`).join('')}
         </table>
       </td></tr>`
    : ''

  const totalBlock = total
    ? `<tr><td style="padding:24px 32px 0;">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border-left:3px solid ${GOLD};">
           <tr><td style="padding:16px 18px;">
             <div style="font:11px ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${esc(total.label)}</div>
             <div style="font:22px ${SERIF};color:${INK};padding-top:6px;">${esc(total.value)}</div>
             ${total.note ? `<div style="font:12px ${FONT};color:${BODY};padding-top:6px;line-height:1.5;">${esc(total.note)}</div>` : ''}
           </td></tr>
         </table>
       </td></tr>`
    : ''

  // A single button, and only for http(s) links: callers pass signed receipt
  // URLs, but nothing here should be able to emit a javascript: href if a
  // future caller ever hands it something user-supplied.
  const safeCta = cta && /^https?:\/\//i.test(String(cta.url || '')) ? cta : null

  const ctaBlock = safeCta
    ? `<tr><td style="padding:26px 32px 0;">
         <a href="${esc(safeCta.url)}" style="display:inline-block;background:${GOLD};color:#ffffff;text-decoration:none;font:600 13px ${FONT};letter-spacing:0.6px;padding:14px 24px;">${esc(safeCta.label || 'Open link')}</a>
       </td></tr>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e8e2d8;">

      <tr><td style="padding:28px 32px 20px;border-bottom:3px solid ${GOLD};">
        <div style="font:22px ${SERIF};color:${INK};letter-spacing:0.5px;">Hotel Itoya</div>
        <div style="font:11px ${FONT};letter-spacing:2px;text-transform:uppercase;color:${MUTED};padding-top:6px;">${esc(settings.town || 'Busia, Kenya')}</div>
      </td></tr>

      <tr><td style="padding:28px 32px 0;">
        <h1 style="margin:0;font:normal 21px ${SERIF};color:${INK};line-height:1.35;">${esc(heading)}</h1>
        ${intro ? `<p style="margin:14px 0 0;font:14px/1.65 ${FONT};color:${BODY};">${esc(intro)}</p>` : ''}
      </td></tr>

      ${refBlock}
      ${rowsBlock}
      ${totalBlock}
      ${ctaBlock}

      ${note ? `<tr><td style="padding:24px 32px 0;font:14px/1.65 ${FONT};color:${BODY};">${esc(note)}</td></tr>` : ''}

      <tr><td style="padding:26px 32px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ece5da;">
          <tr><td style="padding-top:18px;font:12px/1.7 ${FONT};color:${MUTED};">
            ${footerNote ? `<div style="padding-bottom:10px;color:${BODY};">${esc(footerNote)}</div>` : ''}
            ${address ? `<div>${esc(address)}</div>` : ''}
            ${phones.length ? `<div>${esc(phones.join('  ·  '))}</div>` : ''}
            ${email ? `<div><a href="mailto:${esc(email)}" style="color:${GOLD};text-decoration:none;">${esc(email)}</a></div>` : ''}
          </td></tr>
        </table>
      </td></tr>

    </table>
    <div style="font:11px/1.6 ${FONT};color:#a09a92;padding:14px 10px 0;max-width:600px;">
      You are receiving this email because you contacted Hotel Itoya. If it was not you, please ignore it.
    </div>
  </td></tr>
</table>
</body>
</html>`

  // Same content, no markup: watch previews, screen readers, spam filters.
  const text = [
    'HOTEL ITOYA',
    (settings.town || 'Busia, Kenya').toUpperCase(),
    '',
    heading.toUpperCase(),
    '',
    intro || null,
    intro ? '' : null,
    reference ? `${referenceLabel}: ${reference}` : null,
    reference ? '' : null,
    ...rows.map(({ label, value }) => `${label}: ${value}`),
    rows.length ? '' : null,
    total ? `${total.label}: ${total.value}` : null,
    total?.note || null,
    total ? '' : null,
    safeCta ? `${safeCta.label || 'Open link'}: ${safeCta.url}` : null,
    safeCta ? '' : null,
    note || null,
    note ? '' : null,
    '---',
    footerNote || null,
    address || null,
    phones.length ? phones.join('  ·  ') : null,
    email || null,
  ].filter((line) => line !== null).join('\n')

  return { html, text }
}

module.exports = { renderEmail }
