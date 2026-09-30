import { clamp, normalize } from '~/utils/math'

/**
 * Geometry of the finale — pure functions, no DOM.
 *
 * The finale is a tall section with a sticky stage inside it. While the stage
 * is pinned, the section's extra height is scroll that moves nothing on the
 * page and is spent entirely on the scene. That budget is split into four
 * consecutive segments, in viewport heights:
 *
 *   run   `$ npm run contact` types itself out in the terminal
 *   open  the terminal's shutters slide apart onto Greenpath
 *   walk  the Knight crosses the scene and sits on the bench
 *   hold  he stays seated, the form is there, nothing else moves
 *
 * This replaces the rail's `WALK_SPAN` / `splitScroll()` pair. The walk used to
 * be the scroll left over once a horizontal track had parked; it is now a
 * segment of one section's own timeline, so it no longer depends on how tall
 * the rest of the document happens to be in this language, at this width.
 *
 * Nothing here is cancelled or compensated: the stage is pinned by `sticky`,
 * and only the scene's own layers move — the invariant the rail version paid
 * for once already (see HANDOFF, "contre-transformation").
 */
export const FINALE_SEGMENTS = {
  run: 0.45,
  open: 0.55,
  // Was 2.5 viewports on the rail — long enough that the form was visible on
  // one screenshot out of thirty-one. The Knight covers the same ground on
  // screen; he just does it in half the scroll.
  walk: 1.25,
  hold: 0.4,
} as const

export type FinaleSegment = keyof typeof FINALE_SEGMENTS

export type FinaleSegments = Record<FinaleSegment, number>

/**
 * Below `--stage-wide` there is no walk: the stage still pins for the terminal
 * and its shutters, and opens on the Knight already sitting on his bench. The
 * form follows the stage in the flow rather than arriving over it — a phone's
 * keyboard and a pinned box do not get along.
 */
export const FINALE_SEGMENTS_NARROW: FinaleSegments = {
  run: 0.45,
  open: 0.55,
  walk: 0,
  hold: 0.35,
}

/** Scroll a set of segments consumes, in viewport heights. */
export function segmentsSpan(segments: FinaleSegments): number {
  return segments.run + segments.open + segments.walk + segments.hold
}

/** Scroll the pinned stage consumes on a wide screen, in viewport heights. */
export const FINALE_SPAN = segmentsSpan(FINALE_SEGMENTS)
export const FINALE_SPAN_NARROW = segmentsSpan(FINALE_SEGMENTS_NARROW)

export interface FinaleMarks {
  /** Fractions of the pinned range, 0 → 1, where each segment starts. */
  runFrom: number
  openFrom: number
  walkFrom: number
  walkTo: number
}

export function finaleMarks(segments: FinaleSegments = FINALE_SEGMENTS): FinaleMarks {
  const total = segmentsSpan(segments)
  if (total === 0) return { runFrom: 0, openFrom: 0, walkFrom: 0, walkTo: 0 }
  const openFrom = segments.run / total
  const walkFrom = (segments.run + segments.open) / total
  const walkTo = (segments.run + segments.open + segments.walk) / total
  return { runFrom: 0, openFrom, walkFrom, walkTo }
}

export interface FinaleSplit {
  run: number
  open: number
  walk: number
}

/**
 * Splits progress through the pinned range (0 → 1) into each segment's own
 * 0 → 1. Segments are consecutive, so at most one of them is strictly between
 * 0 and 1 at any time.
 */
export function splitFinale(progress: number, marks = finaleMarks()): FinaleSplit {
  const p = clamp(progress)
  return {
    run: marks.openFrom === 0 ? 1 : normalize(p, 0, marks.openFrom),
    open: normalize(p, marks.openFrom, marks.walkFrom),
    walk: normalize(p, marks.walkFrom, marks.walkTo),
  }
}

/**
 * Progress through the pinned range for a given document scroll position.
 *
 * `top` is the finale's offset from the top of the document and `height` its
 * box height, both in pixels; `viewport` is the viewport's height. The stage
 * is pinned from `top` until `top + height - viewport`.
 */
export function finaleProgress(scrollY: number, top: number, height: number, viewport: number): number {
  const range = height - viewport
  if (range <= 0) return scrollY >= top ? 1 : 0
  return normalize(scrollY, top, top + range)
}

/** Document scroll position at which the pinned range reaches `fraction`. */
export function scrollForFinale(fraction: number, top: number, height: number, viewport: number): number {
  return top + clamp(fraction) * Math.max(height - viewport, 0)
}
