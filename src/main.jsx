import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import PrivacyPolicy from './legal/PrivacyPolicy.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const isAdmin   = /^\/admin(\/|$)/.test(window.location.pathname)
const isPrivacy = /^\/privacy(\/|$)/.test(window.location.pathname)

// /admin is handed the public app shell, whose <head> advertises robots
// index,follow and canonical = the homepage. netlify.toml already sends
// X-Robots-Tag: noindex for the path; this keeps the rendered document in
// agreement with it so the staff app can never be crawled as a homepage
// duplicate ("Alternate page with proper canonical tag").
if (isAdmin) {
  document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow')
  document.querySelector('link[rel="canonical"]')?.remove()
}

const rootEl = document.getElementById('root')

const tree = (
  <StrictMode>
    <ErrorBoundary>
      {isAdmin ? <AdminApp /> : isPrivacy ? <PrivacyPolicy /> : <App />}
    </ErrorBoundary>
  </StrictMode>
)

// The homepage is prerendered at build time (scripts/prerender.mjs), so #root
// already holds its HTML: hydrate it. /admin and /privacy are never prerendered
// and start empty, so they mount normally.
if (!isAdmin && !isPrivacy && rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree)
} else {
  createRoot(rootEl).render(tree)
}
