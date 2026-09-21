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
}

export const SCENES: readonly SceneMeta[] = [
  { id: 'home', span: 1, labelKey: 'navigation.home' },
  { id: 'about', span: 1.5, labelKey: 'navigation.about' },
  { id: 'experience', span: 2, labelKey: 'navigation.experience' },
  { id: 'skills', span: 1.5, labelKey: 'navigation.skills' },
  { id: 'education', span: 1, labelKey: 'navigation.education' },
  { id: 'projects', span: 2.5, labelKey: 'navigation.projects' },
  { id: 'contact', span: 2, labelKey: 'navigation.contact' },
] as const

export const TOTAL_SPAN = SCENES.reduce((sum, scene) => sum + scene.span, 0)

export function isSceneId(value: string): value is SceneId {
  return (SCENE_IDS as readonly string[]).includes(value)
}
