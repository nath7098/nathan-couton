/**
 * Writes security headers into the Vercel build output, after `nuxt build`.
 *
 * The Content-Security-Policy is the reason this is a post-build step rather
 * than a static `routeRules` entry: Nuxt emits a handful of inline scripts
 * (the import map, the theme/hash bootstrap, the JSON-LD, the payload) whose
 * contents change with every build. Their sha256 hashes are computed here, so
 * `script-src` never needs 'unsafe-inline'.
 *
 * Styles are a different matter: Nuxt inlines ~30 <style> blocks per page, and
 * hashing them would produce an unwieldy header for little gain — injected CSS
 * is a far smaller risk than injected script. `style-src` keeps 'unsafe-inline'
 * deliberately.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const OUTPUT = '.vercel/output'
const CONFIG = join(OUTPUT, 'config.json')
const STATIC = join(OUTPUT, 'static')

if (!existsSync(CONFIG)) {
  console.error(`✗ ${CONFIG} missing — run \`npm run build\` first.`)
  process.exit(1)
}

/** Every prerendered HTML file, so no page's scripts are missed. */
function htmlFiles(dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) found.push(...htmlFiles(path))
    else if (entry.endsWith('.html')) found.push(path)
  }
  return found
}

const hashes = new Set()
for (const file of htmlFiles(STATIC)) {
  const html = readFileSync(file, 'utf8')
  // Inline scripts only: anything with src= is covered by 'self'.
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    const body = match[1]
    if (!body) continue
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
}

const csp = [
  `default-src 'self'`,
  `script-src 'self' ${[...hashes].join(' ')}`,
  // See the note above: inline styles are Nuxt's own, injected at build.
  `style-src 'self' 'unsafe-inline'`,
  // Spotify and IGDB artwork until scripts/fetch-remote-assets.mjs is run.
  `img-src 'self' data: https://i.scdn.co https://images.igdb.com`,
  `font-src 'self' data:`,
  `media-src 'self'`,
  `connect-src 'self' https://api.emailjs.com`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join('; ')

const headers = [
  {
    source: '/(.*)',
    headers: [
      { key: 'content-security-policy', value: csp },
      { key: 'strict-transport-security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'x-content-type-options', value: 'nosniff' },
      { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
      // Nothing here needs a camera, a microphone or a location.
      { key: 'permissions-policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'x-frame-options', value: 'DENY' },
    ],
  },
  {
    // Hashed filenames: safe to cache forever.
    source: '/_nuxt/(.*)',
    headers: [{ key: 'cache-control', value: 'public, max-age=31536000, immutable' }],
  },
  {
    source: '/(sprite.svg|favicon.ico|nc_logo_static.png)',
    headers: [{ key: 'cache-control', value: 'public, max-age=86400' }],
  },
]

const config = JSON.parse(readFileSync(CONFIG, 'utf8'))
config.headers = headers

/**
 * The legacy section paths (/about, /skills…) are handled twice in the output:
 * a 301 route near the top, and a function route further down that Nuxt emits
 * for every prerendered-but-not-found path. The redirect always wins, so those
 * functions can never be reached — they are dead weight in the deployment.
 */
const LEGACY = ['about', 'experience', 'skills', 'education', 'projects', 'contact']
const before = config.routes.length
config.routes = config.routes.filter((route) => {
  if (route.status === 301 || !route.dest) return true
  const path = String(route.src ?? '').replace(/^\//, '').replace(/^en\//, '')
  return !LEGACY.includes(path)
})
const removed = before - config.routes.length

writeFileSync(CONFIG, JSON.stringify(config, null, 2))

console.log(`✓ security headers written — ${hashes.size} inline script hashes`)
console.log(`  CSP is ${csp.length} bytes`)
if (removed) console.log(`✓ ${removed} unreachable legacy route(s) dropped`)
