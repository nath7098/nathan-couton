/**
 * The page, in order.
 *
 * « Code vertical, monde horizontal » : the first five sections are an ordinary
 * document that scrolls down like a file, so a recruiter can skim it, search
 * it with Ctrl+F and never meet content clipped at the edge of a screen. The
 * last one is the finale — pinned, sideways, the Knight crossing Greenpath —
 * and the switch of axis is the moment the page stops being code and starts
 * being a world.
 *
 * Structure lives here; the words (nav label, title, file name) live in the
 * locale files under `sections.<id>`.
 */
export const SECTION_IDS = ['home', 'about', 'parcours', 'skills', 'projects', 'contact'] as const

export type SectionId = (typeof SECTION_IDS)[number]

export interface SectionMeta {
  id: SectionId
  /**
   * How much of the {{ }} scaffolding is left on this section's title, 1 → 0.
   * The page "compiles" as it goes down: the braces fade section by section
   * and are gone by the time the finale — the running program — arrives.
   */
  code: number
  /** Listed in the header navigation. The hero is reached by the brand. */
  nav: boolean
  /**
   * `split` puts the title in a sticky column beside a long, narrow content
   * (a history, a list): the width a reading measure leaves empty is where the
   * section keeps its bearings. `stack` is title above, content full width.
   */
  layout: 'split' | 'stack'
}

export const SECTIONS: readonly SectionMeta[] = [
  { id: 'home', code: 1, nav: false, layout: 'stack' },
  { id: 'about', code: 0.9, nav: true, layout: 'stack' },
  { id: 'parcours', code: 0.75, nav: true, layout: 'split' },
  { id: 'skills', code: 0.55, nav: true, layout: 'split' },
  { id: 'projects', code: 0.35, nav: true, layout: 'stack' },
  { id: 'contact', code: 0, nav: true, layout: 'stack' },
]

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value)
}

/**
 * Anchors that existed before the page was reorganised, and where they now
 * lead. Experience and education became one `git log` — the Parcours.
 *
 * Read by the inline script in app.vue before Nuxt boots, so a shared link to
 * `/#experience` lands where it should rather than at the top of the page.
 */
export const LEGACY_HASHES: Readonly<Record<string, SectionId>> = {
  experience: 'parcours',
  education: 'parcours',
}

/**
 * The v1 site's paths, which are indexed and must keep answering, as 301s onto
 * the matching section. Imported by nuxt.config.ts — keep this file free of
 * Nuxt auto-imports.
 */
export const LEGACY_PATHS: Readonly<Record<string, string>> = {
  about: 'about',
  experience: 'parcours',
  skills: 'skills',
  education: 'parcours',
  projects: 'projects',
  contact: 'contact',
}
