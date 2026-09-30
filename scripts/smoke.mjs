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

const SECTION_IDS = ['home', 'about', 'parcours', 'skills', 'projects', 'contact']

/** A page at a size, with problems collected and the intro out of the way. */
async function open(path, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options })
  const problems = []
  page.on('console', m => m.type() === 'error' && problems.push(`console: ${m.text()}`))
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
  page.on('response', r => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`))
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await skipIntro(page)
  await page.evaluate(() => document.fonts.ready)
  return { page, problems }
}

/** Scrolls and waits two frames: scroll-driven animations settle on the next one. */
const scrollToY = (page, y) => page.evaluate(async (top) => {
  window.scrollTo({ top, behavior: 'instant' })
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
}, y)

// ── French home ────────────────────────────────────────────────────────────
{
  const { page, problems } = await visit('/')
  check(problems.length === 0, `/ loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const body = await page.locator('body').innerText()
  check(!body.includes('Internal Server Error'), '/ is not the Nuxt error page')
  check(body.includes('Parcours') && body.includes('Projets'), '/ renders the French header navigation')

  const ids = await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map(s => s.id))
  check(JSON.stringify(ids) === JSON.stringify(SECTION_IDS), `/ renders the six sections in order (got ${ids.join(', ')})`)

  // Theme toggle flips the attribute the whole design system keys off.
  const before = await page.getAttribute('html', 'data-theme')
  await page.locator('.site-header__prefs .theme-toggle').first().click()
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
  check(body.includes('Career') && body.includes('Projects'), '/en renders English navigation')
  const lang = await page.getAttribute('html', 'lang')
  check(lang?.startsWith('en'), `/en sets an English lang attribute (got ${lang})`)
  await page.close()
}

// ── Content is present in the prerendered HTML ─────────────────────────────
{
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  // Every section's words ship in the HTML, so the site reads without JS and
  // search engines — and a recruiter's Ctrl+F — see the whole page.
  const expected = [
    'Nathan Couton', 'Développeur fullstack', 'Harmonie Mutuelle', 'ACII by Audensiel', 'Catamania',
    'Sopra Steria', 'Polytech Tours', 'Prévoyance', 'Kafka', 'Spring Batch', 'HoloLens',
    'Sleep Token', 'Hollow Knight', 'contact@nathancouton.fr', 'CV_Nathan_Couton.pdf',
  ]
  const missing = expected.filter(text => !html.includes(text))
  check(missing.length === 0, `prerendered HTML carries the content${missing.length ? ` — missing: ${missing.join(', ')}` : ''}`)
}

// ── The document: layout, header, CV, search ───────────────────────────────
{
  const { page, problems } = await open('/')
  check(problems.length === 0, `desktop loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check(overflow <= 1, `no horizontal overflow at 1440 (${overflow}px)`)

  // The CV is one click away from anywhere: the header, the hero, the panel,
  // the footer. And the file behind those links exists.
  const resumes = await page.evaluate(() => [...document.querySelectorAll('a[download]')].map(a => a.getAttribute('href')))
  check(resumes.length >= 3, `CV links in header, hero and contact (${resumes.length})`)
  const status = await page.evaluate(async href => (await fetch(href)).status, resumes[0])
  check(status === 200, `the CV link resolves (${resumes[0]} → ${status})`)

  // Both faces actually load: they are self-hosted now, and a font that fails
  // silently leaves the whole page in the system monospace.
  const fonts = await page.evaluate(() => ({
    mono: document.fonts.check('400 16px "JetBrains Mono"'),
    display: document.fonts.check('560 32px "Fraunces"'),
  }))
  check(fonts.mono && fonts.display, `self-hosted fonts load (mono ${fonts.mono}, display ${fonts.display})`)

  // Ctrl+F: the words are on the page, not behind a rail that cannot scroll
  // to them.
  const found = await page.evaluate(() => {
    window.scrollTo(0, 0)
    const ok = window.find('Mutuelle de Poitiers')
    const range = ok ? window.getSelection().getRangeAt(0).getBoundingClientRect() : null
    return { ok, visible: Boolean(range && range.top >= 0 && range.bottom <= window.innerHeight) }
  })
  check(found.ok && found.visible, `find-in-page reaches and shows the Parcours (${JSON.stringify(found)})`)

  // Header navigation lands a section under the header, and says so.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.site-header__links a[href="#projects"]').click()
  await page.waitForTimeout(1600)
  const landed = await page.evaluate(() => ({
    top: document.getElementById('projects').getBoundingClientRect().top,
    header: document.querySelector('.site-header').getBoundingClientRect().height,
    current: document.querySelector('.site-header__links a[aria-current]')?.getAttribute('href'),
    hash: location.hash,
  }))
  check(Math.abs(landed.top - landed.header) <= 8, `header link lands #projects under the header (${Math.round(landed.top)} vs ${Math.round(landed.header)})`)
  check(landed.current === '#projects', `and marks it current (${landed.current})`)
  check(landed.hash === '#projects', `and mirrors it in the hash (${landed.hash})`)

  // End reaches the footer: the address is there in plain text, never inert.
  await page.keyboard.press('End')
  await page.waitForTimeout(1200)
  const foot = await page.evaluate(() => {
    const el = document.querySelector('.site-footer__mail')
    const r = el.getBoundingClientRect()
    return { visible: r.top < window.innerHeight && r.bottom > 0, inert: Boolean(el.closest('[inert]')) }
  })
  check(foot.visible && !foot.inert, `End reaches the footer and its address (${JSON.stringify(foot)})`)

  await page.close()
}

// ── Deep links ─────────────────────────────────────────────────────────────
for (const [path, id] of [['/#skills', 'skills'], ['/#experience', 'parcours']]) {
  const { page } = await open(path)
  await page.waitForTimeout(600)
  const at = await page.evaluate(sid => ({
    top: document.getElementById(sid).getBoundingClientRect().top,
    hash: location.hash,
  }), id)
  check(Math.abs(at.top) < 120 && at.hash === `#${id}`, `${path} lands on #${id} (${Math.round(at.top)}px, ${at.hash})`)
  await page.close()
}

// ── Legacy paths still answer with a redirect ──────────────────────────────
{
  const config = JSON.parse(readFileSync('.vercel/output/config.json', 'utf8'))
  const routes = JSON.stringify(config.routes ?? [])
  check(routes.includes('/experience') && routes.includes('/#parcours'),
    '/experience is redirected to /#parcours in the deploy config')
}

// ── The finale ─────────────────────────────────────────────────────────────
// The rail version cancelled the track's travel with a counter-translating
// camera and shimmered. What replaced it rests on one structural guarantee —
// the stage is pinned by `sticky` for every frame of the walk, so nothing
// moves but the scene's own layers — and on the layers' distances being
// ordered by depth. Neither shows in a screenshot.
{
  const { page, problems } = await open('/')
  check(problems.length === 0, `finale page loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const geo = await page.evaluate(() => {
    const finale = document.querySelector('.finale')
    const track = document.querySelector('.finale__track')
    const style = getComputedStyle(finale)
    const r = track.getBoundingClientRect()
    return {
      top: r.top + window.scrollY,
      range: r.height - window.innerHeight,
      openFrom: parseFloat(style.getPropertyValue('--open-from')),
      walkFrom: parseFloat(style.getPropertyValue('--walk-from')),
      walkTo: parseFloat(style.getPropertyValue('--walk-to')),
    }
  })
  check(geo.range > 900 && geo.walkTo > geo.walkFrom && geo.walkFrom > geo.openFrom,
    `finale has a pinned budget (${Math.round(geo.range)}px; open ${geo.openFrom.toFixed(2)}, walk ${geo.walkFrom.toFixed(2)}→${geo.walkTo.toFixed(2)})`)

  const at = fraction => geo.top + fraction * geo.range

  /** Samples the stage, the Knight and three layers at one point of the walk. */
  const sampleAt = async (walk) => {
    await scrollToY(page, at(geo.walkFrom + (geo.walkTo - geo.walkFrom) * walk))
    return page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel)
        return el ? el.getBoundingClientRect() : null
      }
      const stage = box('.finale__stage')
      const knight = box('.hk__knight--walk')
      const seated = box('.hk__knight--sit')
      const bench = box('.hk__bench')
      const panel = document.querySelector('.panel')
      // Anchored on the whole file name: `background-far` also contains
      // "ground", and matching it made the ground look as slow as the wall.
      const layerX = (file) => {
        const img = document.querySelector(`.hk__layer img[src$="/${file}.webp"]`)
        return img ? img.closest('.hk__layer').getBoundingClientRect().left : null
      }
      return {
        stage: stage && { top: stage.top, height: stage.height },
        panel: { opacity: parseFloat(getComputedStyle(panel).opacity), inert: panel.inert },
        knight: knight && { left: knight.left },
        seated: seated && { left: seated.left, right: seated.right },
        bench: bench && { left: bench.left, right: bench.right },
        far: layerX('background-far'),
        ground: layerX('ground'),
        front: layerX('front-shadows'),
      }
    })
  }

  // 0. The threshold: the terminal covers the stage while the command runs,
  //    and its shutters are gone by the time the walk starts.
  await scrollToY(page, at(geo.openFrom * 0.6))
  const running = await page.evaluate(() => ({
    screen: parseFloat(getComputedStyle(document.querySelector('.term__screen')).opacity),
    shutter: document.querySelector('.term__shutter').getBoundingClientRect().left,
  }))
  await scrollToY(page, at(geo.walkFrom))
  const opened = await page.evaluate(() => [...document.querySelectorAll('.term__shutter')]
    .every((shutter) => {
      const r = shutter.getBoundingClientRect()
      return r.right <= 0 || r.left >= window.innerWidth
    }))
  check(running.screen > 0.9 && running.shutter < 2, `the terminal covers the stage while it runs (opacity ${running.screen})`)
  check(opened, 'its shutters have slid off screen when the walk begins')

  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1]
  const frames = []
  for (const walk of steps) frames.push(await sampleAt(walk))

  // 1. The stage is pinned full screen for the whole walk.
  const pinned = frames.every(f => f.stage && Math.abs(f.stage.top) < 1 && Math.abs(f.stage.height - 900) < 1)
  check(pinned, `the stage stays pinned full screen for the whole walk (${frames.map(f => Math.round(f.stage?.top ?? NaN)).join(', ')})`)

  // 2. Layers are ordered by depth.
  const travelled = key => Math.abs((frames.at(-1)[key] ?? 0) - (frames[0][key] ?? 0))
  const far = travelled('far')
  const ground = travelled('ground')
  const front = travelled('front')
  check(far > 0 && far < ground && ground < front,
    `layers separate by depth (far ${Math.round(far)}px < ground ${Math.round(ground)}px < front ${Math.round(front)}px)`)

  // 3. Every layer moves the same way every step.
  const monotonic = ['far', 'ground', 'front'].every(key =>
    frames.every((f, i) => i === 0 || f[key] <= frames[i - 1][key] + 0.5))
  check(monotonic, 'every layer slides left, every step of the walk')

  // 4. The Knight advances rightwards across the screen.
  const advances = frames.every((f, i) => i === 0 || f.knight.left >= frames[i - 1].knight.left - 0.5)
  check(advances && frames.at(-1).knight.left > frames[0].knight.left + 100,
    `the Knight walks right (${Math.round(frames[0].knight.left)}px → ${Math.round(frames.at(-1).knight.left)}px)`)

  // 5. And sits in the middle of the bench, in the middle of the screen.
  const last = frames.at(-1)
  const seatedMid = (last.seated.left + last.seated.right) / 2
  const benchMid = (last.bench.left + last.bench.right) / 2
  check(Math.abs(seatedMid - benchMid) < 8,
    `the Knight sits in the middle of the bench (${Math.round(seatedMid)} vs ${Math.round(benchMid)})`)
  check(Math.abs(benchMid - 720) < 8, `the bench lands at the centre of the screen (${Math.round(benchMid)})`)

  // 6. The form is not there while he walks, and takes no tab stops.
  const away = frames.slice(0, -1)
  check(away.every(f => f.panel.opacity < 0.01), `the form stays away for the whole walk (${
    away.map(f => f.panel.opacity.toFixed(2)).join(', ')})`)
  check(away.every(f => f.panel.inert), 'and is inert while it is away, so it takes no tab stops')

  // 7. Sitting down is played in two beats: he flares white, then sheds motes.
  await sampleAt(0.5)
  await page.waitForTimeout(400)
  const rest = await page.evaluate(async (target) => {
    window.scrollTo({ top: target, behavior: 'instant' })
    const seen = { flashAt: -1, motesAt: -1 }
    for (let t = 0; t < 2000; t += 40) {
      if (seen.flashAt < 0 && document.querySelector('.hk__flash')) seen.flashAt = t
      if (seen.motesAt < 0 && document.querySelector('.hk__mote')) seen.motesAt = t
      if (seen.flashAt >= 0 && seen.motesAt >= 0) break
      await new Promise(r => setTimeout(r, 40))
    }
    return seen
  }, at(1))
  check(rest.flashAt >= 0, `the Knight flares white as he sits (at ${rest.flashAt}ms)`)
  check(rest.motesAt > rest.flashAt,
    `and sheds motes once he is back to normal (flare ${rest.flashAt}ms → motes ${rest.motesAt}ms)`)

  // 8. The form arrives on that cue, clear of the bench.
  await page.waitForTimeout(1200)
  const panel = await page.evaluate(() => {
    const el = document.querySelector('.panel')
    const r = el.getBoundingClientRect()
    return { left: r.left, opacity: parseFloat(getComputedStyle(el).opacity), inert: el.inert }
  })
  check(panel.opacity > 0.95 && !panel.inert, `the form arrives once he is on the bench (opacity ${panel.opacity.toFixed(2)})`)
  check(panel.left > last.bench.right, `the form clears the bench (${Math.round(panel.left)} > ${Math.round(last.bench.right)})`)

  // 9. Over the artwork the header lets it breathe: no blurred band.
  const header = await page.evaluate(() => getComputedStyle(document.querySelector('.site-header')).backdropFilter)
  check(header === 'none', `the header drops its glass over the scene (${header})`)

  // 10. Every plate is decoded by the time the stage is pinned.
  const plates = await page.evaluate(() => [...document.querySelectorAll('.hk__tile img')].every(img => img.complete && img.naturalWidth > 0))
  check(plates, 'every plate of the scene has loaded')

  // 11. Coming to rest just short of the stage carries the visitor onto it;
  //     a finale already under way is never dragged back.
  const settle = offset => page.evaluate(async ({ target, offset }) => {
    window.scrollTo({ top: target + offset * window.innerHeight, behavior: 'instant' })
    await new Promise(r => setTimeout(r, 1400))
    return window.scrollY
  }, { target: geo.top, offset })
  const approach = await settle(-0.3)
  check(Math.abs(approach - geo.top) < 4, `stopping short of the finale snaps onto the stage (${Math.round(approach)} → ${Math.round(geo.top)})`)
  const inside = await settle(0.3)
  check(inside > geo.top + 100, `a finale already under way is never dragged back (${Math.round(inside)})`)
  const early = await settle(-2)
  check(Math.abs(early - (geo.top - 1800)) < 4, `scrolls that stop elsewhere are left alone (${Math.round(early)})`)

  // 12. The header's Contact link lands on the form, ready.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.site-header__links a[href="#contact"]').click()
  await page.waitForTimeout(2600)
  const ready = await page.evaluate(() => {
    const el = document.querySelector('.panel')
    return { opacity: parseFloat(getComputedStyle(el).opacity), inert: el.inert }
  })
  check(ready.opacity > 0.95 && !ready.inert, `the Contact link lands on the form, ready (opacity ${ready.opacity.toFixed(2)})`)

  await page.close()
}

// ── Phone ──────────────────────────────────────────────────────────────────
{
  const { page, problems } = await open('/', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  check(problems.length === 0, `phone layout loads clean${problems.length ? ` — ${problems.join(' | ')}` : ''}`)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check(overflow <= 1, `phone layout has no horizontal overflow (${overflow}px)`)

  // No walk here: the stage opens on the Knight already seated, and the form
  // follows it in the flow, never inert.
  const phone = await page.evaluate(async () => {
    const track = document.querySelector('.finale__track')
    const r = track.getBoundingClientRect()
    const top = r.top + window.scrollY
    window.scrollTo({ top: top + (r.height - window.innerHeight) * 0.9, behavior: 'instant' })
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)))
    const stage = document.querySelector('.finale__stage').getBoundingClientRect()
    const sit = getComputedStyle(document.querySelector('.hk__knight--sit')).opacity
    const panel = document.querySelector('.panel')
    const p = panel.getBoundingClientRect()
    return { stageTop: stage.top, sit: parseFloat(sit), inert: panel.inert, after: p.top + window.scrollY >= top + r.height - 2 }
  })
  check(Math.abs(phone.stageTop) < 1, `the phone stage pins too (top ${phone.stageTop})`)
  check(phone.sit === 1, 'the Knight is found already seated on a phone')
  check(!phone.inert && phone.after, 'the form follows the stage and is never inert on a phone')

  // The menu opens and its links work.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.site-header__menu-button').click()
  await page.waitForTimeout(300)
  const opened = await page.evaluate(() => document.querySelector('#site-menu').matches(':popover-open'))
  await page.locator('#site-menu a[href="#parcours"]').click()
  await page.waitForTimeout(3000)
  const menuLanded = await page.evaluate(() => Math.round(document.getElementById('parcours').getBoundingClientRect().top))
  check(opened && Math.abs(menuLanded - 68) < 12, `the phone menu opens and navigates (open ${opened}, #parcours at ${menuLanded}px)`)
  await page.close()
}

// ── Reduced motion ─────────────────────────────────────────────────────────
{
  const { page } = await open('/', { reducedMotion: 'reduce' })
  const reduced = await page.evaluate(() => {
    const track = document.querySelector('.finale__track').getBoundingClientRect()
    const panel = document.querySelector('.panel')
    return {
      track: track.height,
      term: getComputedStyle(document.querySelector('.term')).display,
      inert: panel.inert,
      sit: parseFloat(getComputedStyle(document.querySelector('.hk__knight--sit')).opacity),
    }
  })
  check(Math.abs(reduced.track - 900) < 2, `reduced motion spends no scroll on the finale (${reduced.track}px)`)
  check(reduced.term === 'none' && !reduced.inert && reduced.sit === 1,
    `and shows its last frame: no terminal, Knight seated, form ready (${JSON.stringify(reduced)})`)
  await page.close()
}

// ── Frame budget while scrolling the page ──────────────────────────────────
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
  // They are deliberately loose. The same build measured 16.7ms one day and
  // 33.4ms the next on this container, with no code change between — verified
  // by re-measuring the merged baseline. An absolute threshold tuned to a fast
  // machine turns into a false alarm on a slow one, and a check that cries wolf
  // gets ignored. What these catch is the failure mode that actually happened
  // here: an effect that doubles or triples the cost, which shows through the
  // noise on any machine.
  check(median <= 40, `scroll frame median ${median.toFixed(1)}ms (ceiling 40ms, software rendering)`)
  check(p95 <= 110, `scroll frame p95 ${p95.toFixed(1)}ms (ceiling 110ms, software rendering)`)
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

    const detail = serious.map(v => `${v.id} (${v.nodes.length}: ${v.nodes.slice(0, 4).map(n => n.target.join(' ')).join(' | ')})`).join(', ')
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
      ['section title', '.section__title'],
      ['header link', '.site-header__link'],
      ['brand', '.site-header__brand'],
      ['hero overline', '.hero__overline'],
      ['hero statement', '.hero__statement'],
      ['commit period', '.commit__period'],
      ['skill years', '.skill__years'],
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
