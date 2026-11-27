// Header rules currently live in netlify.toml. Cloudflare Pages reads the same
// rules from a `_headers` file in the publish directory instead, and silently
// serves a page with no CSP, no X-Frame-Options and no cache rules if that file
// is missing — which is how a migration quietly loses its security headers.
//
// So the rules are authored once (netlify.toml) and `public/_headers` is
// generated from them and checked in. The build fails if the two drift.

// Read one `[[headers]]` block's values, following a triple-quoted value across
// lines. The CSP is one long line today, but TOML allows it to wrap and a
// wrapped value would otherwise be truncated into nonsense.
export function parseNetlifyHeaders(toml) {
  const rules = []
  let current = null
  let inValues = false
  const lines = toml.split(/\r?\n/)

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    if (line === '[[headers]]') {
      current = { path: null, headers: {} }
      rules.push(current)
      inValues = false
      continue
    }
    if (!current) continue
    if (line === '[headers.values]') {
      inValues = true
      continue
    }
    if (line.startsWith('[')) {
      inValues = false
      continue
    }

    if (!inValues) {
      const m = /^for\s*=\s*"([^"]*)"$/.exec(line)
      if (m) current.path = m[1]
      continue
    }

    const m = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line)
    if (!m) continue

    let value = m[2].trim()
    if (value.startsWith('"""')) {
      let body = value.slice(3)
      if (!body.endsWith('"""')) {
        // Keep reading until the closing delimiter.
        while (i + 1 < lines.length) {
          i += 1
          body += ' ' + lines[i].trim()
          if (body.endsWith('"""')) break
        }
      }
      value = body.endsWith('"""') ? body.slice(0, -3) : body
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }

    current.headers[m[1].toLowerCase()] = normalise(value)
  }

  return rules.filter((r) => r.path)
}

const normalise = (v) => String(v).trim().replace(/\s+/g, ' ')

// Cloudflare Pages `_headers`: an unindented line starts a path block, indented
// `Name: value` lines follow it.
export function parseHeadersFile(text) {
  const rules = []
  let current = null

  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    if (!/^\s/.test(raw)) {
      current = { path: raw.trim(), headers: {} }
      rules.push(current)
      continue
    }
    const m = /^\s+([A-Za-z0-9-]+)\s*:\s*(.+)$/.exec(raw)
    if (m && current) current.headers[m[1].toLowerCase()] = normalise(m[2])
  }

  return rules
}

// `/*` last, so the specific rules read as exceptions to it.
const pathRank = (p) => (p === '/*' ? 1 : 0)

export function renderHeadersFile(rules) {
  const out = [
    '# Generated from netlify.toml by `npm run headers:sync`. Do not edit by hand:',
    '# the build fails if this file and netlify.toml disagree.',
    '',
  ]
  for (const rule of [...rules].sort((a, b) => pathRank(a.path) - pathRank(b.path))) {
    out.push(rule.path)
    for (const [name, value] of Object.entries(rule.headers)) {
      const display = name.replace(/(^|-)([a-z])/g, (_, dash, ch) => dash + ch.toUpperCase())
      out.push(`  ${display}: ${value}`)
    }
    out.push('')
  }
  return out.join('\n')
}

// Every path and header present in `expected` must appear in `actual` with the
// same value, and nothing may be served that the authored rules never mention.
export function compareHeaders(expected, actual) {
  const problems = []
  const byPath = new Map(actual.map((r) => [r.path, r]))

  for (const rule of expected) {
    const found = byPath.get(rule.path)
    if (!found) {
      problems.push(`public/_headers is missing the block for "${rule.path}" (from netlify.toml)`)
      continue
    }
    for (const [name, value] of Object.entries(rule.headers)) {
      if (!(name in found.headers)) {
        problems.push(`public/_headers: "${rule.path}" is missing ${name}`)
      } else if (found.headers[name] !== value) {
        problems.push(
          `public/_headers: "${rule.path}" ${name} is out of date\n` +
            `    netlify.toml: ${value}\n` +
            `    _headers:    ${found.headers[name]}`,
        )
      }
    }
    for (const name of Object.keys(found.headers)) {
      if (!(name in rule.headers)) {
        problems.push(`public/_headers: "${rule.path}" has ${name}, which netlify.toml does not`)
      }
    }
  }

  const expectedPaths = new Set(expected.map((r) => r.path))
  for (const rule of actual) {
    if (!expectedPaths.has(rule.path)) problems.push(`public/_headers has a block for "${rule.path}", which netlify.toml does not`)
  }

  return problems
}
