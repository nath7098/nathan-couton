/**
 * Cuts a tileable ground strip out of the Greenpath platform plate.
 *
 *   node scripts/build-ground-strip.mjs
 *
 * `platform-1` is a 1366×768 plate with the stone path painted across the
 * middle 21%–86% of its width and nothing at all outside that. As one
 * `object-fit: cover` layer it was fine, because the camera barely moved. The
 * contact scene now pans a full screen-width over the walk, and the moment the
 * ground has to repeat, that plate falls apart: butting two copies leaves a
 * 28vw stretch of empty air for the Knight to walk over, and the plate's own
 * ends — a sloped ledge on the left, a fade on the right — make the seam
 * obvious wherever you put it.
 *
 * So the strip is cut down to the stretch that actually repeats: no ledge, no
 * fade, just path. Laid out alternately flipped, the joins are seamless by
 * construction — a mirrored join repeats its edge column rather than cutting
 * across the art — and the ground runs as far as the walk needs.
 *
 * The crop keeps the plate's own coordinate space: `Y_OFFSET` below is where
 * the strip's top edge sits in source pixels, and the scene positions it with
 * that number, so the ground line the Knight's feet land on is still the one
 * measured off the original artwork rather than a value found by eye.
 *
 * Like the other asset scripts this is deliberately not part of the build, and
 * the generated webp/avif are committed. Idempotent: same input, same bytes.
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'public/img/parallax/platform-1.webp'
const OUT = 'public/img/parallax'

/**
 * The repeating stretch, in source pixels.
 *
 * Left bound clears the sloped stone ledge that opens the plate (it reads as
 * the entrance to a room and cannot repeat); the right bound stops before the
 * path thins out and fades. What is left is 720px of continuous path.
 */
const X0 = 420
const X1 = 1140

mkdirSync(OUT, { recursive: true })

const source = sharp(SRC).ensureAlpha()
const { width, height } = await source.metadata()
const { data } = await source.raw().toBuffer({ resolveWithObject: true })

/** First and last row carrying real paint inside the crop's column range. */
let top = height
let bottom = -1
for (let y = 0; y < height; y++) {
  for (let x = X0; x < X1; x++) {
    if (data[(y * width + x) * 4 + 3] <= 16) continue
    if (y < top) top = y
    if (y > bottom) bottom = y
    break
  }
}

const box = { left: X0, top, width: X1 - X0, height: bottom - top + 1 }
const raw = await sharp(SRC).ensureAlpha().extract(box).png().toBuffer()

// Flat fills with hard outlines: 4:4:4 keeps them from smearing at the size
// this renders, and the few hundred extra bytes do not move the budget.
for (const [ext, encode] of [
  ['webp', img => img.webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: false })],
  ['avif', img => img.avif({ quality: 62, effort: 9, chromaSubsampling: '4:4:4' })],
]) {
  const { size } = await encode(sharp(raw)).toFile(`${OUT}/ground.${ext}`)
  console.log(`✓ ground.${ext} — ${(size / 1024).toFixed(1)} kB`)
}

console.log(`\n  cut from ${SRC} at x${box.left} y${box.top}, ${box.width}×${box.height}`)
console.log(`  PARALLAX_SIZES.ground = { width: ${box.width}, height: ${box.height} }`)
console.log(`  Y_OFFSET (source px from the plate's centre line) = ${box.top - height / 2}`)
