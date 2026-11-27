import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  compareHeaders,
  parseHeadersFile,
  parseNetlifyHeaders,
  renderHeadersFile,
} from '../scripts/lib/headers-check.mjs'

const toml = fs.readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8')
const headersFile = fs.readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')

// The site is on Netlify today and Cloudflare Pages reads `_headers`; if the two
// disagree, one platform quietly loses its CSP and cache rules.
test('public/_headers matches netlify.toml exactly', () => {
  assert.deepEqual(compareHeaders(parseNetlifyHeaders(toml), parseHeadersFile(headersFile)), [])
})

test('the shipped rules cover the pages and files that need them', () => {
  const rules = parseNetlifyHeaders(toml)
  const byPath = new Map(rules.map((r) => [r.path, r]))

  assert.ok(byPath.has('/*'), 'catch-all block')
  assert.ok(byPath.get('/*').headers['content-security-policy'].includes("frame-ancestors 'none'"), 'CSP is present')
  assert.equal(byPath.get('/*').headers['x-frame-options'], 'DENY')
  assert.equal(byPath.get('/*').headers['x-content-type-options'], 'nosniff')
  assert.equal(byPath.get('/admin').headers['x-robots-tag'], 'noindex, nofollow')
  assert.equal(byPath.get('/admin/*').headers['x-robots-tag'], 'noindex, nofollow')
  // Hashed assets for a year, but the season files must pick up a new date within minutes.
  assert.match(byPath.get('/assets/*').headers['cache-control'], /max-age=31536000/)
  assert.match(byPath.get('/season-boot.js').headers['cache-control'], /max-age=300/)
  assert.match(byPath.get('/season-art.css').headers['cache-control'], /max-age=300/)
})

test('reads a triple-quoted value that wraps across lines', () => {
  const wrapped = `[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """default-src 'self';
      frame-ancestors 'none'"""
`
  const rule = parseNetlifyHeaders(wrapped)[0]
  assert.equal(rule.headers['content-security-policy'], "default-src 'self'; frame-ancestors 'none'")
})

test('catches a header whose value changed', () => {
  const expected = [{ path: '/*', headers: { 'x-frame-options': 'DENY' } }]
  const actual = [{ path: '/*', headers: { 'x-frame-options': 'SAMEORIGIN' } }]
  const problems = compareHeaders(expected, actual)
  assert.equal(problems.length, 1)
  assert.match(problems[0], /out of date/)
  assert.match(problems[0], /DENY/)
  assert.match(problems[0], /SAMEORIGIN/)
})

test('catches a missing path, a missing header and an extra one', () => {
  const expected = [
    { path: '/admin', headers: { 'x-robots-tag': 'noindex, nofollow' } },
    { path: '/*', headers: { 'x-frame-options': 'DENY' } },
  ]

  const missingPath = compareHeaders(expected, [{ path: '/*', headers: { 'x-frame-options': 'DENY' } }])
  assert.ok(missingPath.some((p) => p.includes('/admin') && p.includes('missing')))

  const missingHeader = compareHeaders(expected, [
    { path: '/admin', headers: {} },
    { path: '/*', headers: { 'x-frame-options': 'DENY' } },
  ])
  assert.ok(missingHeader.some((p) => p.includes('missing x-robots-tag')))

  const extra = compareHeaders([{ path: '/*', headers: { 'x-frame-options': 'DENY' } }], [
    { path: '/*', headers: { 'x-frame-options': 'DENY', 'x-powered-by': 'nope' } },
  ])
  assert.ok(extra.some((p) => p.includes('x-powered-by')))
})

test('generated output round-trips back to the same rules', () => {
  const rules = parseNetlifyHeaders(toml)
  // Rendering puts the `/*` catch-all last, so compare by path rather than order.
  const byPath = (list) => [...list].sort((a, b) => a.path.localeCompare(b.path))
  assert.deepEqual(byPath(parseHeadersFile(renderHeadersFile(rules))), byPath(rules))
})
