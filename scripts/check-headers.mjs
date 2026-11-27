// Runs before `vite build`, like check-redirects.mjs.
//
// The site is served by Netlify today, but the header rules (CSP, X-Frame-Options,
// the short cache life on season-boot.js) are the kind of thing that vanishes
// silently on a move to Cloudflare Pages, which reads `_headers` instead of
// netlify.toml. `public/_headers` is generated from netlify.toml so both
// platforms serve identical headers.
//
//   node scripts/check-headers.mjs           verify, exit 1 on drift
//   node scripts/check-headers.mjs --write   regenerate public/_headers
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareHeaders, parseHeadersFile, parseNetlifyHeaders, renderHeadersFile } from './lib/headers-check.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tomlFile = path.join(root, 'netlify.toml')
const headersFile = path.join(root, 'public', '_headers')

const expected = parseNetlifyHeaders(fs.readFileSync(tomlFile, 'utf8'))

if (process.argv.includes('--write')) {
  fs.writeFileSync(headersFile, renderHeadersFile(expected))
  console.log(`check-headers: wrote public/_headers (${expected.length} paths) from netlify.toml`)
  process.exit(0)
}

if (!fs.existsSync(headersFile)) {
  console.error('\npublic/_headers is missing. Run: npm run headers:sync\n')
  process.exit(1)
}

const problems = compareHeaders(expected, parseHeadersFile(fs.readFileSync(headersFile, 'utf8')))

if (problems.length) {
  console.error('\npublic/_headers and netlify.toml disagree — one platform would serve different headers:\n')
  problems.forEach((p) => console.error('  - ' + p))
  console.error('\nRun: npm run headers:sync\n')
  process.exit(1)
}

console.log(`check-headers: public/_headers matches netlify.toml (${expected.length} paths)`)
