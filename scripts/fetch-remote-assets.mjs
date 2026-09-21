/**
 * Downloads the third-party artwork the About scene points at.
 *
 * Spotify (i.scdn.co) and IGDB (images.igdb.com) URLs can expire without
 * notice, and the site is fully static — a dead URL would just leave a gap.
 * Run this once from a machine with network access, then point
 * app/data/about.ts at the local copies it writes.
 *
 *   npm run assets:fetch
 *
 * It is deliberately not part of the build: builds must not depend on a third
 * party being up.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { TOP_ARTISTS, TOP_TRACKS, GAMES } from '../app/data/about.ts'

const OUT = 'public/img/remote'
mkdirSync(OUT, { recursive: true })

/** Derives a stable filename from the URL's last path segment. */
const nameFor = (url, prefix) => {
  const id = url.split('/').pop()?.slice(0, 24) ?? 'asset'
  return `${prefix}-${id}.jpg`
}

const items = [
  ...TOP_ARTISTS.map(a => ({ url: a.image, file: nameFor(a.image, 'artist'), label: a.name })),
  ...TOP_TRACKS.map(t => ({ url: t.image, file: nameFor(t.image, 'track'), label: t.name })),
  ...GAMES.map(g => ({ url: g.image, file: nameFor(g.image, 'game'), label: g.name })),
]

// Two Sleep Token tracks share a cover; download each URL once.
const unique = [...new Map(items.map(item => [item.url, item])).values()]

let ok = 0
let failed = 0

for (const item of unique) {
  const target = join(OUT, item.file)
  if (existsSync(target)) {
    console.log(`· ${item.file} already there`)
    ok++
    continue
  }
  try {
    const response = await fetch(item.url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    writeFileSync(target, Buffer.from(await response.arrayBuffer()))
    console.log(`✓ ${item.label} → ${item.file}`)
    ok++
  }
  catch (error) {
    console.error(`✗ ${item.label}: ${error.message}`)
    console.error(`  ${item.url}`)
    failed++
  }
}

console.log(`\n${ok} downloaded, ${failed} failed.`)
if (failed) {
  console.log('A failed URL usually means the CDN dropped it. Replace it in app/data/about.ts.')
}
console.log(`Then point app/data/about.ts at /img/remote/… and re-run the build.`)
