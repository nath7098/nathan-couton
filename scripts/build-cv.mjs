/**
 * The CV, generated from the site's own data — never edited by hand again.
 *
 *   npm run cv [preview-dir]
 *
 * The old CV was an Illustrator file: it stopped at the Mutuelle de Poitiers
 * while the site had moved on. This one reads the same `app/data` and locale
 * files the site renders, lays them out as one A4 page in the site's type and
 * colours (Fraunces, JetBrains Mono, the mint accent — darkened for paper),
 * and prints it with Chromium. Change the data, run this, commit both PDFs.
 *
 * It fails if a page overflows: a CV that spills onto a second page by three
 * lines is worse than one that was edited down.
 *
 * Writes public/cv/CV_Nathan_Couton.pdf (fr) and CV_Nathan_Couton_EN.pdf (en).
 * Given a directory, also writes a PNG preview of each — look at them.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const jiti = createJiti(import.meta.url, { alias: { '~': join(ROOT, 'app') } })
const load = async path => jiti.import(join(ROOT, path))

const { BRANCHES, COMMITS } = await load('app/data/parcours.ts')
const { SKILLS, TIERS } = await load('app/data/skills.ts')
const { CONTACT } = await load('app/data/contact.ts')
const { NOW, CONTENT_AS_OF, YEARS_OF_EXPERIENCE } = await load('app/data/now.ts')
const { FIGURE_IDS, HOBBY_IDS } = await load('app/data/about.ts')
const MESSAGES = {
  fr: (await load('i18n/locales/fr.ts')).default,
  en: (await load('i18n/locales/en.ts')).default,
}

const SITE = 'nathancouton.fr'
const PREVIEW = process.argv[2]

/** What the CV says that the site does not, or says differently. */
const LOCAL = {
  fr: {
    file: 'CV_Nathan_Couton.pdf',
    education: 'Formation',
    languages: 'Langues',
    offscreen: 'Hors écran',
    selfTaught: 'Autoformation : OpenClassrooms, HackTheBox',
    location: `${NOW.city} (37)`,
    yearsHint: 'ⁿ = ans',
    footer: date => `// généré depuis ${SITE} · ${date}`,
    month: 'long',
  },
  en: {
    file: 'CV_Nathan_Couton_EN.pdf',
    education: 'Education',
    languages: 'Languages',
    offscreen: 'Off screen',
    selfTaught: 'Self-taught: OpenClassrooms, HackTheBox',
    location: `${NOW.city}, France`,
    yearsHint: 'ⁿ = yrs',
    footer: date => `// generated from ${SITE} · ${date}`,
    month: 'long',
  },
}

/** The four figures, valued as the Profile values them. */
const FIGURE_VALUES = { years: String(YEARS_OF_EXPERIENCE), esn: '2', degree: 'Bac+5', english: '930' }

const EMPLOYER = { catamania: 'Catamania', acii: 'ACII by Audensiel', sopra: 'Sopra Steria' }

function escape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** vue-i18n's message syntax, as far as these messages use it. */
function format(message, params = {}) {
  return String(message)
    .replace(/\{'(.)'\}/g, '$1')
    .replace(/\{(\w+)\}/g, (match, key) => (key in params ? params[key] : match))
}

function render(locale) {
  const m = MESSAGES[locale]
  const local = LOCAL[locale]
  const t = (path, params) => {
    const value = path.split('.').reduce((node, key) => node?.[key], m)
    if (value === undefined) throw new Error(`missing message ${locale}:${path}`)
    return format(value, params)
  }
  const date = new Date(CONTENT_AS_OF.year, CONTENT_AS_OF.month - 1, 1)
    .toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { month: local.month, year: 'numeric' })

  const work = COMMITS.filter(commit => commit.branch !== 'main')
  const education = COMMITS.filter(commit => commit.branch === 'main')
    .filter(commit => commit.id !== 'polytech')

  const branchOf = commit => BRANCHES.find(branch => branch.id === commit.branch)

  const missions = work.map((commit) => {
    const entry = m.parcours[commit.id]
    const branch = branchOf(commit)
    const current = branch.to === undefined
    const points = (entry.points ?? []).map(point => `<li>${escape(format(point))}</li>`).join('')
    return `
      <li class="commit${current ? ' is-current' : ''}">
        <p class="commit__meta">
          <span class="commit__period">${escape(entry.period)}</span>
          <span class="commit__ref">${current ? 'HEAD → ' : ''}${escape(EMPLOYER[commit.branch])}</span>
        </p>
        <h3 class="commit__title">${escape(entry.title)}</h3>
        <p class="commit__role">${escape(entry.role)}</p>
        <p class="commit__summary">${escape(format(entry.summary))}</p>
        ${points ? `<ul class="commit__points">${points}</ul>` : ''}
      </li>`
  }).join('')

  const schooling = education.map((commit) => {
    const entry = m.parcours[commit.id]
    const role = commit.id === 'degree' ? 'Polytech Tours' : entry.role
    return `
      <li class="edu">
        <span class="edu__period">${escape(commit.id === 'degree' ? m.parcours.polytech.period : entry.period)}</span>
        <span class="edu__title">${escape(entry.title)}</span>
        ${role ? `<span class="edu__where">${escape(role)}</span>` : ''}
      </li>`
  }).join('')

  const tiers = TIERS.map(tier => `
      <div class="tier">
        <h3 class="tier__title">${escape(t(`skills.tiers.${tier}.title`))}</h3>
        <ul class="tier__list">${SKILLS.filter(skill => skill.tier === tier && skill.id !== 'intellij').map(skill => `
          <li>${escape(skill.name)}${skill.years ? `<span class="tier__years">${skill.years}</span>` : ''}</li>`).join('')}
        </ul>
      </div>`).join('')

  const figures = FIGURE_IDS.map(id => `
      <li class="figure">
        <span class="figure__value">${escape(t(`about.figures.${id}.value`, { value: FIGURE_VALUES[id] }))}</span>
        <span class="figure__label">${escape(t(`about.figures.${id}.label`))}</span>
      </li>`).join('')

  const hobbies = HOBBY_IDS.filter(id => id !== 'australia')
    .map(id => `${t(`about.hobbies.${id}.name`)}${id === 'music' ? ` (${t(`about.hobbies.${id}.detail`).toLowerCase()})` : ''}`)

  const linkedin = CONTACT.social.find(item => item.id === 'linkedin').href
  const github = CONTACT.social.find(item => item.id === 'github').href
  const font = file => pathToFileURL(join(ROOT, 'public/fonts', file)).href

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>Nathan Couton — ${escape(t('seo.jobTitle'))}</title>
<style>
@font-face { font-family: 'Fraunces'; src: url('${font('fraunces-latin-wght-normal.woff2')}') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'JetBrains Mono'; src: url('${font('jetbrains-mono-latin-400-normal.woff2')}') format('woff2'); font-weight: 400; }
@font-face { font-family: 'JetBrains Mono'; src: url('${font('jetbrains-mono-latin-700-normal.woff2')}') format('woff2'); font-weight: 700; }

@page { size: A4; margin: 0; }

:root {
  /* The site's light theme, nudged darker for paper. */
  --text: oklch(0.22 0.02 245);
  --dim: oklch(0.42 0.02 245);
  --faint: oklch(0.56 0.015 245);
  --line: oklch(0.88 0.01 245);
  --brand: oklch(0.64 0.12 172);
  --ink: oklch(0.45 0.1 176);
  --soft: oklch(0.96 0.025 172);
  --display: 'Fraunces', Georgia, serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
  --sans: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

body {
  inline-size: 210mm;
  block-size: 297mm;
  padding: 12mm 13mm 9mm;
  overflow: hidden;
  font-family: var(--sans);
  font-size: 8.3pt;
  line-height: 1.4;
  color: var(--text);
  background: #fff;
}

.page {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 5mm;
  block-size: 100%;
}

a { color: inherit; text-decoration: none; }

/* ── Head ─────────────────────────────────────────────────────────────── */
.head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8mm;
  align-items: end;
}

.name {
  font-family: var(--display);
  font-size: 27pt;
  font-weight: 560;
  line-height: 1;
  letter-spacing: -0.02em;
}

.name b { font-weight: 400; color: var(--brand); }

.title {
  margin-block-start: 2mm;
  font-family: var(--display);
  font-size: 13pt;
  font-weight: 480;
  color: var(--ink);
}

.statement {
  max-inline-size: 112mm;
  margin-block-start: 1.6mm;
  font-size: 9.2pt;
  color: var(--dim);
}

.contact {
  display: grid;
  font-style: normal;
  gap: 0.9mm;
  font-family: var(--mono);
  font-size: 7.6pt;
  color: var(--dim);
  text-align: end;
}

.contact span::before { content: '› '; color: var(--brand); }

/* ── Figures ──────────────────────────────────────────────────────────── */
.figures {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4mm;
  list-style: none;
}

.figure {
  display: grid;
  gap: 0.6mm;
  padding-block-start: 2mm;
  border-block-start: 1px solid var(--line);
}

.figure__value {
  font-family: var(--display);
  font-size: 14.5pt;
  font-weight: 520;
  line-height: 1;
  color: var(--ink);
}

.figure__label { font-size: 7.4pt; color: var(--dim); }

/* ── Body ─────────────────────────────────────────────────────────────── */
.body {
  display: grid;
  grid-template-columns: 1fr 52mm;
  gap: 8mm;
  min-block-size: 0;
}

.section-head {
  display: flex;
  gap: 2mm;
  align-items: baseline;
  margin-block-end: 3mm;
}

.section-head h2 {
  font-family: var(--display);
  font-size: 13.5pt;
  font-weight: 560;
  line-height: 1;
}

.section-head span {
  font-family: var(--mono);
  font-size: 7pt;
  color: var(--faint);
}

/* The Parcours, as the site draws it: one rail, a dot per commit. */
.log {
  position: relative;
  display: grid;
  gap: 2.6mm;
  padding-inline-start: 5mm;
  list-style: none;
}

.log::before {
  content: '';
  position: absolute;
  inset-block: 1.5mm 0;
  inset-inline-start: 1.1mm;
  inline-size: 1.2px;
  background: var(--line);
}

.commit { position: relative; }

.commit::before {
  content: '';
  position: absolute;
  inset-block-start: 1.1mm;
  inset-inline-start: -5mm;
  inline-size: 2.4mm;
  block-size: 2.4mm;
  background: #fff;
  border: 1.2px solid var(--faint);
  border-radius: 50%;
}

.commit.is-current::before {
  background: var(--brand);
  border-color: var(--brand);
  box-shadow: 0 0 0 1mm var(--soft);
}

.commit__meta {
  display: flex;
  gap: 2mm;
  align-items: baseline;
  font-family: var(--mono);
  font-size: 7.2pt;
  color: var(--faint);
}

.commit__ref {
  padding: 0 1.4mm;
  color: var(--dim);
  border: 1px solid var(--line);
  border-radius: 99px;
}

.is-current .commit__ref { color: var(--ink); border-color: var(--brand); }

.commit__title {
  margin-block-start: 0.6mm;
  font-family: var(--display);
  font-size: 11.5pt;
  font-weight: 560;
  line-height: 1.15;
}

.commit__role {
  font-size: 8pt;
  font-weight: 600;
  color: var(--ink);
}

.commit__summary { margin-block-start: 0.6mm; color: var(--dim); }

.commit__points {
  display: grid;
  gap: 0.4mm;
  margin-block-start: 0.8mm;
  list-style: none;
}

.commit__points li {
  position: relative;
  padding-inline-start: 3mm;
}

.commit__points li::before {
  content: '+';
  position: absolute;
  inset-inline-start: 0;
  font-family: var(--mono);
  font-weight: 700;
  color: var(--brand);
}

/* ── Side ─────────────────────────────────────────────────────────────── */
.side {
  display: grid;
  align-content: start;
  gap: 5.5mm;
}

.tier + .tier { margin-block-start: 2.6mm; }

.tier__title {
  margin-block-end: 1mm;
  font-family: var(--mono);
  font-size: 7.2pt;
  font-weight: 700;
  color: var(--ink);
  text-transform: lowercase;
}

.tier__list { display: flex; flex-wrap: wrap; gap: 0.6mm 1.4mm; list-style: none; }

/* One word each, years as a superscript in mono: the list reads as a line of
   keywords — which is how it is read, by people and by parsers. */
.tier__list li {
  padding: 0.2mm 1.4mm;
  white-space: nowrap;
  border: 1px solid var(--line);
  border-radius: 1mm;
}

.tier__years {
  margin-inline-start: 0.8mm;
  font-family: var(--mono);
  font-size: 6.4pt;
  color: var(--ink);
  vertical-align: 0.4mm;
}

.edus { display: grid; gap: 2mm; list-style: none; }

.edu { display: grid; }

.edu__period { font-family: var(--mono); font-size: 7pt; color: var(--faint); }
.edu__title { font-weight: 600; line-height: 1.3; }
.edu__where { font-size: 7.8pt; color: var(--dim); }

.plain { display: grid; gap: 0.6mm; list-style: none; color: var(--dim); }

/* ── Foot ─────────────────────────────────────────────────────────────── */
.foot {
  display: flex;
  justify-content: space-between;
  padding-block-start: 2mm;
  font-family: var(--mono);
  font-size: 6.8pt;
  color: var(--faint);
  border-block-start: 1px solid var(--line);
}
</style>
</head>
<body>
<main class="page">
  <header class="head">
    <div>
      <h1 class="name"><b>{{</b> Nathan Couton <b>}}</b></h1>
      <p class="title">${escape(t('seo.jobTitle'))}</p>
      <p class="statement">${escape(t('hero.statement', { years: YEARS_OF_EXPERIENCE }))}</p>
    </div>
    <address class="contact">
      <a href="mailto:${CONTACT.email}"><span>${CONTACT.email}</span></a>
      <a href="tel:+33${CONTACT.phone.slice(1)}"><span>${CONTACT.phoneDisplay}</span></a>
      <a href="https://${SITE}"><span>${SITE}</span></a>
      <a href="${linkedin}"><span>${linkedin.replace(/^https:\/\/www\./, '').replace(/\/$/, '')}</span></a>
      <a href="${github}"><span>${github.replace(/^https:\/\//, '')}</span></a>
      <span>${escape(local.location)} · ${escape(t('about.facts.licenseValue'))}</span>
    </address>
  </header>

  <ul class="figures">${figures}</ul>

  <div class="body">
    <section>
      <div class="section-head"><h2>${escape(t('sections.parcours.title'))}</h2><span>git log --graph</span></div>
      <ol class="log">${missions}</ol>
    </section>

    <aside class="side">
      <section>
        <div class="section-head"><h2>${escape(t('sections.skills.title'))}</h2><span>${escape(local.yearsHint)}</span></div>
        ${tiers}
      </section>
      <section>
        <div class="section-head"><h2>${escape(local.education)}</h2></div>
        <ul class="edus">${schooling}</ul>
      </section>
      <section>
        <div class="section-head"><h2>${escape(local.languages)}</h2></div>
        <ul class="plain"><li>${escape(t('about.facts.languagesValue'))}</li></ul>
      </section>
      <section>
        <div class="section-head"><h2>${escape(local.offscreen)}</h2></div>
        <ul class="plain">
          <li>${escape(hobbies.map((h, i) => (i ? h.charAt(0).toLowerCase() + h.slice(1) : h)).join(', '))}</li>
          <li>${escape(local.selfTaught)}</li>
        </ul>
      </section>
    </aside>
  </div>

  <footer class="foot">
    <span>${escape(local.footer(date))}</span>
    <span>$ npm run contact</span>
  </footer>
</main>
</body>
</html>`
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const work = join(tmpdir(), 'nc-cv')
mkdirSync(work, { recursive: true })
if (PREVIEW) mkdirSync(PREVIEW, { recursive: true })

let failed = false
for (const locale of ['fr', 'en']) {
  const html = join(work, `cv-${locale}.html`)
  writeFileSync(html, render(locale))

  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 })
  await page.goto(pathToFileURL(html).href)
  await page.evaluate(() => document.fonts.ready)

  // One page or nothing: the body is clipped to A4, so compare what the
  // columns need with what the page has.
  const fit = await page.evaluate(() => {
    const body = document.querySelector('.body')
    const columns = [...body.children].map(el => el.scrollHeight)
    const fonts = ['Fraunces', 'JetBrains Mono'].every(f => document.fonts.check(`12px "${f}"`))
    return { need: Math.max(...columns), have: body.clientHeight, fonts }
  })
  if (!fit.fonts) {
    console.error(`✗ ${locale}: the site's fonts did not load`)
    failed = true
  }
  if (fit.need > fit.have + 1) {
    console.error(`✗ ${locale}: overflows the page by ${fit.need - fit.have}px`)
    failed = true
  }

  const out = join(ROOT, 'public/cv', LOCAL[locale].file)
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true })
  if (PREVIEW) await page.screenshot({ path: join(PREVIEW, `cv-${locale}.png`), fullPage: false, scale: 'device' })
  console.log(`${fit.need > fit.have + 1 ? '✗' : '✓'} ${locale} → public/cv/${LOCAL[locale].file} (${fit.need}/${fit.have}px)`)
  await page.close()
}

await browser.close()
if (failed) process.exit(1)
