import { describe, expect, it } from 'vitest'
import {
  BACKDROP_LAYERS,
  FIGURE_SCALE,
  FOREGROUND_LAYERS,
  GROUND_DEPTH,
  KNIGHT_START,
  PAN,
  PARALLAX_LAYERS,
  PLATE_WIDTH,
  tileCount,
} from '~/data/parallax'
import { PARALLAX_SIZES } from '~/data/parallax-sizes'

describe('the Greenpath layer stack', () => {
  it('is ordered back to front — the array is the paint order', () => {
    const depths = PARALLAX_LAYERS.map(layer => layer.depth)
    expect(depths).toEqual([...depths].sort((a, b) => a - b))
  })

  it('has exactly one layer on the plane the Knight walks on', () => {
    const ground = PARALLAX_LAYERS.filter(layer => layer.depth === GROUND_DEPTH)
    expect(ground).toHaveLength(1)
    expect(ground[0]!.file).toBe('ground')
  })

  it('splits the stack around that plane, losing nothing', () => {
    expect([...BACKDROP_LAYERS, ...FOREGROUND_LAYERS]).toEqual([...PARALLAX_LAYERS])
    // The Knight is drawn between the two, so anything nearer than the ground
    // he stands on passes in front of him.
    for (const layer of FOREGROUND_LAYERS) expect(layer.depth).toBeGreaterThan(GROUND_DEPTH)
    for (const layer of BACKDROP_LAYERS) expect(layer.depth).toBeLessThanOrEqual(GROUND_DEPTH)
  })

  it('draws every plate at the size it was actually exported at', () => {
    // Not a cosmetic check: `--art` is derived from these numbers, and with it
    // the ground line the Knight's feet land on. A pixel of slack is allowed,
    // because two plates were exported a pixel short of the design size and
    // the box deliberately keeps the design size (see ParallaxLayer.width).
    for (const layer of PARALLAX_LAYERS) {
      const size = PARALLAX_SIZES[layer.file]
      expect(size, `${layer.file} is missing from PARALLAX_SIZES`).toBeDefined()
      expect(Math.abs(layer.width - size!.width), `${layer.file} width`).toBeLessThanOrEqual(2)
      expect(Math.abs(layer.height - size!.height), `${layer.file} height`).toBeLessThanOrEqual(2)
    }
  })

  /**
   * The coverage guarantee, restated as a test.
   *
   * A layer's row is parked with its leading edge just off screen and slides
   * left by `depth × PAN` plate widths. The viewport is never wider than one
   * plate — that is what `--art` is defined to guarantee — so the row has to
   * span at least `1 + depth × PAN` plate widths, or the far edge of the
   * screen shows page background part-way through the walk.
   */
  it('gives every layer enough copies to cover the whole walk', () => {
    for (const layer of PARALLAX_LAYERS) {
      const span = tileCount(layer) * (layer.width / PLATE_WIDTH)
      expect(span, `${layer.file} runs out part-way through the walk`)
        .toBeGreaterThanOrEqual(1 + layer.depth * PAN)
    }
  })

  it('does not pay for copies it cannot use', () => {
    // Each copy is another full-height quad to composite. One spare plate
    // width of slack is the bleed; two means the arithmetic has drifted.
    for (const layer of PARALLAX_LAYERS) {
      const tile = layer.width / PLATE_WIDTH
      const span = tileCount(layer) * tile
      expect(span - (1 + layer.depth * PAN), `${layer.file} carries a wasted copy`)
        .toBeLessThan(tile)
    }
  })

  it('never repeats a plate painted to its edges without mirroring it', () => {
    // `scripts/check-plate-edges.mjs` is the authority; these are the plates
    // it reports as painted out to column 0 or column width - 1, where a plain
    // repeat would cut across the art.
    const edgeToEdge = ['background-far', 'background-2', 'background-1', 'sides-front', 'ground']
    for (const layer of PARALLAX_LAYERS) {
      if (edgeToEdge.includes(layer.file)) expect(layer.repeat).toBe('mirror')
    }
  })

  it('starts the Knight on screen and walks him to the centre', () => {
    expect(KNIGHT_START).toBeGreaterThan(0)
    expect(KNIGHT_START).toBeLessThan(50)
  })

  it('draws the Knight and the bench larger than the artwork alone would', () => {
    // Honest scale makes him about a fifteenth of the screen and he vanishes
    // into the grass; the seat rise is scaled with him so he still sits *in*
    // the bench rather than above it.
    expect(FIGURE_SCALE).toBeGreaterThan(1)
  })
})
