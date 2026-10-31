import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { checkRedirects } from '../scripts/lib/redirects-check.mjs'

// The exact rules that were live from 21 Sep 2026 and made /privacy and /admin
// redirect to themselves forever.
const BROKEN = `
/index.html          /           301!
/privacy/index.html  /privacy    301!
/privacy/            /privacy    301!
/privacy-policy      /privacy    301!
/admin/              /admin      301!
/privacy             /privacy/index.html   200!
/admin               /index.html           200
/admin/*             /index.html           200
`

test('the shipped _redirects file is clean', () => {
  assert.deepEqual(checkRedirects(fs.readFileSync(new URL('../public/_redirects', import.meta.url), 'utf8')), [])
})

test('catches the trailing-slash self-redirect that took /privacy and /admin down', () => {
  const problems = checkRedirects(BROKEN)
  assert.ok(problems.some((p) => p.includes('/privacy/') && p.includes('itself')), problems.join('\n'))
  assert.ok(problems.some((p) => p.includes('/admin/') && p.includes('itself')), problems.join('\n'))
})

test('catches a redirect that shadows a rewrite for the same path', () => {
  const problems = checkRedirects('/privacy  /somewhere  301!\n/privacy  /privacy/index.html  200!')
  assert.ok(problems.some((p) => p.includes('never served')), problems.join('\n'))
})

test('catches multi-rule cycles', () => {
  const problems = checkRedirects('/a /b 301\n/b /c 301\n/c /a 301')
  assert.ok(problems.some((p) => p.includes('cycle')), problems.join('\n'))
})

test('allows ordinary redirects, comments and splats', () => {
  assert.deepEqual(checkRedirects('# comment\n\n/old /new 301\n/blog/* /posts/:splat 301\n/app/* /index.html 200'), [])
})
