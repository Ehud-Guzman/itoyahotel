import { StrictMode, lazy, Suspense } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import './season.css'
import App from './App.jsx'
import PrivacyPolicy from './legal/PrivacyPolicy.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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

const tree = (
  <StrictMode>
    <ErrorBoundary>
      {isAdmin
        ? <Suspense fallback={null}><AdminApp /></Suspense>
        : isPrivacy ? <PrivacyPolicy /> : <App />}
    </ErrorBoundary>
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
