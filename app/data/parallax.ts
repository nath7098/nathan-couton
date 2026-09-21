/**
 * The Hollow Knight scene, layer by layer (SPEC §5.2c).
 *
 * v1 drove fifteen layers by writing `style.marginTop` on each one, every
 * scroll event. Here each layer declares a depth and the CSS does the rest:
 * negative trails the rail, positive leads it.
 *
 * Order is back to front — the array is the paint order.
 */
export interface ParallaxLayer {
  /** File base name under /img/parallax/. */
  file: string
  /** −1 → 1. */
  depth: number
  /** Extra scale applied across the scene's sweep. */
  scaleWith?: number
  /** Idle animation class, if any. */
  motion?: 'glow' | 'sway' | 'float'
  /** Layers below this one in the stack sit behind the content. */
  className?: string
}

export const PARALLAX_LAYERS: readonly ParallaxLayer[] = [
  { file: 'background-far', depth: -0.05, scaleWith: 0.04 },
  { file: 'vines-far', depth: -0.10, scaleWith: -0.06 },
  { file: 'background-2', depth: -0.15 },
  { file: 'background-1', depth: -0.25 },
  { file: 'sides-front', depth: -0.30, scaleWith: 0.02 },
  { file: 'vines-mid', depth: -0.40, scaleWith: 0.05 },
  { file: 'vines-front', depth: -0.60, scaleWith: 0.18 },
  { file: 'light-1', depth: 0.20, motion: 'glow' },
  { file: 'tall-grass', depth: 0.35, motion: 'sway' },
  { file: 'platform-1', depth: 0.30 },
  { file: 'town-bench-1', depth: 0.30 },
  { file: 'front-shadows', depth: 0.45 },
  { file: 'lumafly-2', depth: 0.55, motion: 'float' },
]
