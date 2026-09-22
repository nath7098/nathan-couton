import { describe, expect, it } from 'vitest'
import {
  BACKDROP_LAYERS,
  BLEED,
  FIGURE_SCALE,
  FOREGROUND_LAYERS,
  GROUND_DEPTH,
  GROUND_LINE,
  KNIGHT_START,
  PAN,
  PARALLAX_LAYERS,
  PLATE_HEIGHT,
  PLATE_WIDTH,
  WIDEST_ASPECT,
  tileCount,
} from '~/data/parallax'
import { CUTS, PLATE_HEIGHT as CUT_HEIGHT } from '../../scripts/build-cave-layers.mjs'
import { PARALLAX_SIZES } from '~/data/parallax-sizes'

describe('the cave layer stack', () => {
  it('is ordered back to front — the array is the paint order', () => {
    const depths = PARALLAX_LAYERS.map(layer => layer.depth)
    expect(depths).toEqual([...depths].sort((a, b) => a - b))
  })

  it('puts the floor and the things standing on it on one plane', () => {
    // Two layers share the ground's depth: the rock, and the lamp posts that
    // stand on it. That is the point — a post travelling at anything other
    // than the floor's speed walks along the ground it is planted in.
    const ground = PARALLAX_LAYERS.filter(layer => layer.depth === GROUND_DEPTH)
    expect(ground.map(layer => layer.file)).toEqual(['cave-ground', 'cave-lamps'])
  })

  it('hangs the lanterns at the roof’s own speed', () => {
    // Same rule, the other way up: a lantern hangs off the roof, and at any
    // other depth it parts company with the stem it hangs by.
    const roof = PARALLAX_LAYERS.find(layer => layer.file === 'cave-roof')!
    const lanterns = PARALLAX_LAYERS.find(layer => layer.file === 'cave-lanterns')!
    expect(lanterns.depth).toBe(roof.depth)
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
    // the ground line the Knight's feet land on. A pixel of slack is allowed
    // against rounding in the encoders (see ParallaxLayer.width).
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
   * left by `depth × PAN` viewport widths, so it has to span at least
   * `1 + depth × PAN` screens or the far edge shows page background part-way
   * through the walk. How many screens a plate is worth depends on the shape
   * of the display; the guarantee is written against the widest one.
   */
  const plateScreens = (layer: { width: number }) =>
    (layer.width / PLATE_HEIGHT) / WIDEST_ASPECT

  it('gives every layer enough copies to cover the whole walk', () => {
    for (const layer of PARALLAX_LAYERS) {
      const span = tileCount(layer) * plateScreens(layer)
      expect(span, `${layer.file} runs out part-way through the walk`)
        .toBeGreaterThanOrEqual(1 + layer.depth * PAN)
    }
  })

  it('does not pay for copies it cannot use', () => {
    // Each copy is another full-height quad to composite, so the count has to
    // be the smallest one that covers the walk: drop a plate and the layer
    // must fall short. Stated that way rather than as a slack budget, because
    // a budget that leaves out the bleed condemns a copy that is genuinely
    // needed — `cave-front` clears two plates by two hundredths of a screen.
    for (const layer of PARALLAX_LAYERS) {
      const needed = 1 + layer.depth * PAN + BLEED
      const tiles = tileCount(layer)
      expect((tiles - 1) * plateScreens(layer), `${layer.file} carries a wasted copy`)
        .toBeLessThan(needed)
    }
  })

  it('agrees with the script that cut the plates', () => {
    // `build-cave-layers.mjs` measures the ground line in the painting's own
    // rows, before it pads the plate; this file carries it as an offset from
    // the padded plate's centre. They are the same fact twice, and the scene
    // puts the Knight's feet on whichever one is wrong.
    expect(CUT_HEIGHT).toBe(PLATE_HEIGHT)
    expect(CUTS.groundLine + CUTS.pad - PLATE_HEIGHT / 2).toBe(GROUND_LINE)
    expect(PLATE_WIDTH / PLATE_HEIGHT).toBeGreaterThan(WIDEST_ASPECT)
  })

  it('never repeats a plate painted to its edges without mirroring it', () => {
    // `scripts/check-plate-edges.mjs` is the authority; these are the plates
    // it reports as painted out to column 0 or column width - 1, where a plain
    // repeat would cut across the art.
    const edgeToEdge = ['cave-back', 'cave-pillars', 'cave-ground', 'cave-front']
    for (const layer of PARALLAX_LAYERS) {
      if (edgeToEdge.includes(layer.file)) expect(layer.repeat).toBe('mirror')
    }
  })

  it('starts the Knight on screen and walks him to the centre', () => {
    expect(KNIGHT_START).toBeGreaterThan(0)
    expect(KNIGHT_START).toBeLessThan(50)
  })

  it('keeps the Knight a readable size against this plate', () => {
    // The figures are drawn in their own source pixels times FIGURE_SCALE
    // times `--art`, and `--art` is about twice as large against this plate as
    // the Greenpath ones, so the scale that suited those would draw him twice
    // too big. What matters is the product: about a ninth of the screen.
    const knightHeight = 62 * FIGURE_SCALE / PLATE_HEIGHT
    expect(knightHeight).toBeGreaterThan(0.07)
    expect(knightHeight).toBeLessThan(0.16)
  })
})
