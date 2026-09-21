/**
 * The Hollow Knight scene, layer by layer (SPEC §5.2c, §6.7).
 *
 * v1 scrolled vertically and drove fifteen layers by writing `style.marginTop`
 * on each one, every scroll event. v2 scrolls sideways, so the metaphor changed
 * with it: the contact scene is now a stretch of the world the Knight *walks
 * across*. The camera holds still, the world slides left, and how fast a layer
 * slides is what puts it near or far.
 *
 * `shift` is that speed, expressed as the distance in vw the layer travels over
 * the whole walk (`--walk` 0 → 1). Everything is negative — the world always
 * moves left while the Knight heads right — so only the magnitude matters:
 * 4vw reads as the far horizon, 36vw as grass brushing past the camera.
 *
 * The ground layers share `STAGE_SHIFT` exactly. The bench is planted on that
 * ground and the Knight walks on it, so any drift between them would show up as
 * the Knight sitting *beside* the bench. They are not tuned independently.
 *
 * Order is back to front — the array is the paint order.
 */

/**
 * How far the ground travels over the walk, in vw.
 *
 * The bench, the Knight and the grass are all pinned to this number; see
 * `NcHollowScene` for the arithmetic that lands the Knight on the bench.
 */
export const STAGE_SHIFT = 30

export interface ParallaxLayer {
  /** File base name under /img/parallax/. */
  file: string
  /** Distance travelled over the full walk, in vw. Larger = nearer the camera. */
  shift: number
  /**
   * How the layer covers the extra width its own travel exposes.
   *
   * `widen` stretches the box by the shift and lets `object-fit: cover` re-crop
   * it — cheap, one quad, but it zooms the art by that much. Fine while the
   * shift is small or the layer is a soft glow nobody can measure.
   *
   * `mirror` paints the plate twice, the second flipped. A mirrored join is
   * seamless by construction (the edge column is simply repeated), and it keeps
   * the art at its native scale — which matters for the layers that still read
   * as drawn shapes. Costs a second quad.
   */
  cover: 'widen' | 'mirror'
  /** Idle animation class, if any. */
  motion?: 'glow' | 'sway' | 'float'
}

export const PARALLAX_LAYERS: readonly ParallaxLayer[] = [
  { file: 'background-far', shift: 4, cover: 'widen' },
  { file: 'vines-far', shift: 7, cover: 'widen' },
  { file: 'background-2', shift: 10, cover: 'widen' },
  { file: 'background-1', shift: 15, cover: 'widen' },
  { file: 'sides-front', shift: 19, cover: 'widen' },
  { file: 'light-1', shift: 22, cover: 'widen', motion: 'glow' },
  { file: 'lumafly-2', shift: 24, cover: 'widen', motion: 'float' },
  { file: 'vines-mid', shift: 26, cover: 'mirror' },
  // ── the ground plane: the bench and the Knight are drawn between these two ──
  { file: 'platform-1', shift: STAGE_SHIFT, cover: 'mirror' },
  { file: 'tall-grass', shift: STAGE_SHIFT, cover: 'mirror', motion: 'sway' },
  { file: 'vines-front', shift: 34, cover: 'mirror' },
  { file: 'front-shadows', shift: 36, cover: 'mirror' },
]

/**
 * Layers painted behind the Knight, and the ones painted in front of him.
 *
 * The Knight has to be *in* the scene, not on top of it: the grass and the
 * foreground shadows pass between him and the camera. Splitting the table here
 * is what makes that possible without a z-index fight.
 */
export const BACKDROP_LAYERS = PARALLAX_LAYERS.filter(layer => layer.shift <= STAGE_SHIFT
  && layer.file !== 'tall-grass')

export const FOREGROUND_LAYERS = PARALLAX_LAYERS.filter(layer => !BACKDROP_LAYERS.includes(layer))
