/**
 * Lighthouse against the built output, with the deploy's real headers.
 *
 * Note on the performance score: this runs headless with software rendering,
 * so paint-bound metrics are pessimistic and the number here is NOT the one
 * SPEC §10.1 budgets. Accessibility, best-practices and SEO do not depend on
 * the GPU and are meaningful as-is.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
import lighthouse from 'lighthouse'

const ROOT = '.vercel/output/static'
const PORT = 4174
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml',
}

const config = JSON.parse(readFileSync('.vercel/output/config.json', 'utf8'))
const rule = (config.headers ?? []).find(entry => entry.source === '/(.*)')
const headers = Object.fromEntries((rule?.headers ?? [])
  .filter(h => h.key !== 'strict-transport-security')
  .map(h => [h.key, h.value]))

const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0])
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join(ROOT, `${path}.html`)
  if (!existsSync(file)) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', ...headers })
  res.end(readFileSync(file))
})
await new Promise(resolve => server.listen(PORT, resolve))

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--remote-debugging-port=9222'],
})

const result = await lighthouse(`http://localhost:${PORT}/`, {
  port: 9222,
  output: 'json',
  logLevel: 'error',
  screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
  formFactor: 'desktop',
  throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
})

const scores = Object.fromEntries(
  Object.entries(result.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)]),
)

console.log('Lighthouse (desktop, software rendering)')
for (const [name, score] of Object.entries(scores)) {
  console.log(`  ${String(score).padStart(3)}  ${name}`)
}

const audits = result.lhr.audits
console.log('\nKey metrics')
for (const id of ['first-contentful-paint', 'largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time']) {
  if (audits[id]) console.log(`  ${audits[id].displayValue?.padStart(8) ?? '—'}  ${audits[id].title}`)
}

const failing = Object.values(audits)
  .filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative')
  .map(a => `${a.title} (${Math.round(a.score * 100)})`)
if (failing.length) {
  console.log('\nAudits below 90')
  for (const item of failing.slice(0, 12)) console.log(`  · ${item}`)
}

await browser.close()
server.close()

// Only the GPU-independent categories are asserted here.
const FLOORS = { 'accessibility': 100, 'best-practices': 95, 'seo': 100 }
let failed = false
for (const [category, floor] of Object.entries(FLOORS)) {
  if (scores[category] < floor) {
    console.error(`\n✗ ${category} ${scores[category]} < ${floor}`)
    failed = true
  }
}
process.exit(failed ? 1 : 0)
