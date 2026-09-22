/**
 * The cave, layer by layer (SPEC §5.2c, §6.7).
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
 * ── The plates ───────────────────────────────────────────────────────────────
 * Every plate below is cut out of one painting by
 * `scripts/build-cave-layers.mjs`, which is where the seams, thresholds and
 * measurements live. Cutting one image rather than stacking separately-rendered
 * ones is what guarantees the layers line up: they are the same pixels.
 *
 * The plate is a panorama — 1672×284, very nearly six to one — so unlike the
 * old square-ish Greenpath plates it is pinned to the viewport by its *height*.
 * `--art` is still `max(100vw / W, 100svh / H)`, but on any viewport narrower
 * than 5.9∶1 it is the height term that wins, and the plate lands two to three
 * screens wide. That is what makes the pan cheap: most layers never need a
 * second copy.
 *
 * ── `depth` ──────────────────────────────────────────────────────────────────
 * Expressed as apparent screen speed relative to the ground the Knight walks
 * on, which is 1 by definition. Below 1 is behind him — 0.1 is the far wall of
 * the cavern, barely sliding. Above 1 is in front of the camera: `cave-front`
 * at 1.9 tears past, which is the single strongest depth cue in the game's own
 * rooms.
 *
 * Two pairs share a depth on purpose. A lamp post stands on the floor and a
 * lantern hangs off the roof, so each travels at the speed of the thing holding
 * it up — otherwise the post walks along the ground it stands on and the
 * lantern parts company with its own stem. Sharing a depth costs nothing (the
 * layer is then just a slot in the paint order) and buys each set of fixtures
 * an idle animation of its own.
 */

/**
 * How far the ground travels over the walk, in viewport widths.
 *
 * Measured on screen rather than in plate widths, which is a change from the
 * Greenpath plates and a necessary one: those were viewport-shaped, so a
 * fraction of a plate was a fraction of a screen on every display. This plate
 * is six to one and pinned by its height, so a plate width is two screens on a
 * monitor and thirteen on a phone held upright — a constant expressed in them
 * would mean something different on every device. The Knight's own advance is
 * already in viewport widths; now the world he walks through is too.
 */
export const PAN = 0.75

/**
 * Extra coverage beyond the strict minimum, in viewport widths.
 *
 * Without it a layer's leading tile lands exactly on the viewport's edge at
 * `--walk: 0`, and a half-pixel of rounding shows as a sliver of page
 * background down the side of the screen.
 */
export const BLEED = 0.08

/** The plates' shared design width, in source pixels. */
export const PLATE_WIDTH = 1672

/**
 * The plates' shared design height, in source pixels.
 *
 * The painting's own 284 rows plus the 50 of its own edge that
 * `build-cave-layers.mjs` adds above and below it — see `CUTS.pad` there for
 * why. A unit test holds the two numbers together; if they drift the Knight's
 * feet leave the floor.
 */
export const PLATE_HEIGHT = 384

/**
 * The widest display `tileCount` promises to cover, as an aspect ratio.
 *
 * A plate is `PLATE_WIDTH / PLATE_HEIGHT / aspect` viewport widths across, so
 * how many copies a layer needs depends on the shape of the screen — the wider
 * the display, the fewer screens one plate spans. 32∶9 is the widest panel sold;
 * everything narrower than it gets the same tiles and simply parks the spare
 * copy further off screen.
 */
export const WIDEST_ASPECT = 32 / 9

export interface ParallaxLayer {
  /** File base name under /img/parallax/. */
  file: string
  /** Apparent screen speed, with the ground plane at 1. Larger = nearer. */
  depth: number
  /**
   * The box the plate is drawn into, in source pixels.
   *
   * Every plate out of `build-cave-layers.mjs` is the full 1672×284, because
   * they are all cut from the same frame; the field stays because the `<img>`
   * still declares its intrinsic size and the layout is written in these units.
   */
  width: number
  height: number
  /**
   * Where the plate's top edge sits, in source pixels from the composition's
   * centre line. Full-height plates are simply centred.
   */
  top: number
  /**
   * How copies of the plate join up.
   *
   * `tile` simply repeats it. That is seamless — and preferable — whenever the
   * plate's left and right columns are transparent, which is true of every
   * layer cut as a silhouette: the join falls in empty air and there is nothing
   * to line up.
   *
   * `mirror` flips every second copy, so the join repeats its edge column
   * instead of cutting across the art. It is the only option for a plate
   * painted right out to its edges — the floor, the haze, and the pillars,
   * whose outermost two are halves of pillars the painting cuts off and which a
   * mirrored join puts back together.
   *
   * This is not a taste call: run `node scripts/check-plate-edges.mjs`, which
   * reports per plate which of the two joins is the seamless one.
   */
  repeat: 'tile' | 'mirror'
  /** Idle animation class, if any. */
  motion?: 'glow' | 'sway' | 'float'
}

/** A full-bleed plate, centred. */
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
 * `cave-ground` is the only layer at depth 1, and the bench and the Knight are
 * pinned to the same number, so they cannot drift apart.
 */
export const PARALLAX_LAYERS: readonly ParallaxLayer[] = [
  plate('cave-back', 0.10, 'mirror'),
  plate('cave-roof-far', 0.48, 'tile'),
  plate('cave-pillars', 0.66, 'mirror'),
  // ── the ground plane: the bench and the Knight are drawn on top of this ──
  plate('cave-ground', 1.00, 'mirror'),
  plate('cave-lamps', 1.00, 'tile', 'glow'),
  plate('cave-roof', 1.55, 'tile'),
  plate('cave-lanterns', 1.55, 'tile', 'float'),
  plate('cave-front', 1.90, 'mirror'),
]

/**
 * How many copies of a plate it takes to keep the viewport covered for the
 * whole walk.
 *
 * A layer's row is parked so its leading edge sits `BLEED` outside the screen
 * at `--walk: 0`, then slides left by `depth × PAN` viewport widths. So it has
 * to span `1 + depth × PAN + BLEED` screens, and a plate is worth
 * `PLATE_WIDTH / PLATE_HEIGHT / WIDEST_ASPECT` of them on the widest display
 * this promises to cover.
 *
 * How the copies then join up is the layer's own `repeat` mode; either way they
 * are laid out at the plate's native scale, never stretched to fit.
 */
export function tileCount(layer: ParallaxLayer): number {
  const screens = 1 + layer.depth * PAN + BLEED
  const perPlate = (layer.width / PLATE_HEIGHT) / WIDEST_ASPECT
  return Math.max(1, Math.ceil(screens / perPlate))
}

/** The ground plane, and the depth the bench and the Knight stand at. */
export const GROUND_DEPTH = 1

/**
 * Layers painted behind the Knight, and the ones painted in front of him.
 *
 * The Knight has to be *in* the scene, not on top of it: the roof and the
 * foreground rock pass between him and the camera. Splitting the table here is
 * what makes that possible without a z-index fight. `cave-lamps` sits at the
 * ground's own depth and so falls on the far side of the split — which is
 * right: he walks past the posts, not behind them.
 */
export const BACKDROP_LAYERS = PARALLAX_LAYERS.filter(layer => layer.depth <= GROUND_DEPTH)
export const FOREGROUND_LAYERS = PARALLAX_LAYERS.filter(layer => layer.depth > GROUND_DEPTH)

/* ── Landmarks ──────────────────────────────────────────────────────────────
   Measured off the artwork, not found by eye. `GROUND_LINE` is where the
   Knight's feet and the bench's legs land, in source pixels from the
   composition's centre line, consumed as `calc(50% + N * var(--art))`. */

/**
 * Where feet and bench legs land.
 *
 * The row darkness profile jumps from 11% to 64% across rows 204..233 as the
 * rock comes up; 222 is the crossing, and the plate's centre line is 142, so
 * the ground sits 80 source pixels below it. `CUTS.groundLine` in
 * `build-cave-layers.mjs` is the same measurement in the plate's own
 * coordinates, and the unit tests check the two still agree.
 */
export const GROUND_LINE = 80

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
 * The figures are sized in their own source pixels times `FIGURE_SCALE` times
 * `--art`, so this number only means anything next to the plate it scales
 * against. This plate is half the height of the Greenpath ones, so `--art` is
 * about twice as large on the same screen, and the 1.35 that suited those
 * plates would now draw a Knight twice too big. What matters is the product:
 * 62 × 0.68 of a 384-row plate puts him at roughly a ninth of the screen —
 * the same size he read at before, against scenery lit and scaled quite
 * differently.
 */
export const FIGURE_SCALE = 0.68

/**
 * Where the Knight sets off, as a share of the viewport width.
 *
 * He finishes dead centre, on the bench, so this is also how far he advances
 * under his own steam — the world slides `PAN` underneath him on top of it.
 */
export const KNIGHT_START = 14
