// Bakes the rendered homepage into dist/index.html. Runs after:
//
//   vite build
//   vite build --ssr src/entry-server.jsx --outDir dist-ssr
//
// 1. Keeps the untouched app shell as dist/app-shell.html. /admin is served
//    that file (see public/_redirects) so the staff app never flashes the
//    public homepage while it loads.
// 2. Renders the homepage with the SSR bundle and injects it into
//    <div id="root"></div> in dist/index.html.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '../dist')
const SSR_ENTRY = join(__dirname, '../dist-ssr/entry-server.js')
const ROOT_TAG = '<div id="root"></div>'

if (!existsSync(SSR_ENTRY)) {
  throw new Error(`Missing ${SSR_ENTRY}. Run the SSR build first (see "build" in package.json).`)
}

const shell = readFileSync(join(DIST, 'index.html'), 'utf-8')
if (!shell.includes(ROOT_TAG)) {
  throw new Error(`dist/index.html does not contain ${ROOT_TAG}; cannot inject the prerendered page.`)
}

const { render } = await import(pathToFileURL(SSR_ENTRY).href)
const appHtml = await render()

if (!appHtml || appHtml.length < 2000) {
  throw new Error(`Prerendered homepage looks empty (${appHtml?.length ?? 0} bytes); refusing to ship it.`)
}

writeFileSync(join(DIST, 'app-shell.html'), shell)
writeFileSync(join(DIST, 'index.html'), shell.replace(ROOT_TAG, () => `<div id="root">${appHtml}</div>`))

console.log(`Prerendered homepage: ${(appHtml.length / 1024).toFixed(0)} KB of HTML baked into dist/index.html`)
