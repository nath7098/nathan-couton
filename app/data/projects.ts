import type { Tag } from './types'
import type { MotifKey } from '~/utils/project-motifs'

export interface ProjectLink {
  href: string
  kind: 'repo' | 'live'
}

export interface Project {
  id: string
  /**
   * The name the card shows in its title bar. Not a real path — it is the file
   * this project would open on, and it carries the stack at a glance.
   */
  file: string
  /** Shown in the title bar. A span for the long missions, a year otherwise. */
  year: string
  /** Which figure the card draws behind its text. See `project-motifs.ts`. */
  motif: MotifKey
  titleKey: string
  descriptionKey: string
  /** i18n key for the `// context · role` line above the title. */
  metaKey: string
  tags: Tag[]
  links: ProjectLink[]
  group: 'main' | 'other'
}

/**
 * The eight projects of v1, same order, same links.
 *
 * `image` and `altKey` are gone. Every project used to ship a 1355×678 PNG of
 * two colour blocks and a ringed circle repeating the title; the cards now draw
 * a figure from `motif` instead, and the seven files left the repository.
 */
export const PROJECTS: readonly Project[] = [
  {
    id: 'prevoyance',
    file: 'prevoyance.vue',
    year: '2021 – 2025',
    motif: 'layers',
    titleKey: 'projects[0].title',
    descriptionKey: 'projects[0].description',
    metaKey: 'projects[0].meta',
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
    file: 'portfolio.vue',
    year: '2023',
    motif: 'stream',
    titleKey: 'projects[1].title',
    descriptionKey: 'projects[1].description',
    metaKey: 'projects[1].meta',
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
    file: 'tsp-solver.js',
    year: '2020',
    motif: 'tour',
    titleKey: 'projects[2].title',
    descriptionKey: 'projects[2].description',
    metaKey: 'projects[2].meta',
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
    file: 'PointCloud.cs',
    year: '2020',
    motif: 'cloud',
    titleKey: 'projects[3].title',
    descriptionKey: 'projects[3].description',
    metaKey: 'projects[3].meta',
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
    file: 'moneybox.component.ts',
    year: '2019',
    motif: 'coins',
    titleKey: 'other[0].title',
    descriptionKey: 'other[0].description',
    metaKey: 'other[0].meta',
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
    file: 'SwalloWin.java',
    year: '2019',
    motif: 'wave',
    titleKey: 'other[1].title',
    descriptionKey: 'other[1].description',
    metaKey: 'other[1].meta',
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
    file: 'index.html',
    year: '2018',
    motif: 'wireframe',
    titleKey: 'other[2].title',
    descriptionKey: 'other[2].description',
    metaKey: 'other[2].meta',
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
    file: 'ajl-peinture.jsx',
    year: '2020',
    motif: 'strokes',
    titleKey: 'other[3].title',
    descriptionKey: 'other[3].description',
    metaKey: 'other[3].meta',
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
