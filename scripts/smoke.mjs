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

/**
 * Headers the deploy will actually send, read from the build output. Serving
 * without them would test a page nobody gets: a CSP that blocks Nuxt's own
 * inline scripts breaks the site, and only a browser reveals it.
 */
const deployHeaders = (() => {
  const configPath = join('.vercel/output', 'config.json')
  if (!existsSync(configPath)) return {}
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const rule = (config.headers ?? []).find(entry => entry.source === '/(.*)')
  return Object.fromEntries((rule?.headers ?? [])
    // HSTS over plain http would poison the browser profile for localhost.
    .filter(h => h.key !== 'strict-transport-security')
    .map(h => [h.key, h.value]))
})()

const AXE_PATH = '/__axe.js'

const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0])

  // Injecting axe as an inline script would be blocked by our own CSP — which
  // is the point of having one. Serving it from the same origin satisfies
  // `script-src 'self'` and keeps the audit running against the real headers.
  if (path === AXE_PATH) {
    res.writeHead(200, { 'content-type': 'text/javascript' })
    res.end(readFileSync('node_modules/axe-core/axe.min.js'))
    return
  }

  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join(ROOT, `${path}.html`)
  if (!existsSync(file)) {
    res.writeHead(404)
    res.end('not found')
    return
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    ...deployHeaders,
  })
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

/**
 * The intro veil covers the page for up to 2.2s on a first visit and swallows
 * the first click (that click is what skips it). Anything that interacts has to
 * get past it first, exactly as a visitor would.
 */
async function skipIntro(page) {
  const intro = page.locator('.intro')
  if (await intro.count() === 0) return
  await page.keyboard.press('Escape').catch(() => {})
  await intro.waitFor({ state: 'detached', timeout: 4000 }).catch(() => {})
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
  await skipIntro(page)
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
  await skipIntro(page)

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
  await skipIntro(page)

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
  await skipIntro(page)
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
  await skipIntro(page)
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

// ── Frame budget while scrolling the rail ──────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await skipIntro(page)
  await page.waitForTimeout(500)

  /** One scroll sweep, returning the sorted frame times. */
  const sweep = () => page.evaluate(async () => {
    const times = []
    let last = performance.now()
    let raf = requestAnimationFrame(function tick(now) {
      times.push(now - last)
      last = now
      raf = requestAnimationFrame(tick)
    })
    const max = document.documentElement.scrollHeight - window.innerHeight
    for (let i = 0; i <= 40; i++) {
      window.scrollTo(0, (max * i) / 40)
      await new Promise(resolve => setTimeout(resolve, 32))
    }
    cancelAnimationFrame(raf)
    return times.slice(3).sort((a, b) => a - b)
  })

  // Two passes, best kept. This box is shared and a build finishing next door
  // doubles the numbers; a single unlucky sweep should not fail the run, while
  // a real regression shows in both.
  const runs = [await sweep(), await sweep()]
  const at = (frames, q) => frames[Math.floor(frames.length * q)]
  const median = Math.min(...runs.map(frames => at(frames, 0.5)))
  const p95 = Math.min(...runs.map(frames => at(frames, 0.95)))

  // Headless software rendering, so absolute numbers are pessimistic —
  // SPEC §10.1's 12ms target needs a real machine with a GPU. These ceilings
  // are regression guards, not the budget: three effects each cost half the
  // frame budget when first written, and this is what caught them.
  //
  // The median is the assertion that matters: it sits at 16.7ms (one vsync
  // interval) run after run, so a doubling is unmissable. p95 swings between
  // 33 and 50ms on an idle-but-shared machine, so its ceiling is loose enough
  // not to fail at random — a flaky check gets ignored, which is worse than none.
  check(median <= 25, `scroll frame median ${median.toFixed(1)}ms (ceiling 25ms, software rendering)`)
  check(p95 <= 70, `scroll frame p95 ${p95.toFixed(1)}ms (ceiling 70ms, software rendering)`)
  await page.close()
}

// ── Accessibility audit (SPEC §10.2) ───────────────────────────────────────
{
  for (const [label, path, scheme] of [
    ['fr / dark', '/', 'dark'],
    ['fr / light', '/', 'light'],
    ['en / dark', '/en', 'dark'],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme })
    await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' })
    await skipIntro(page)
    await page.waitForTimeout(500)

    await page.addScriptTag({ url: `http://localhost:${PORT}${AXE_PATH}` })
    const results = await page.evaluate(async () => {
      // Canvases and the decorative backdrop are aria-hidden by design; axe
      // still walks them, so scope the run to the document and let the rules
      // decide.
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      })
    })

    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact))
    const minor = results.violations.filter(v => !['serious', 'critical'].includes(v.impact))

    const detail = serious.map(v => `${v.id} (${v.nodes.length})`).join(', ')
    check(serious.length === 0, `axe ${label} — no serious/critical violations${detail ? `: ${detail}` : ''}`)
    if (minor.length) {
      console.log(`  · ${label}: ${minor.length} minor/moderate — ${minor.map(v => v.id).join(', ')}`)
    }
    await page.close()
  }
}

// ── Text contrast, both themes (SPEC §10.2) ────────────────────────────────
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await skipIntro(page)

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
