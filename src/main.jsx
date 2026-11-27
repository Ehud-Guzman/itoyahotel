import { StrictMode, lazy, Suspense } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import './season.css'
import App from './App.jsx'
import PrivacyPolicy from './legal/PrivacyPolicy.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { HotelProvider } from './lib/hotel.jsx'
import { syncHolidays } from './lib/holidays'

// Staff-only dashboard: kept out of the public bundle so guests don't download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

const isAdmin   = /^\/admin(\/|$)/.test(window.location.pathname)
const isPrivacy = /^\/privacy(\/|$)/.test(window.location.pathname)

// /admin is handed the public app shell, whose <head> advertises robots
// index,follow and canonical = the homepage. netlify.toml already sends
// X-Robots-Tag: noindex for the path; this keeps the rendered document in
// agreement with it so the staff app can never be crawled as a homepage
// duplicate ("Alternate page with proper canonical tag").
if (isAdmin) {
  // The staff app stays plain: no festive decoration (the boot script sets these site-wide).
  ;['data-season', 'data-season-name', 'data-season-phase', 'data-season-year']
    .forEach((attr) => document.documentElement.removeAttribute(attr))
  document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow')
  document.querySelector('link[rel="canonical"]')?.remove()
}

// Holidays the hotel added in the Studio (see src/lib/holidays.js). Public site
// only, and never waited on: the boot script has already applied this season,
// this only corrects it if the hotel has changed something since the last visit.
if (!isAdmin) syncHolidays()

// Copy deterrents for the public site (styles in index.css). Staff /admin is
// left alone so uploads and previews behave normally.
if (!isAdmin) {
  document.documentElement.classList.add('protect-images')
  const isProtected = (el) => el instanceof Element && !!el.closest('img, .protect')
  const isCopyable  = (el) => el instanceof Element &&
    !!el.closest('.allow-copy, address, a[href^="tel:"], a[href^="mailto:"], input, textarea, select, [contenteditable="true"]')

  document.addEventListener('contextmenu', (e) => {
    if (isProtected(e.target) && !isCopyable(e.target)) e.preventDefault()
  })
  document.addEventListener('dragstart', (e) => {
    if (e.target instanceof HTMLImageElement) e.preventDefault()
  })
  document.addEventListener('copy', (e) => {
    const node = window.getSelection()?.anchorNode
    const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node
    if (isProtected(el) && !isCopyable(el)) e.preventDefault()
  })
}

const tree = (
  <StrictMode>
    {/* Staff /admin has no use for the public site's settings, so it skips the provider. */}
    {isAdmin ? (
      <ErrorBoundary>
        <Suspense fallback={null}><AdminApp /></Suspense>
      </ErrorBoundary>
    ) : (
      <HotelProvider>
        <ErrorBoundary>{isPrivacy ? <PrivacyPolicy /> : <App />}</ErrorBoundary>
      </HotelProvider>
    )}
  </StrictMode>
)

const container = document.getElementById('root')

// /privacy ships with its markup already in the HTML (scripts/prerender-privacy.mjs),
// so hydrate it instead of rebuilding it. Anywhere there is nothing to hydrate
// (the dev server, the homepage, /admin) mount normally.
if (isPrivacy && container.hasChildNodes()) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
