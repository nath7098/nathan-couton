import { RAIL_BOUNDS, RAIL_TRAVEL } from '~/composables/useRail'
import { clamp } from '~/utils/math'

/**
 * The contact scene's walk, as one number (SPEC §6.7).
 *
 * `--walk` runs 0 → 1 over the stretch of page scroll where the contact scene
 * travels across the viewport: it opens when the scene's left edge meets the
 * viewport's left edge, and closes when its right edge meets the viewport's
 * right. That is `span - 1` viewports of travel.
 *
 * Both the backdrop and the form panel key off it, and the panel is a parent of
 * neither — custom properties only inherit downwards — so the range is declared
 * once on the scene root and computed here rather than in either component.
 *
 * The bounds come from the rail's own geometry, so re-pacing the site by
 * editing a span in `app/data/scenes.ts` moves the walk with it instead of
 * silently desyncing the Knight from the bench.
 */
export interface ContactWalk {
  /** Rail progress (0 → 1) at which the walk opens. */
  start: number
  /** Rail progress at which it closes. */
  end: number
  /** 1 / (end − start), so CSS can scale without dividing by a variable. */
  scale: number
}

export function contactWalkRange(): ContactWalk {
  const bounds = RAIL_BOUNDS.find(entry => entry.id === 'contact')
  if (!bounds || RAIL_TRAVEL === 0) return { start: 0, end: 1, scale: 1 }

  const start = bounds.start / RAIL_TRAVEL
  const end = Math.min(bounds.end - 1, RAIL_TRAVEL) / RAIL_TRAVEL
  return { start, end, scale: end > start ? 1 / (end - start) : 1 }
}

/**
 * Reads the walk as reactive state.
 *
 * CSS gets the same number from the scroll timeline on path A, which is the one
 * that has to be frame-accurate. This is for the decisions CSS cannot make —
 * chiefly whether the Knight has arrived and should be sitting.
 */
export function useContactWalk() {
  const rail = useRail()
  const range = contactWalkRange()

  const walk = computed(() => clamp((rail.progress.value - range.start) * range.scale))

  /**
   * True once the Knight reaches the bench. A discrete swap, so it is driven
   * from JS on both rail paths: a frame of lag on a state change nobody can
   * perceive beats keeping two animation systems in step.
   */
  const arrived = computed(() => walk.value >= 0.985)

  return { range, walk, arrived }
}
