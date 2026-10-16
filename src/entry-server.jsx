// Server-render entry used only at build time by scripts/prerender.mjs.
//
// It renders the public homepage (the same tree main.jsx mounts) to an HTML
// string so dist/index.html ships with the real headings, copy and links
// instead of an empty <div id="root"></div>. Crawlers that never run
// JavaScript (WhatsApp/Facebook previews, most AI tools) and Google's
// first-pass indexing can then read the page; the browser hydrates it as usual.
//
// renderToPipeableStream (not renderToString) so the React.lazy() sections
// (gallery, testimonials, chat) resolve and are included in the output.
import { Writable } from 'node:stream'
import { StrictMode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export function render() {
  return new Promise((resolve, reject) => {
    let html = ''

    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString()
        callback()
      },
    })

    const { pipe, abort } = renderToPipeableStream(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
      {
        onAllReady() {
          pipe(sink)
        },
        onShellError(error) {
          reject(error)
        },
        onError(error) {
          console.error('[prerender] render error:', error)
        },
      },
    )

    const timer = setTimeout(() => abort(), 15000)

    sink.on('finish', () => {
      clearTimeout(timer)
      resolve(html)
    })
    sink.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}
