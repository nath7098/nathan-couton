import type { CommitId } from './parcours'
import type { MotifKey } from '~/utils/project-motifs'

/**
 * Projects: a few case studies told in full, then the archive.
 *
 * Client work has no screenshots — the Mutuelle de Poitiers mission is under
 * NDA, and an internal application's screens say little anyway. What can be
 * shown is how the work is built: each case study draws an architecture
 * diagram, and lights the part of it the text is talking about as the
 * visitor reads. Public projects get their demo and
 * their repository. The site itself is the last case study, because it is the
 * one piece of work anyone can inspect end to end.
 *
 * Structure lives here; words live in `projects.cases.<id>` and
 * `projects.archive.<id>`.
 */
export interface ProjectLink {
  href: string
  kind: 'repo' | 'live'
}

/** The three beats every case study is told in; the context is its pitch. */
export const STEPS = ['problem', 'work', 'outcome'] as const
export type Step = (typeof STEPS)[number]

export interface FigureNode {
  id: string
  /** Box centre and size, in the figure's 400×300 viewBox. */
  x: number
  y: number
  w: number
  h: number
  role: 'source' | 'bus' | 'process' | 'store' | 'ui' | 'actor'
  /** The steps during which this node is lit. */
  lit: readonly Step[]
  /** A technology name, shown as is; otherwise the label is translated. */
  tech?: string
}

export interface FigureEdge {
  from: string
  to: string
  lit: readonly Step[]
}

export type FigureSpec
  = | { kind: 'graph', nodes: readonly FigureNode[], edges: readonly FigureEdge[] }
    | { kind: 'motif', motif: MotifKey }

export interface CaseStudy {
  id: string
  /** Client work under NDA: generic figure, no links, said so plainly. */
  nda: boolean
  /** The Parcours entry this case belongs to, if any. */
  commit?: CommitId
  figure: FigureSpec
  stack: readonly string[]
  links: readonly ProjectLink[]
}

const ALL: readonly Step[] = STEPS

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    id: 'flux',
    nda: false,
    commit: 'harmonie',
    stack: ['Java 21', 'Spring Boot 4', 'Kafka', 'Spring Batch', 'Bonita', 'PostgreSQL', 'Spark', 'Angular 19'],
    links: [],
    figure: {
      kind: 'graph',
      // The chain reads like the work: flows in at the top, processed and
      // orchestrated down the right, stored in the middle, then served to the
      // micro-fronts and analysed with Spark at the end. Below it, the team —
      // and the AI it leans on more and more.
      nodes: [
        { id: 'inbound', x: 65, y: 38, w: 112, h: 40, role: 'source', lit: ['problem', 'outcome'] },
        { id: 'kafka', x: 200, y: 38, w: 96, h: 40, role: 'bus', tech: 'Kafka', lit: ['problem', 'work', 'outcome'] },
        { id: 'batch', x: 335, y: 38, w: 112, h: 40, role: 'process', tech: 'Spring Batch', lit: ['problem', 'work', 'outcome'] },
        { id: 'process', x: 335, y: 112, w: 112, h: 40, role: 'process', tech: 'Bonita', lit: ['problem', 'work', 'outcome'] },
        { id: 'store', x: 200, y: 112, w: 96, h: 40, role: 'store', tech: 'PostgreSQL', lit: ['work', 'outcome'] },
        { id: 'analytics', x: 65, y: 112, w: 112, h: 40, role: 'process', tech: 'Spark', lit: ['work', 'outcome'] },
        { id: 'api', x: 200, y: 186, w: 112, h: 40, role: 'process', tech: 'Spring Boot', lit: ['work', 'outcome'] },
        { id: 'ui', x: 335, y: 186, w: 112, h: 40, role: 'ui', tech: 'Angular 19', lit: ['work', 'outcome'] },
        { id: 'squad', x: 110, y: 262, w: 140, h: 40, role: 'actor', lit: ['work', 'outcome'] },
        { id: 'ai', x: 290, y: 262, w: 140, h: 40, role: 'bus', tech: 'agents · MCP', lit: ['outcome'] },
      ],
      edges: [
        { from: 'inbound', to: 'kafka', lit: ['problem', 'work', 'outcome'] },
        { from: 'kafka', to: 'batch', lit: ['problem', 'work', 'outcome'] },
        { from: 'batch', to: 'process', lit: ['work', 'outcome'] },
        { from: 'process', to: 'store', lit: ['work', 'outcome'] },
        { from: 'batch', to: 'store', lit: ['work', 'outcome'] },
        { from: 'store', to: 'api', lit: ['work', 'outcome'] },
        { from: 'api', to: 'ui', lit: ['work', 'outcome'] },
        { from: 'store', to: 'analytics', lit: ['work', 'outcome'] },
        { from: 'squad', to: 'ai', lit: ['outcome'] },
      ],
    },
  },
  {
    id: 'prevoyance',
    nda: true,
    commit: 'mpa',
    stack: ['Java EE 8', 'Spring Boot 2', 'Spring Security', 'Hibernate', 'Vue.js 2', 'Vuex', 'TypeScript'],
    links: [],
    figure: {
      kind: 'graph',
      nodes: [
        { id: 'members', x: 200, y: 30, w: 170, h: 36, role: 'actor', lit: ['problem', 'outcome'] },
        { id: 'spa', x: 200, y: 95, w: 230, h: 40, role: 'ui', tech: 'Vue.js 2 · Vuex', lit: ['work', 'outcome'] },
        { id: 'api', x: 200, y: 160, w: 230, h: 40, role: 'process', tech: 'Spring Boot · Security', lit: ['work', 'outcome'] },
        { id: 'domain', x: 200, y: 222, w: 230, h: 40, role: 'process', tech: 'Java EE 8 · Hibernate', lit: ['problem', 'work', 'outcome'] },
        { id: 'db', x: 200, y: 278, w: 150, h: 34, role: 'store', lit: ['work', 'outcome'] },
      ],
      edges: [
        { from: 'members', to: 'spa', lit: ['work', 'outcome'] },
        { from: 'spa', to: 'api', lit: ['work', 'outcome'] },
        { from: 'api', to: 'domain', lit: ['work', 'outcome'] },
        { from: 'domain', to: 'db', lit: ['work', 'outcome'] },
      ],
    },
  },
  {
    id: 'tsp',
    nda: false,
    stack: ['JavaScript', 'jQuery', 'p5.js', 'Bootstrap'],
    links: [
      { href: 'https://nath7098.gitlab.io/projet-libre/html/', kind: 'live' },
      { href: 'https://gitlab.com/nath7098/projet-libre', kind: 'repo' },
    ],
    figure: { kind: 'motif', motif: 'tour' },
  },
  {
    id: 'site',
    nda: false,
    stack: ['Nuxt 4', 'Vue 3', 'TypeScript', 'CSS', 'Playwright', 'Claude Code'],
    links: [],
    figure: {
      kind: 'graph',
      nodes: [
        { id: 'document', x: 110, y: 70, w: 160, h: 48, role: 'ui', lit: ['problem', 'work', 'outcome'] },
        { id: 'timeline', x: 290, y: 70, w: 160, h: 48, role: 'process', tech: 'view-timeline', lit: ['work', 'outcome'] },
        { id: 'finale', x: 110, y: 170, w: 160, h: 48, role: 'bus', lit: ['problem', 'work', 'outcome'] },
        { id: 'world', x: 290, y: 170, w: 160, h: 48, role: 'store', lit: ['work', 'outcome'] },
        { id: 'checks', x: 200, y: 262, w: 220, h: 44, role: 'actor', tech: 'Playwright · axe · Lighthouse', lit: ['outcome'] },
      ],
      edges: [
        { from: 'document', to: 'finale', lit: ['problem', 'work', 'outcome'] },
        { from: 'timeline', to: 'finale', lit: ['work', 'outcome'] },
        { from: 'finale', to: 'world', lit: ['work', 'outcome'] },
        { from: 'finale', to: 'checks', lit: ['outcome'] },
      ],
    },
  },
]

/** Everything else, one line each: year, name, context, stack, links. */
export interface ArchiveEntry {
  id: string
  year: string
  stack: readonly string[]
  links: readonly ProjectLink[]
}

export const ARCHIVE: readonly ArchiveEntry[] = [
  {
    id: 'pink-amazones',
    year: '2025',
    stack: ['Nuxt 3', 'Nuxt UI', 'Tailwind', 'Pinia', 'Supabase'],
    links: [
      { href: 'https://pink-amazones.fr/', kind: 'live' },
      { href: 'https://github.com/nath7098/pink-amazones', kind: 'repo' },
    ],
  },
  {
    id: 'hololens',
    year: '2020',
    stack: ['Unity', 'C#', 'C++'],
    links: [
      { href: 'https://hololens.nathancouton.fr', kind: 'live' },
      { href: 'https://gitlab.com/nath7098/hololenscamerastreamtopointcloud', kind: 'repo' },
    ],
  },
  {
    id: 'moneybox',
    year: '2019',
    stack: ['Angular', 'Java', 'Bootstrap'],
    links: [],
  },
  {
    id: 'swallowin',
    year: '2019',
    stack: ['Android', 'Java'],
    links: [],
  },
  {
    id: 'portfolio-v1',
    year: '2023',
    stack: ['Vue 3', 'Vite', 'Pinia', 'Express'],
    links: [{ href: 'https://gitlab.com/nath7098/personal-website', kind: 'repo' }],
  },
  {
    id: 'first-site',
    year: '2018',
    stack: ['HTML', 'CSS', 'JavaScript', 'jQuery'],
    links: [],
  },
]

export { ALL as ALL_STEPS }
