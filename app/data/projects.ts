import type { Tag } from './types'
import type { MotifKey } from '~/utils/project-motifs'

export interface ProjectLink {
  href: string
  kind: 'repo' | 'live'
}

export interface Project {
  id: string
  /** Which figure the card draws above its title. See `project-motifs.ts`. */
  motif: MotifKey
  titleKey: string
  descriptionKey: string
  /** i18n keys for the three labelled rows. The year is translated too: a
      running mission reads "2025 - aujourd'hui", not a number. */
  yearKey: string
  contextKey: string
  roleKey: string
  tags: Tag[]
  links: ProjectLink[]
  group: 'main' | 'other'
}

/**
 * The eight projects of v1, same order, same links, plus the current mission.
 *
 * `image` and `altKey` are gone. Every project used to ship a 1355×678 PNG of
 * two colour blocks and a ringed circle repeating the title; the cards now draw
 * a figure from `motif` instead, and the seven files left the repository.
 */
export const PROJECTS: readonly Project[] = [
  {
    id: 'integration',
    motif: 'flow',
    titleKey: 'projects[0].title',
    descriptionKey: 'projects[0].description',
    yearKey: 'projects[0].year',
    contextKey: 'projects[0].context',
    roleKey: 'projects[0].role',
    tags: [
      { label: 'Java 21', tech: 'java' },
      { label: 'Spring Boot', tech: 'spring' },
      { label: 'Spring Batch', tech: 'spring' },
      { label: 'Angular', tech: 'angular' },
    ],
    links: [],
    group: 'main',
  },
  {
    id: 'prevoyance',
    motif: 'layers',
    titleKey: 'projects[1].title',
    descriptionKey: 'projects[1].description',
    yearKey: 'projects[1].year',
    contextKey: 'projects[1].context',
    roleKey: 'projects[1].role',
    tags: [
      { label: 'Vue 2', tech: 'vue' },
      { label: 'Ts', tech: 'ts' },
      { label: 'VueX', tech: 'vuex' },
      { label: 'Java', tech: 'java' },
    ],
    links: [],
    group: 'main',
  },
  {
    id: 'portfolio',
    motif: 'stream',
    titleKey: 'projects[2].title',
    descriptionKey: 'projects[2].description',
    yearKey: 'projects[2].year',
    contextKey: 'projects[2].context',
    roleKey: 'projects[2].role',
    tags: [
      { label: 'Vue 3', tech: 'vue' },
      { label: 'Vite', tech: 'vite' },
      { label: 'Pinia', tech: 'pinia' },
      { label: 'Express', tech: 'express' },
    ],
    links: [{ href: 'https://gitlab.com/nath7098/personal-website', kind: 'repo' }],
    group: 'main',
  },
  {
    id: 'tsp',
    motif: 'tour',
    titleKey: 'projects[3].title',
    descriptionKey: 'projects[3].description',
    yearKey: 'projects[3].year',
    contextKey: 'projects[3].context',
    roleKey: 'projects[3].role',
    tags: [
      { label: 'JQuery', tech: 'jquery' },
      { label: 'p5', tech: 'p5' },
      { label: 'Bootstrap', tech: 'bootstrap' },
    ],
    links: [
      { href: 'https://gitlab.com/nath7098/projet-libre', kind: 'repo' },
      { href: 'https://nath7098.gitlab.io/projet-libre/html/', kind: 'live' },
    ],
    group: 'main',
  },
  {
    id: 'hololens',
    motif: 'cloud',
    titleKey: 'projects[4].title',
    descriptionKey: 'projects[4].description',
    yearKey: 'projects[4].year',
    contextKey: 'projects[4].context',
    roleKey: 'projects[4].role',
    tags: [
      { label: 'Unity', tech: 'unity' },
      { label: 'C#', tech: 'csharp' },
      { label: 'C++', tech: 'cpp' },
    ],
    links: [
      { href: 'https://gitlab.com/nath7098/hololenscamerastreamtopointcloud', kind: 'repo' },
      { href: 'https://hololens.nathancouton.fr', kind: 'live' },
    ],
    group: 'main',
  },
  {
    id: 'moneybox',
    motif: 'coins',
    titleKey: 'other[0].title',
    descriptionKey: 'other[0].description',
    yearKey: 'other[0].year',
    contextKey: 'other[0].context',
    roleKey: 'other[0].role',
    tags: [
      { label: 'Angular', tech: 'angular' },
      { label: 'Java', tech: 'java' },
      { label: 'Bootstrap', tech: 'bootstrap' },
      { label: 'Agile', tech: 'agile' },
    ],
    links: [],
    group: 'other',
  },
  {
    id: 'swallowin',
    motif: 'wave',
    titleKey: 'other[1].title',
    descriptionKey: 'other[1].description',
    yearKey: 'other[1].year',
    contextKey: 'other[1].context',
    roleKey: 'other[1].role',
    // v1 tagged Android with the Vue colour, which was a copy-paste slip.
    tags: [
      { label: 'Android', tech: 'android' },
      { label: 'Java', tech: 'java' },
    ],
    links: [{ href: 'https://projetsi.nathancouton.fr', kind: 'live' }],
    group: 'other',
  },
  {
    id: 'first-website',
    motif: 'wireframe',
    titleKey: 'other[2].title',
    descriptionKey: 'other[2].description',
    yearKey: 'other[2].year',
    contextKey: 'other[2].context',
    roleKey: 'other[2].role',
    tags: [
      { label: 'Html', tech: 'html' },
      { label: 'Css', tech: 'css' },
      { label: 'Js', tech: 'js' },
      { label: 'JQuery', tech: 'jquery' },
      { label: 'Bootstrap', tech: 'bootstrap' },
    ],
    // v1 built this from the active locale: ancien-fr / ancien-en.
    links: [{ href: 'https://ancien-{locale}.nathancouton.fr', kind: 'live' }],
    group: 'other',
  },
  {
    id: 'ajl',
    motif: 'strokes',
    titleKey: 'other[3].title',
    descriptionKey: 'other[3].description',
    yearKey: 'other[3].year',
    contextKey: 'other[3].context',
    roleKey: 'other[3].role',
    tags: [
      { label: 'React', tech: 'react' },
      { label: 'Firebase', tech: 'firebase' },
      { label: 'Bootstrap', tech: 'bootstrap' },
    ],
    links: [{ href: 'https://ajlnettoyage.com', kind: 'live' }],
    group: 'other',
  },
]

/**
 * What the card's status pip says. Derived from the links rather than stored:
 * a project with a demo is reachable, one with only a repository is readable,
 * and one with neither was client work that never became public.
 */
export function projectStatus(project: Project): 'live' | 'source' | 'closed' {
  if (project.links.some(link => link.kind === 'live')) return 'live'
  if (project.links.length) return 'source'
  return 'closed'
}
