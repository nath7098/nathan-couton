/**
 * Runtime smoke test against the real build output.
 *
 * The L0 bundle passed lint, typecheck, unit tests and the size budgets while
 * being completely broken in a browser: a stray `i18n.bundle.dropMessageCompiler`
 * made every `t()` call throw at hydration and Nuxt swapped the page for its 500
 * screen. Static checks cannot catch that — only loading the page can. This runs
 * in CI after `npm run build`, and any console error fails it.
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = '.vercel/output/static'
const PORT = 4173
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2',
}

if (!existsSync(ROOT)) {
  console.error(`✗ ${ROOT} missing — run \`npm run build\` first.`)
  process.exit(1)
}

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
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise(resolve => server.listen(PORT, resolve))

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
})

const failures = []
const check = (ok, label) => {
  console.log(`${ok ? '✓' : '✗'} ${label}`)
  if (!ok) failures.push(label)
}

/** Loads a page and fails on any console error, page error or 4xx/5xx. */
async function visit(path) {
  const page = await browser.newPage()
  const problems = []
  page.on('console', m => m.type() === 'error' && problems.push(`console: ${m.text()}`))
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
  page.on('response', r => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`))
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  return { page, problems }
}

// ── French home ────────────────────────────────────────────────────────────
{
  const { page, problems } = await visit('/')
  check(problems.length === 0, `/ loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const body = await page.locator('body').innerText()
  check(!body.includes('Internal Server Error'), '/ is not the Nuxt error page')
  check(body.includes('Accueil'), '/ renders French navigation')

  const scenes = await page.locator('main section[id]').count()
  check(scenes === 7, `/ renders the seven scenes (got ${scenes})`)

  // Theme toggle flips the attribute the whole design system keys off.
  const before = await page.getAttribute('html', 'data-theme')
  await page.locator('.theme-toggle').click()
  await page.waitForTimeout(250)
  const after = await page.getAttribute('html', 'data-theme')
  check(before !== after, `theme toggle switches data-theme (${before} → ${after})`)

  await page.close()
}

// ── English home ───────────────────────────────────────────────────────────
{
  const { page, problems } = await visit('/en')
  check(problems.length === 0, `/en loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const body = await page.locator('body').innerText()
  check(body.includes('Home'), '/en renders English navigation')
  // i18n emits the full language tag configured for the locale (en-GB).
  const lang = await page.getAttribute('html', 'lang')
  check(lang?.startsWith('en'), `/en sets an English lang attribute (got ${lang})`)
  await page.close()
}

await browser.close()
server.close()

if (failures.length) {
  console.error(`\n✗ ${failures.length} runtime check(s) failed.`)
  process.exit(1)
}
console.log('\n✓ runtime smoke passed')
