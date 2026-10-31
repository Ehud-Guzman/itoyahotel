// Bakes the privacy policy's HTML into dist/privacy/index.html after `vite build`.
//
// The page is otherwise an empty <div id="root"> that React fills in, so
// crawlers (and anyone with JavaScript off or slow) saw a blank document. The
// markup is rendered from the real <PrivacyPolicy /> component, so the static
// and interactive versions can never drift apart, and main.jsx hydrates it
// instead of rebuilding it.
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, 'dist', 'privacy', 'index.html')

if (!fs.existsSync(target)) {
  console.error(`prerender-privacy: ${target} not found. Run "vite build" first.`)
  process.exit(1)
}

const server = await createServer({
  root,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true },
})

try {
  const { default: PrivacyPolicy } = await server.ssrLoadModule('/src/legal/PrivacyPolicy.jsx')
  const markup = renderToString(createElement(PrivacyPolicy))

  const html = fs.readFileSync(target, 'utf8')
  const empty = '<div id="root"></div>'
  if (!html.includes(empty)) {
    console.error('prerender-privacy: could not find an empty <div id="root"></div> in dist/privacy/index.html')
    process.exit(1)
  }
  if (!markup.includes('Privacy Policy')) {
    console.error('prerender-privacy: rendered markup does not look like the privacy policy')
    process.exit(1)
  }

  fs.writeFileSync(target, html.replace(empty, `<div id="root">${markup}</div>`))
  console.log(`prerender-privacy: wrote ${(markup.length / 1024).toFixed(1)} kB of static markup into dist/privacy/index.html`)
} finally {
  await server.close()
}
