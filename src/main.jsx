import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isAdmin ? <AdminApp /> : isPrivacy ? <PrivacyPolicy /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
