/**
 * The Greenpath scene, layer by layer (SPEC §5.2c, §6.7).
 *
 * ── How the game does it ─────────────────────────────────────────────────────
 * Hollow Knight builds a room out of flat planes at different depths and moves
 * each one *with* the camera by a fraction of the camera's own travel. A plane
 * that moves with the camera at 100% never leaves the screen (the sky); one
 * that does not move at all is the plane the Knight walks on; one that moves
 * *against* the camera rushes past in front of him. There is no perspective
 * projection and no mouse input anywhere in it — the only thing that drives a
 * layer is where the camera is.
 *
 * So that is the only input here too: `--walk`, the scroll. Nothing in this
 * scene reacts to the pointer. An earlier version mixed a little pointer sway
 * into the same transform, and it is exactly what stops the illusion reading
 * as a camera move: the parallax has to belong to the travel, or it belongs to
 * nothing.
 *
 * ── `depth` ──────────────────────────────────────────────────────────────────
 * Expressed as apparent screen speed relative to the ground the Knight walks
 * on, which is 1 by definition. Below 1 is behind him — 0.1 is the far wall of
 * the cavern, barely sliding. Above 1 is in front of the camera: `front-shadows`
 * at 1.75 tears past, which is the single strongest depth cue in the game's own
 * Greenpath rooms.
 *
 * ── Why everything is measured in plate widths ───────────────────────────────
 * The plates are 1366×768 paintings, drawn as one composition and rendered at
 * `--art` — one source pixel in screen units, defined so a plate always covers
 * the viewport (`max(100vw / 1366, 100svh / 768)`). Sizing and travel in plate
 * widths rather than `vw` means the whole scene keeps its proportions on any
 * aspect ratio instead of drifting apart on a wide monitor, and the Knight's
 * feet, the bench's legs and the ground are all locked to the same ruler.
 */

/**
 * How far the ground travels over the walk, in plate widths.
 *
 * At 0.75 the ground moves roughly three quarters of a screen while the Knight
 * crosses a third of one — enough for the layers to genuinely separate. It is
 * also what sets how many tiles each layer needs, so raising it is not free.
 */
export const PAN = 0.75

/**
 * Extra coverage beyond the strict minimum, in plate widths.
 *
 * Without it a layer's leading tile lands exactly on the viewport's edge at
 * `--walk: 0`, and a half-pixel of rounding shows as a sliver of page
 * background down the side of the screen.
 */
const BLEED = 0.08

/** The plates' shared design width, in source pixels. */
export const PLATE_WIDTH = 1366

/** The plates' shared design height, in source pixels. */
export const PLATE_HEIGHT = 768

export interface ParallaxLayer {
  /** File base name under /img/parallax/. */
  file: string
  /** Apparent screen speed, with the ground plane at 1. Larger = nearer. */
  depth: number
  /**
   * The box the plate is drawn into, in source pixels.
   *
   * Usually the plate's own intrinsic size, but not required to be: two of the
   * plates were exported a pixel short of the design size, and rounding a
   * whole layer stack to whatever a single export happened to measure would
   * leave a hairline of page background along one edge. The box is the design
   * size; the `<img>` still declares its true intrinsic size, and stretches by
   * the odd pixel to fill.
   */
  width: number
  height: number
  /**
   * Where the plate's top edge sits, in source pixels from the composition's
   * centre line. Full-height plates are simply centred; a cut-out strip like
   * the ground carries the offset it was cut at, so it lands back exactly
   * where it was painted.
   */
  top: number
  /**
   * How copies of the plate join up.
   *
   * `tile` simply repeats it. That is seamless — and preferable — whenever the
   * plate's left and right columns are transparent, which is true of every
   * layer drawn as separate hanging vines, grass or shadows: the join falls in
   * empty air and there is nothing to line up.
   *
   * `mirror` flips every second copy, so the join repeats its edge column
   * instead of cutting across the art. It is the only option for a plate
   * painted right out to its edges, and the cost is a visible symmetry — which
   * is why it is kept to the far, soft layers where nobody can see it, and
   * never used on the near ones, where a mirrored vine reads as an inkblot.
   */
  repeat: 'tile' | 'mirror'
  /** Idle animation class, if any. */
  motion?: 'glow' | 'sway' | 'float'
}

/**
 * A full-bleed 1366×768 plate, centred.
 *
 * `repeat` is not a taste call: it follows from whether the plate is painted
 * out to its own edges. Run `node scripts/check-plate-edges.mjs` after
 * changing artwork — it reports, per plate, which of the two joins is the
 * seamless one.
 */
const plate = (
  file: string,
  depth: number,
  repeat: ParallaxLayer['repeat'],
  motion?: ParallaxLayer['motion'],
): ParallaxLayer => ({
  file,
  depth,
  width: PLATE_WIDTH,
  height: PLATE_HEIGHT,
  top: -PLATE_HEIGHT / 2,
  repeat,
  ...(motion ? { motion } : {}),
})

/**
 * Back to front — the array is the paint order.
 *
 * `ground` is the cut-down, tileable stretch of the original `platform-1`
 * plate; see `scripts/build-ground-strip.mjs` for why the full plate cannot
 * repeat. It is the only layer at depth 1, and the bench and the Knight are
 * pinned to the same number, so they cannot drift apart.
 */
export const PARALLAX_LAYERS: readonly ParallaxLayer[] = [
  plate('background-far', 0.10, 'mirror'),
  plate('vines-far', 0.22, 'tile'),
  plate('background-2', 0.34, 'mirror'),
  plate('background-1', 0.52, 'mirror'),
  plate('sides-front', 0.68, 'mirror'),
  plate('light-1', 0.78, 'tile', 'glow'),
  plate('lumafly-2', 0.86, 'tile', 'float'),
  plate('vines-mid', 0.93, 'tile'),
  // ── the ground plane: the bench and the Knight are drawn on top of this ──
  // Cut from the middle of the original plate, so both its edges land in the
  // middle of the path and only a mirrored join closes cleanly.
  { file: 'ground', depth: 1, width: 720, height: 157, top: 227, repeat: 'mirror' },
  plate('tall-grass', 1.12, 'tile', 'sway'),
  plate('vines-front', 1.40, 'tile'),
  plate('front-shadows', 1.75, 'tile'),
]

/**
 * How many copies of a plate it takes to keep the viewport covered for the
 * whole walk.
 *
 * A layer's row is parked so its leading edge sits `BLEED` outside the screen
 * at `--walk: 0`, then slides left by `depth * PAN`. The viewport is never
 * wider than one plate (that is what `--art` guarantees), so covering
 * `1 + depth * PAN + BLEED` plate widths covers every frame of the walk.
 *
 * How the copies then join up is the layer's own `repeat` mode; either way
 * they are laid out at the plate's native scale, never stretched to fit.
 */
export function tileCount(layer: ParallaxLayer): number {
  const span = 1 + layer.depth * PAN + BLEED
  return Math.max(1, Math.ceil(span / (layer.width / PLATE_WIDTH)))
}

/** The ground plane, and the depth the bench and the Knight stand at. */
export const GROUND_DEPTH = 1

/**
 * Layers painted behind the Knight, and the ones painted in front of him.
 *
 * The Knight has to be *in* the scene, not on top of it: the grass and the
 * foreground shadows pass between him and the camera. Splitting the table here
 * is what makes that possible without a z-index fight.
 */
export const BACKDROP_LAYERS = PARALLAX_LAYERS.filter(layer => layer.depth <= GROUND_DEPTH)
export const FOREGROUND_LAYERS = PARALLAX_LAYERS.filter(layer => layer.depth > GROUND_DEPTH)

/* ── Landmarks ──────────────────────────────────────────────────────────────
   Measured off the artwork, not found by eye. `GROUND_LINE` is where the
   Knight's feet and the bench's legs land, in source pixels from the
   composition's centre line, consumed as `calc(50% + N * var(--art))`. */

/** Where feet and bench legs land. */
export const GROUND_LINE = 271

/**
 * How far the top of the bench's seat sits above the ground line, in source
 * pixels, at `FIGURE_SCALE: 1`.
 *
 * Derived, not measured twice: the bench crop puts its seat at 58% of its own
 * height and its feet at 86.52%, so the rise is that difference times the
 * crop's 89 source pixels. Scaling the bench therefore scales the seat with
 * it, and the Knight stays sitting *in* the bench rather than above or through
 * it — which is what went wrong the first time these were two independent
 * constants.
 */
export const SEAT_RISE = 26

/**
 * How large the Knight and the bench are drawn, relative to the scenery.
 *
 * At 1 the Knight is 62 source pixels tall — the height of the bench's back,
 * which is how he scales against this artwork in the game. That is honest and
 * far too small to read on a web page, where he ends up about a fifteenth of
 * the screen and disappears into the grass. This lifts both him and the bench
 * together, so they keep their relationship to each other and to the ground
 * line while becoming something you can actually see sitting down.
 */
export const FIGURE_SCALE = 1.35

/**
 * Where the Knight sets off, as a share of the viewport width.
 *
 * He finishes dead centre, on the bench, so this is also how far he advances
 * under his own steam — the world slides `PAN` underneath him on top of it.
 */
export const KNIGHT_START = 14
