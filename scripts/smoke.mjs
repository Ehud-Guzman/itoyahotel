// Production smoke test: does the live site serve what it should?
//
//   npm run smoke                              (checks https://hotelitoya.co.ke)
//   npm run smoke -- http://localhost:4173     (checks a local preview)
//
// Run it after every deploy. It would have caught the /privacy and /admin
// redirect loop the day it shipped: it follows redirects by hand and reports a
// loop instead of hanging. Exits non-zero if anything is wrong.
const base = (process.argv[2] || 'https://hotelitoya.co.ke').replace(/\/+$/, '')
const MAX_HOPS = 5

async function get(path) {
  const trail = []
  let url = base + path
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'itoya-smoke-test' } })
    if (res.status >= 300 && res.status < 400) {
      const to = new URL(res.headers.get('location'), url).toString()
      trail.push(`${res.status} ${new URL(url).pathname} -> ${new URL(to).pathname}`)
      if (to === url) return { loop: true, trail }
      url = to
      continue
    }
    return { res, body: await res.text(), trail, finalUrl: url }
  }
  return { loop: true, trail }
}

const checks = [
  { path: '/',                 status: 200, has: ['Hotel Itoya', 'id="root"', '/season-boot.js'], header: ['content-security-policy', 'x-frame-options'] },
  { path: '/privacy',          status: 200, has: ['What we collect', 'rel="canonical" href="https://hotelitoya.co.ke/privacy"'] },
  { path: '/privacy/',         status: 200, has: ['What we collect'] },
  { path: '/privacy-policy',   status: 200, has: ['What we collect'] },
  { path: '/admin',            status: 200, has: ['id="root"'], header: ['x-robots-tag'] },
  { path: '/admin/',           status: 200, has: ['id="root"'] },
  { path: '/season-boot.js',   status: 200, has: ['data-season-name'] },
  { path: '/sitemap.xml',      status: 200, has: ['<loc>https://hotelitoya.co.ke/</loc>', '<loc>https://hotelitoya.co.ke/privacy</loc>'] },
  { path: '/robots.txt',       status: 200, has: ['Sitemap:'] },
  { path: '/no-such-page-xyz', status: 404, has: ['Page Not Found'] },
]

let failed = 0
const fail = (path, msg) => { failed++; console.log(`FAIL ${path.padEnd(18)} ${msg}`) }

for (const c of checks) {
  try {
    const r = await get(c.path)
    if (r.loop) { fail(c.path, `REDIRECT LOOP: ${r.trail.join(' | ')}`); continue }
    if (r.res.status !== c.status) { fail(c.path, `expected ${c.status}, got ${r.res.status}${r.trail.length ? ' after ' + r.trail.join(' | ') : ''}`); continue }
    const missing = (c.has || []).filter((s) => !r.body.includes(s))
    if (missing.length) { fail(c.path, `missing in body: ${missing.join(', ')}`); continue }
    const noHeader = (c.header || []).filter((h) => !r.res.headers.get(h))
    if (noHeader.length) { fail(c.path, `missing response header: ${noHeader.join(', ')}`); continue }
    console.log(`ok   ${c.path.padEnd(18)} ${r.res.status}${r.trail.length ? '  (via ' + r.trail.join(' | ') + ')' : ''}`)
  } catch (err) {
    fail(c.path, `request failed: ${err.message}`)
  }
}

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.')
process.exit(failed ? 1 : 0)
