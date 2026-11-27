// Runs before `vite build` (see package.json). Fails the build, and therefore
// the Netlify deploy, if public/_redirects would loop or hide a page.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkRedirects } from './lib/redirects-check.mjs'

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', '_redirects')
const problems = checkRedirects(fs.readFileSync(file, 'utf8'))

if (problems.length) {
  console.error('\npublic/_redirects has problems that would take pages offline:\n')
  problems.forEach((p) => console.error('  - ' + p))
  console.error('')
  process.exit(1)
}
console.log('check-redirects: public/_redirects OK')
