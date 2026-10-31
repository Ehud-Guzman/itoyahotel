// Static checks for a Netlify `_redirects` file. They exist because of a real
// outage: `/privacy/  /privacy  301!` looks harmless, but Netlify matches a rule
// with or without the trailing slash, so it also matched `/privacy` itself and
// redirected it to itself forever. Nothing in the build noticed, and the privacy
// page and the staff /admin app were down until someone looked.
//
// Rules checked:
//   1. a redirect whose source and target are the same path (ignoring a
//      trailing slash and any query string)
//   2. redirect cycles across several rules (A -> B -> A)
//   3. a 30x rule that sits above a 200 rewrite for the same path, so the page
//      the rewrite is meant to serve can never be reached

const REDIRECT = /^30[12378]$/

const norm = (p) => {
  const bare = p.split('?')[0]
  return bare.length > 1 ? bare.replace(/\/+$/, '') : bare
}

export function parseRedirects(text) {
  const rules = []
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    const [from, to, statusToken = '301'] = line.split(/\s+/)
    const status = statusToken.replace('!', '')
    rules.push({ line: i + 1, from, to, status, force: statusToken.endsWith('!'), text: line })
  })
  return rules
}

export function checkRedirects(text) {
  const rules = parseRedirects(text)
  const problems = []
  const isPlain = (p) => typeof p === 'string' && !/[*:]/.test(p) && p.startsWith('/')

  for (const r of rules) {
    if (REDIRECT.test(r.status) && isPlain(r.from) && isPlain(r.to) && norm(r.from) === norm(r.to)) {
      problems.push(`line ${r.line}: "${r.text}" redirects ${norm(r.from)} to itself. Netlify matches rules with or without a trailing slash, so this loops forever.`)
    }
  }

  // Cycles through plain, exact-path redirects.
  const next = new Map()
  for (const r of rules) {
    if (REDIRECT.test(r.status) && isPlain(r.from) && isPlain(r.to) && !next.has(norm(r.from))) next.set(norm(r.from), norm(r.to))
  }
  for (const start of next.keys()) {
    const seen = [start]
    let cur = next.get(start)
    while (cur && next.has(cur) && !seen.includes(cur) && seen.length < 20) { seen.push(cur); cur = next.get(cur) }
    if (cur && seen.includes(cur) && seen.length > 1) {
      problems.push(`redirect cycle: ${[...seen.slice(seen.indexOf(cur)), cur].join(' -> ')}`)
    }
  }

  // A redirect that outranks (comes before) a rewrite for the same path.
  rules.forEach((rewrite, i) => {
    if (rewrite.status !== '200' || !isPlain(rewrite.from)) return
    for (const earlier of rules.slice(0, i)) {
      if (REDIRECT.test(earlier.status) && isPlain(earlier.from) && norm(earlier.from) === norm(rewrite.from)) {
        problems.push(`line ${earlier.line}: "${earlier.text}" comes before the rewrite on line ${rewrite.line} ("${rewrite.text}") and matches the same path, so the page is never served.`)
      }
    }
  })

  return [...new Set(problems)]
}
