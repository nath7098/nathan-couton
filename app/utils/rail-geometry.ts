import type { SceneId, SceneMeta } from '~/data/scenes'
import { clamp, normalize } from '~/utils/math'

/**
 * Geometry of the horizontal rail — pure functions, no DOM.
 *
 * The model, in units where 1 = one viewport width:
 *
 *   - scene `i` is `span_i` wide and sits at offset `cum_i` inside the track
 *   - the track is `TOTAL_SPAN` wide, so it travels `TOTAL_SPAN - 1`
 *   - the scroll proxy is `TOTAL_SPAN` viewport-heights tall, so it scrolls
 *     `TOTAL_SPAN - 1` viewport-heights
 *   - translation is linear in scroll progress
 *
 * Span therefore does double duty: it is both how wide a scene is and how much
 * scrolling it costs, which keeps the travel speed constant across the site.
 */

export interface SceneBounds {
  id: SceneId
  /** Offset of the scene's left edge inside the track, in viewport widths. */
  start: number
  /** Offset of the scene's right edge, in viewport widths. */
  end: number
  span: number
}

export function sceneBounds(scenes: readonly SceneMeta[]): SceneBounds[] {
  let cursor = 0
  return scenes.map((scene) => {
    const bounds = { id: scene.id, start: cursor, end: cursor + scene.span, span: scene.span }
    cursor += scene.span
    return bounds
  })
}

/** Total travel of the track, in viewport widths. Zero when a single scene fills it. */
export function travel(totalSpan: number): number {
  return Math.max(totalSpan - 1, 0)
}

/** Rail progress (0→1) that lines a scene's left edge up with the viewport's. */
export function progressForScene(bounds: SceneBounds[], id: SceneId, totalSpan: number): number {
  const scene = bounds.find(b => b.id === id)
  const distance = travel(totalSpan)
  if (!scene || distance === 0) return 0
  return clamp(scene.start / distance)
}

/**
 * Scene whose centre sits closest to the viewport's centre.
 * Ties go to the earlier scene, which keeps the nav stable while scrolling back.
 */
export function activeSceneAt(bounds: SceneBounds[], progress: number, totalSpan: number): SceneId {
  const translated = progress * travel(totalSpan)
  let best = bounds[0]!
  let bestDistance = Number.POSITIVE_INFINITY

  for (const scene of bounds) {
    const centre = scene.start + scene.span / 2 - translated
    const distance = Math.abs(centre - 0.5)
    if (distance < bestDistance - 1e-9) {
      best = scene
      bestDistance = distance
    }
  }
  return best.id
}

/**
 * Progress of one scene across the viewport: 0 as its left edge enters from the
 * right, 1 as its right edge leaves on the left. The horizontal equivalent of a
 * CSS view-timeline.
 */
export function sceneProgressAt(bounds: SceneBounds[], id: SceneId, progress: number, totalSpan: number): number {
  const scene = bounds.find(b => b.id === id)
  if (!scene) return 0
  const translated = progress * travel(totalSpan)
  return normalize(translated, scene.start - 1, scene.end)
}
