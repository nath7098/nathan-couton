/**
 * Fails the build when the initial payload outgrows its budget (SPEC §10.1).
 *
 * Only the chunks referenced by the prerendered French home page count: that is
 * what a first visitor actually downloads.
 */
import { gzipSync } from 'node:zlib'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const STATIC_DIR = '.vercel/output/static'
const ENTRY_HTML = join(STATIC_DIR, 'index.html')

// Framework floor measured at L0 (Vue + Nuxt + vue-router + vue-i18n +
// color-mode) is ~101 kB gzip and is not compressible without changing stack.
// The headroom above it is the app's own budget.
// html covers the document including the inlined styles, so its budget is the
// looser one; css is tracked separately to catch style bloat on its own.
const BUDGETS = { js: 150 * 1024, css: 45 * 1024, html: 40 * 1024 }

if (!existsSync(ENTRY_HTML)) {
  console.error(`✗ ${ENTRY_HTML} not found — run \`npm run build\` first.`)
  process.exit(1)
}

const html = readFileSync(ENTRY_HTML, 'utf8')
const gzipSize = file => gzipSync(readFileSync(join(STATIC_DIR, file))).length

const collect = (extension) => {
  const pattern = new RegExp(`_nuxt/[A-Za-z0-9_.-]+\\.${extension}`, 'g')
  return [...new Set(html.match(pattern) ?? [])]
}

// Nuxt inlines the prerendered page's styles, so most CSS lives in <style>
// tags rather than behind a <link>. Counting only linked files understated it
// by an order of magnitude.
const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map(match => match[1])
  .join('')

const measured = {
  js: collect('js').reduce((total, file) => total + gzipSize(file), 0),
  css: collect('css').reduce((total, file) => total + gzipSize(file), 0)
    + (inlineCss ? gzipSync(Buffer.from(inlineCss)).length : 0),
  html: gzipSync(Buffer.from(html)).length,
}

const kb = bytes => `${(bytes / 1024).toFixed(1)} kB`
let failed = false

for (const [kind, budget] of Object.entries(BUDGETS)) {
  const size = measured[kind]
  const share = ((size / budget) * 100).toFixed(0)
  const over = size > budget
  failed ||= over
  console.log(`${over ? '✗' : '✓'} ${kind.padEnd(4)} ${kb(size).padStart(9)} / ${kb(budget).padStart(9)}  (${share}%)`)
}

process.exit(failed ? 1 : 0)
