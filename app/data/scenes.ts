/**
 * The seven scenes of the rail, in order (SPEC §6).
 *
 * `span` is how many viewports of scroll a scene consumes — dense scenes earn
 * more travel than a hero. The rail derives the scroll proxy height from the
 * sum, so changing a span here is all it takes to re-pace the site.
 */
export const SCENE_IDS = [
  'home',
  'about',
  'experience',
  'skills',
  'education',
  'projects',
  'contact',
] as const

export type SceneId = (typeof SCENE_IDS)[number]

export interface SceneMeta {
  id: SceneId
  /** Viewports of scroll travel. See SPEC §3.1. */
  span: number
  /** i18n key for the nav label, under `navigation.*`. */
  labelKey: string
  /** Particle preset for this scene's backdrop. See SPEC §5.3. */
  particles: 'code-rain' | 'dust' | 'constellation' | 'embers' | 'grid-pulse' | 'spores'
  /**
   * The scene paints its own edge-to-edge artwork and wants the whole
   * viewport: no gutter, no padding for the header or the nav, and the numbered
   * title becomes screen-reader-only rather than a row of the layout.
   */
  fullBleed?: boolean
}

export const SCENES: readonly SceneMeta[] = [
  { id: 'home', span: 1, labelKey: 'navigation.home', particles: 'code-rain' },
  { id: 'about', span: 1.5, labelKey: 'navigation.about', particles: 'dust' },
  { id: 'experience', span: 2, labelKey: 'navigation.experience', particles: 'embers' },
  { id: 'skills', span: 1.5, labelKey: 'navigation.skills', particles: 'constellation' },
  { id: 'education', span: 1, labelKey: 'navigation.education', particles: 'dust' },
  { id: 'projects', span: 2.5, labelKey: 'navigation.projects', particles: 'grid-pulse' },
  // One viewport, like most of the rail. The Knight's walk is *not* paid for
  // out of the track's travel any more — it runs on the extra scroll that
  // `WALK_SPAN` adds after the track parks, which is what lets the scene hold
  // perfectly still while he crosses it. See `app/utils/rail-geometry.ts`.
  { id: 'contact', span: 1, labelKey: 'navigation.contact', particles: 'spores', fullBleed: true },
] as const

export const TOTAL_SPAN = SCENES.reduce((sum, scene) => sum + scene.span, 0)

export function isSceneId(value: string): value is SceneId {
  return (SCENE_IDS as readonly string[]).includes(value)
}
