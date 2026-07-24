import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import PrivacyPolicy from './legal/PrivacyPolicy.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const isAdmin   = /^\/admin(\/|$)/.test(window.location.pathname)
const isPrivacy = /^\/privacy(\/|$)/.test(window.location.pathname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isAdmin ? <AdminApp /> : isPrivacy ? <PrivacyPolicy /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
