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

// ── Horizontal rail (desktop viewport) ─────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const problems = []
  page.on('console', m => m.type() === 'error' && problems.push(`console: ${m.text()}`))
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)

  check(problems.length === 0, `rail loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const driver = await page.getAttribute('html', 'data-rail-driver')
  console.log(`  · scroll driver: ${driver}`)

  // The proxy must be tall enough to scroll the whole track.
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  check(scrollHeight > 900 * 9, `scroll proxy is tall enough (${scrollHeight}px)`)

  const trackX = () => page.evaluate(() => {
    const el = document.querySelector('.rail__track')
    return el ? el.getBoundingClientRect().left : null
  })

  const atTop = await trackX()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2))
  await page.waitForTimeout(500)
  const atMiddle = await trackX()
  check(atMiddle !== null && atMiddle < atTop - 200, `track slides left on scroll (${atTop} → ${atMiddle})`)

  // Vertical position must not drift: this is a horizontal rail.
  const trackY = await page.evaluate(() => document.querySelector('.rail__viewport')?.getBoundingClientRect().top)
  check(Math.abs(trackY) < 2, `sticky viewport stays pinned (top ${trackY})`)

  // Keyboard: ArrowRight advances a scene.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  const firstActive = await page.getAttribute('.rail-nav__dot.is-active', 'aria-label')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(900)
  const afterArrow = await page.getAttribute('.rail-nav__dot.is-active', 'aria-label')
  check(firstActive !== afterArrow, `ArrowRight advances a scene (${firstActive} → ${afterArrow})`)

  // End jumps to the last scene, Home returns.
  await page.keyboard.press('End')
  await page.waitForTimeout(1000)
  const atEnd = await page.getAttribute('.rail-nav__dot.is-active', 'aria-label')
  check(/contact/i.test(atEnd ?? ''), `End reaches the contact scene (${atEnd})`)

  // The hash follows the active scene, so a position can be shared.
  const hash = await page.evaluate(() => window.location.hash)
  check(hash === '#contact', `hash mirrors the active scene (${hash})`)

  await page.close()
}

// ── No scene overflows its viewport ────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // A scene is exactly one viewport tall and clips what does not fit, so
  // scrollHeight tells us nothing — measure the children's boxes instead.
  const overflowing = await page.evaluate(() => {
    const out = []
    for (const scene of document.querySelectorAll('[data-scene]')) {
      const box = scene.getBoundingClientRect()
      let top = Infinity
      let bottom = -Infinity
      for (const child of scene.querySelectorAll('*')) {
        const rect = child.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        top = Math.min(top, rect.top)
        bottom = Math.max(bottom, rect.bottom)
      }
      const over = Math.max(box.top - top, bottom - box.bottom)
      if (over > 4) out.push(`${scene.dataset.scene} (+${Math.round(over)}px)`)
    }
    return out
  })
  check(overflowing.length === 0, `no scene overflows vertically${overflowing.length ? ` — ${overflowing.join(', ')}` : ''}`)
  await page.close()
}

// ── Content is present in the prerendered HTML ─────────────────────────────
{
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  // The point of SSR here: every scene's words ship in the HTML, so the site
  // reads without JS and search engines see the whole page.
  const expected = [
    'Nathan Couton', 'Développeur Fullstack', 'ACII by Audensiel', 'Sopra Steria',
    'Polytech Tours', 'IUT Angoulême', 'Prévoyance', 'Hololens', 'Sleep Token',
    'Hollow Knight', 'Tours', 'contact@nathancouton.fr',
  ]
  const missing = expected.filter(text => !html.includes(text))
  check(missing.length === 0, `prerendered HTML carries the content${missing.length ? ` — missing: ${missing.join(', ')}` : ''}`)
}

// ── Deep link ──────────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://localhost:${PORT}/#skills`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const active = await page.getAttribute('.rail-nav__dot.is-active', 'aria-label')
  check(/comp[ée]tences|skills/i.test(active ?? ''), `/#skills lands on the skills scene (${active})`)

  const scrolled = await page.evaluate(() => window.scrollY)
  check(scrolled > 0, `/#skills actually moves the rail (scrollY ${scrolled})`)
  await page.close()
}

// ── Stacked layout (phone viewport) ────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const problems = []
  page.on('pageerror', e => problems.push(e.message))
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  check(problems.length === 0, `phone layout loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const before = await page.evaluate(() => document.querySelector('.rail__track')?.getBoundingClientRect().left)
  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.waitForTimeout(400)
  const after = await page.evaluate(() => document.querySelector('.rail__track')?.getBoundingClientRect().left)
  check(Math.abs((after ?? 0) - (before ?? 0)) < 2, 'phone layout does not slide sideways')

  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  check(!overflows, 'phone layout has no horizontal overflow')
  await page.close()
}

// ── Text contrast, both themes (SPEC §10.2) ────────────────────────────────
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)

  const results = await page.evaluate(() => {
    // Any CSS colour → sRGB triplet, resolved by the engine itself. color-mix()
    // comes back as oklab() from getComputedStyle, which cannot be read as RGB.
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const toRgb = (css) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      return [r, g, b]
    }
    const srgb = (channel) => {
      const c = channel / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
    const ratio = (fg, bg) => {
      const a = lum(fg)
      const b = lum(bg)
      const [hi, lo] = a > b ? [a, b] : [b, a]
      return (hi + 0.05) / (lo + 0.05)
    }

    const opaqueBg = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor
        const parts = (c.match(/[\d.]+/g) || []).map(Number)
        const alpha = parts.length > 3 ? parts[3] : 1
        if (alpha > 0.95) return toRgb(c)
      }
      return [255, 255, 255]
    }

    const targets = [
      ['scene title', '.scene__title'],
      ['scene number', '.scene__number'],
      ['scene hint', '.scene__hint'],
      ['brand', '.page__brand'],
      ['nav label', '.rail-nav__label'],
      ['locale link', '.locale-switch__link[aria-current]'],
    ]
    return targets.map(([name, sel]) => {
      const el = document.querySelector(sel)
      if (!el) return { name, missing: true }
      const cs = getComputedStyle(el)
      const size = parseFloat(cs.fontSize)
      const bold = parseInt(cs.fontWeight, 10) >= 700
      const large = size >= 24 || (bold && size >= 18.66)
      const fg = toRgb(cs.color)
      const bg = opaqueBg(el)
      return {
        name, size: Math.round(size), large, min: large ? 3 : 4.5,
        ratio: +ratio(fg, bg).toFixed(2),
        color: `rgb(${fg.join(',')})`, bg: `rgb(${bg.join(',')})`,
      }
    })
  })
  for (const r of results) {
    if (r.missing) continue
    check(r.ratio >= r.min, `${scheme}: ${r.name} contrast ${r.ratio}:1 (min ${r.min})`)
  }
  await page.close()
}

await browser.close()
server.close()

if (failures.length) {
  console.error(`\n✗ ${failures.length} runtime check(s) failed.`)
  process.exit(1)
}
console.log('\n✓ runtime smoke passed')
