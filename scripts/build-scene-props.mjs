/**
 * Cuts the bench out of its full-bleed parallax layer.
 *
 * `town-bench-1` is a 1366×768 plate that is 99.6% transparent: the bench is
 * the only thing drawn on it, at x 670→805, y 590→655. Rendering it as a
 * `object-fit: cover` layer means the bench's on-screen position depends on
 * the viewport's aspect ratio and on the layer's own parallax offset — a
 * moving target. The Knight has to stop *exactly* at the middle of the bench,
 * so the two must share one coordinate space.
 *
 * Cropping the bench to its own sprite lets the scene place it explicitly, on
 * the same plane as the Knight, where "the middle of the bench" is a number we
 * control rather than one we measure. The plate is then dropped from
 * PARALLAX_LAYERS — it carried nothing else.
 *
 *   node scripts/build-scene-props.mjs
 *
 * Idempotent: same inputs, same bytes out.
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'public/img/parallax/town-bench-1.webp'
const OUT = 'public/img/parallax'

/**
 * Measured from the plate, padded so the artwork's soft edges survive the cut.
 * Inside the crop the seat sits at ~58% of the height and the feet at ~89%,
 * which is what the scene uses to line the Knight up.
 */
const PAD = 12
const BOX = { left: 670 - PAD, top: 590 - PAD, width: 135 + PAD * 2, height: 65 + PAD * 2 }

mkdirSync(OUT, { recursive: true })

const cut = sharp(SRC).extract(BOX)
const raw = await cut.png().toBuffer()

await sharp(raw).webp({ quality: 88, effort: 6 }).toFile(`${OUT}/bench.webp`)
await sharp(raw).avif({ quality: 62, effort: 6 }).toFile(`${OUT}/bench.avif`)

const meta = await sharp(`${OUT}/bench.webp`).metadata()
console.log(`✓ bench.webp / bench.avif — ${meta.width}×${meta.height}`)
console.log(`  cut from ${SRC} at x${BOX.left} y${BOX.top}`)
