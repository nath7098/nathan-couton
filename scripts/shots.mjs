/**
 * Screenshots of the whole journey, against the real build.
 *
 * HANDOFF's rule: nothing ships without someone looking at a real screenshot.
 * This serves `.vercel/output/static` and captures the page at even steps of
 * its scroll, plus the finale's sequence, in the combinations that have each
 * hidden a bug at least once: dark and light, a laptop, a small laptop, a
 * phone, English, and reduced motion.
 *
 *   npm run build && node scripts/shots.mjs [out-dir]
 *
 * Replaces the `.nc-*.mjs` harnesses, which targeted the old horizontal rail.
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = '.vercel/output/static'
const OUT = process.argv[2] || 'shots'
const PORT = 4174
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
}

if (!existsSync(ROOT)) {
  console.error(`✗ ${ROOT} missing — run \`npm run build\` first.`)
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0])
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join(ROOT, `${path}.html`)
  if (!existsSync(file)) {
    res.writeHead(404)
    res.end()
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise(resolve => server.listen(PORT, resolve))

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

const RUNS = [
  { name: 'desktop-dark', path: '/', viewport: { width: 1440, height: 900 }, colorScheme: 'dark' },
  { name: 'desktop-light', path: '/', viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
  { name: 'laptop', path: '/', viewport: { width: 1280, height: 720 }, colorScheme: 'dark' },
  { name: 'phone', path: '/', viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true },
  { name: 'english', path: '/en', viewport: { width: 1440, height: 900 }, colorScheme: 'dark' },
  { name: 'reduced', path: '/', viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' },
]
const STEPS = 16

for (const { name, path, ...options } of RUNS) {
  const page = await browser.newPage(options)
  await page.addInitScript(() => sessionStorage.setItem('nc-intro-played', '1'))
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  for (let i = 0; i <= STEPS; i++) {
    await page.evaluate((p) => {
      window.scrollTo({ top: p * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'instant' })
    }, i / STEPS)
    await page.waitForTimeout(700)
    await page.screenshot({ path: join(OUT, `${name}-${String(i).padStart(2, '0')}.png`) })
  }

  // The finale, frame by frame: threshold, shutters, walk, seated.
  const track = await page.evaluate(() => {
    const r = document.querySelector('.finale__track').getBoundingClientRect()
    return { top: r.top + window.scrollY, range: r.height - window.innerHeight }
  })
  for (const [label, fraction] of [['run', 0.1], ['open', 0.28], ['walk', 0.6], ['seated', 1]]) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), track.top + fraction * track.range)
    await page.waitForTimeout(label === 'seated' ? 1800 : 700)
    await page.screenshot({ path: join(OUT, `${name}-finale-${label}.png`) })
  }
  console.log(`✓ ${name}`)
  await page.close()
}

await browser.close()
server.close()
console.log(`\nScreenshots in ${OUT}/ — look at them.`)
