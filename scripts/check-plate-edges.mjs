/**
 * Reports how each parallax plate should be repeated.
 *
 *   node scripts/check-plate-edges.mjs
 *
 * The contact scene pans far enough that every layer has to repeat, and there
 * are only two ways to join two copies of a painting without a seam:
 *
 *   - `tile`, if the plate's left and right columns carry no paint. The join
 *     falls in empty air and there is nothing to line up. This is the one to
 *     want: repeating a plate looks like more cavern, whereas flipping it
 *     looks like an inkblot as soon as the art has a recognisable silhouette.
 *
 *   - `mirror`, otherwise. Flipping every second copy makes the join repeat
 *     its edge column rather than cut across the art, which is seamless by
 *     construction but visibly symmetrical. Acceptable on the far, soft plates
 *     where the symmetry cannot be read.
 *
 * This prints the answer rather than leaving it to the eye, because the eye
 * gets it wrong: a seam one pixel wide is invisible in a screenshot and
 * unmistakable once the layer is moving. Keep `repeat` in
 * `app/data/parallax.ts` in step with this output.
 */
import sharp from 'sharp'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'public/img/parallax'

/** Alpha below this is antialiasing fringe or compression noise, not art. */
const INK = 40
/** A handful of stray pixels in a column is not a painted edge either. */
const COLUMN_MIN = 8

const plates = readdirSync(DIR)
  .filter(file => file.endsWith('.webp'))
  .map(file => file.replace(/\.webp$/, ''))
  .sort()

for (const name of plates) {
  const { data, info } = await sharp(join(DIR, `${name}.webp`))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const inked = (x) => {
    let count = 0
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * 4 + 3] > INK) count++
    }
    return count >= COLUMN_MIN
  }

  const edged = inked(0) || inked(info.width - 1)
  console.log(
    `${name.padEnd(18)} ${String(info.width).padStart(5)}×${String(info.height).padEnd(4)}  `
    + `${edged ? 'mirror' : 'tile  '}  ${edged ? 'painted to its edges' : 'transparent margins'}`,
  )
}
