import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error in app:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-6 text-center">
        <img src="/logos/hotel-itoya-logo.webp" alt="Hotel Itoya" className="h-16 w-auto object-contain mb-8" />
        <h1 className="font-serif text-2xl text-ink mb-3">Something went wrong</h1>
        <p className="font-sans text-ink/60 text-sm max-w-sm mb-8 leading-relaxed">
          We're sorry — this page hit an unexpected error. Please try reloading,
          or reach us directly and we'll help right away.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-dark text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-4 transition-colors duration-200"
          >
            Reload Page
          </button>
          <a
            href="https://wa.me/254714302777"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center border border-primary text-primary hover:bg-primary hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-4 transition-colors duration-200"
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    )
  }
}
