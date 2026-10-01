import type { GraphBranch, GraphCommit, YearMonth } from '~/utils/git-graph'

/**
 * The Parcours, as a `git log --graph`.
 *
 * Experience and education used to be two horizontal timelines read from right
 * to left, their content behind chevrons, a three-day training course drawn
 * the same size as an engineering degree. They are one history now, newest
 * first, everything readable without a click:
 *
 * - `main` is the training line — IUT, Polytech, the degree as a tag, and the
 *   continuing education that happens alongside the job.
 * - each employer is a branch off it; each client mission is a commit on the
 *   employer's branch. For a consultancy recruiter, that is the relationship
 *   that matters — who employed him, who he worked for — and it is drawn.
 *
 * Structure and dates live here; the words live in `parcours.<id>` in the
 * locale files. `CommitId` doubles as the anchor the skills section links to.
 */
export type BranchId = 'main' | 'sopra' | 'acii' | 'catamania'

export interface Branch extends GraphBranch {
  id: BranchId
  /** Shown in the refs, `(HEAD -> catamania)`. */
  ref: string
}

export type CommitKind = 'mission' | 'internship' | 'school' | 'degree' | 'training'

export interface Commit extends GraphCommit {
  id: CommitId
  branch: BranchId
  kind: CommitKind
  from: YearMonth
  /** Stack shown under the entry, as plain words — searchable, not icons. */
  stack?: readonly string[]
  /** A one-line entry: continuing education, not a chapter of the story. */
  minor?: boolean
  /** A git tag on the commit (the degree). */
  tag?: string
}

export type CommitId
  = | 'harmonie' | 'vue-training' | 'mpa' | 'tempo' | 'degree'
    | 'sopra-2020' | 'sopra-2019' | 'polytech' | 'iut'

export const BRANCHES: readonly Branch[] = [
  { id: 'main', ref: 'main', lane: 0, from: '2015-09' },
  { id: 'catamania', ref: 'catamania', lane: 1, from: '2025-07' },
  { id: 'acii', ref: 'acii', lane: 1, from: '2021-01', to: '2025-06' },
  { id: 'sopra', ref: 'sopra-steria', lane: 1, from: '2019-06', to: '2020-08' },
]

export const COMMITS: readonly Commit[] = [
  {
    id: 'harmonie',
    branch: 'catamania',
    kind: 'mission',
    from: '2025-07',
    stack: ['Java 21', 'Spring Boot 4', 'Kafka', 'Spring Batch', 'Spark', 'Bonita', 'PostgreSQL', 'Hibernate', 'Angular 19'],
  },
  { id: 'vue-training', branch: 'main', kind: 'training', from: '2023-06', minor: true },
  {
    id: 'mpa',
    branch: 'acii',
    kind: 'mission',
    from: '2021-02',
    stack: ['Java EE 8', 'Spring Boot 2', 'Spring Security', 'Hibernate', 'Vue.js 2', 'Vuex', 'TypeScript'],
  },
  {
    id: 'tempo',
    branch: 'acii',
    kind: 'mission',
    from: '2021-01',
    stack: ['Java 15', 'Spring Boot', 'Hibernate', 'Angular 11'],
  },
  { id: 'degree', branch: 'main', kind: 'degree', from: '2020-09', tag: 'ingénieur-2020' },
  {
    id: 'sopra-2020',
    branch: 'sopra',
    kind: 'internship',
    from: '2020-02',
    stack: ['Java 8', 'Angular 2', 'Flex'],
  },
  {
    id: 'sopra-2019',
    branch: 'sopra',
    kind: 'internship',
    from: '2019-06',
    stack: ['Java 8', 'Flex'],
  },
  { id: 'polytech', branch: 'main', kind: 'school', from: '2017-09' },
  { id: 'iut', branch: 'main', kind: 'school', from: '2015-09' },
]

/** The newest commit on each branch carries its ref, as `git log` decorates it. */
export function refsFor(commit: Commit): string[] {
  const refs: string[] = []
  for (const branch of BRANCHES) {
    const tip = COMMITS.filter(c => c.branch === branch.id)
      .sort((a, b) => b.from.localeCompare(a.from))[0]
    if (tip?.id !== commit.id) continue
    refs.push(branch.to === undefined && branch.id !== 'main' ? `HEAD -> ${branch.ref}` : branch.ref)
  }
  if (commit.tag) refs.push(`tag: ${commit.tag}`)
  return refs
}
