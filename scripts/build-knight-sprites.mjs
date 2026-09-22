/**
 * Builds the Knight's walk/idle sprite strips for the contact parallax.
 *
 *   node scripts/build-knight-sprites.mjs
 *
 * The contact scene scrolls horizontally and the Knight has to walk across it
 * before sitting on the bench. CSS does that with one `background-position`
 * step animation, which needs every frame in a single strip, all the same
 * width, feet on a shared baseline. Anything else makes the character skate or
 * jitter mid-stride.
 *
 * Source frames come from TinTinWinata/hollow-knight-js, a fan-made canvas
 * clone that ships the Knight's animations as individual PNGs:
 *
 *   https://github.com/TinTinWinata/hollow-knight-js
 *   assets/game/hero/walk/walk_01..08.png   (125x150 RGBA)
 *   assets/game/hero/idle/idle_01..05.png   (125x150 RGBA)
 *
 * Pinned to a commit rather than a branch so re-running this in a year yields
 * byte-identical output instead of whatever master drifted to.
 *
 * The frames already face RIGHT: the clone's player.js sets `backward = false`
 * on the right-movement key and only then draws the sprite unflipped
 * (renderBackward applies ctx.scale(-1, 1)). So no mirroring here — the strip
 * is used as-is for rightward travel and flipped in CSS if we ever need left.
 *
 * Like scripts/fetch-remote-assets.mjs this is deliberately not part of the
 * build: a build must not depend on GitHub being up. Downloads are cached in
 * .cache/knight-sprites/ so re-runs are offline and idempotent, and the
 * generated webp/avif are committed.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const REPO = 'TinTinWinata/hollow-knight-js'
const COMMIT = 'b76aa97c331a439b68b7501f9e43356606ebcaf7'
const CACHE = '.cache/knight-sprites'
const OUT = 'public/img/parallax'

/** Frames the artist exported as separate files, in cycle order. */
const CLIPS = [
  { name: 'knight-walk', dir: 'walk', prefix: 'walk', frames: 8 },
  { name: 'knight-idle', dir: 'idle', prefix: 'idle', frames: 5 },
]

/**
 * Both clips share one crop rectangle.
 *
 * Cropping each frame to its own bounding box would be smaller but wrong: a
 * walk cycle's bounding box breathes as the legs swing, so per-frame trimming
 * re-centres the body every step and the Knight wobbles. One rectangle applied
 * to every frame keeps the artist's original alignment exactly.
 *
 * It spans walk *and* idle together so the character doesn't jump when the
 * scene swaps one strip for the other.
 */
const PAD = 2

const fetchFrame = async (dir, prefix, index) => {
  const file = `${prefix}_${String(index).padStart(2, '0')}.png`
  const cached = join(CACHE, dir, file)
  if (existsSync(cached)) return readFileSync(cached)

  const url = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/assets/game/hero/${dir}/${file}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  mkdirSync(join(CACHE, dir), { recursive: true })
  writeFileSync(cached, buffer)
  return buffer
}

/** Opaque bounds of one frame. Alpha under 16 is antialiasing fringe, not art. */
const bounds = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true })

  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] <= 16) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return { x0, y0, x1, y1, width: info.width, height: info.height }
}

const clips = []
for (const clip of CLIPS) {
  const frames = []
  for (let i = 1; i <= clip.frames; i++) {
    frames.push(await fetchFrame(clip.dir, clip.prefix, i))
  }
  clips.push({ ...clip, buffers: frames, bounds: await Promise.all(frames.map(bounds)) })
}

const all = clips.flatMap(clip => clip.bounds)
const sheet = all[0]

// Union of every frame's bounds, padded, then clamped back inside the source
// canvas. Width is rounded up to an even number purely so the CSS step maths
// stays on whole pixels at 2x device scale.
const left = Math.max(0, Math.min(...all.map(b => b.x0)) - PAD)
const top = Math.max(0, Math.min(...all.map(b => b.y0)) - PAD)
const right = Math.min(sheet.width - 1, Math.max(...all.map(b => b.x1)) + PAD)
const bottom = Math.min(sheet.height - 1, Math.max(...all.map(b => b.y1)) + PAD)

const frameHeight = bottom - top + 1
let frameWidth = right - left + 1
if (frameWidth % 2) frameWidth++
const crop = { left: Math.min(left, sheet.width - frameWidth), top, width: frameWidth, height: frameHeight }

mkdirSync(OUT, { recursive: true })

for (const clip of clips) {
  const tiles = await Promise.all(clip.buffers.map(buffer =>
    sharp(buffer).ensureAlpha().extract(crop).png().toBuffer()))

  const strip = sharp({
    create: {
      width: frameWidth * tiles.length,
      height: frameHeight,
      channels: 4,
      // Fully transparent: the strip sits over the parallax background.
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(tiles.map((input, i) => ({ input, left: i * frameWidth, top: 0 })))

  const raw = await strip.png().toBuffer()

  // The art is flat fills with hard black outlines, so chroma subsampling
  // smears the mask's edges. 4:4:4 costs a few hundred bytes and keeps them
  // crisp at the size this renders (~130px tall).
  const written = []
  for (const [ext, encode] of [
    ['webp', img => img.webp({ quality: 92, alphaQuality: 100, effort: 6, smartSubsample: false })],
    ['avif', img => img.avif({ quality: 62, effort: 9, chromaSubsampling: '4:4:4' })],
  ]) {
    const target = join(OUT, `${clip.name}.${ext}`)
    const { size } = await encode(sharp(raw)).toFile(target)
    written.push(`${ext} ${(size / 1024).toFixed(1)} kB`)
  }

  console.log(
    `✓ ${clip.name} — ${tiles.length} frames, ${frameWidth}×${frameHeight} each, `
    + `strip ${frameWidth * tiles.length}×${frameHeight} — ${written.join(', ')}`,
  )
}

console.log(`\nCSS: width ${frameWidth}px; height ${frameHeight}px;`)
for (const clip of clips) {
  console.log(
    `  ${clip.name}: background-size: ${frameWidth * clip.frames}px ${frameHeight}px; `
    + `animation: … steps(${clip.frames});`,
  )
}
