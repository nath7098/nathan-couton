import type { CommitId } from './parcours'
import { parseYearMonth, yearsBetween } from './now'
import type { IconName } from '~/utils/icon-names'

/**
 * Skills, sorted by how they are actually used — not rated.
 *
 * v1 showed a self-assessed level per skill, to a tenth ("Niveau 4.2 sur 5"),
 * inside wheels that showed four skills out of twenty-four at a time. A
 * decimal self-rating cannot be checked and reads as a guess; a wheel cannot
 * be searched. What a recruiter matches against is a list of words, and what
 * makes a word credible is where it was used. So: three tiers, the years, and
 * links to the missions in the Parcours.
 *
 * Years are counted, not typed. A skill in use today carries `since` (year-
 * month) and its years follow from the build date — Java does not stay at
 * "6 ans" for ever. A skill no longer in daily use carries a fixed `years`:
 * its count stopped when the mission did. Starting points reproduce the
 * owner's own 2026 figures.
 */
export type SkillTier = 'daily' | 'solid' | 'explored'

export interface Skill {
  id: string
  name: string
  icon?: IconName
  tier: SkillTier
  /** In use today: years are counted from here to the build date. */
  since?: `${number}-${number}`
  /** No longer in daily use: a frozen count. */
  years?: number
  /** Where it was used, as anchors into the Parcours. */
  usedIn?: readonly CommitId[]
}

export const TIERS: readonly SkillTier[] = ['daily', 'solid', 'explored']

export const SKILLS: readonly Skill[] = [
  // ── Every day, on the current mission ──────────────────────────────────
  { id: 'java', name: 'Java', icon: 'java', tier: 'daily', since: '2020-01', usedIn: ['harmonie', 'mpa', 'tempo', 'sopra-2020'] },
  { id: 'spring', name: 'Spring Boot', icon: 'spring', tier: 'daily', since: '2020-01', usedIn: ['harmonie', 'mpa', 'tempo'] },
  { id: 'spring-batch', name: 'Spring Batch', icon: 'spring', tier: 'daily', since: '2025-07', usedIn: ['harmonie'] },
  { id: 'angular', name: 'Angular', icon: 'angular', tier: 'daily', since: '2021-01', usedIn: ['harmonie', 'tempo', 'sopra-2020'] },
  { id: 'ts', name: 'TypeScript', icon: 'ts', tier: 'daily', since: '2020-01', usedIn: ['harmonie', 'mpa'] },
  { id: 'kafka', name: 'Kafka', icon: 'kafka', tier: 'daily', since: '2025-07', usedIn: ['harmonie'] },
  { id: 'spark', name: 'Spark', icon: 'spark', tier: 'daily', since: '2025-07', usedIn: ['harmonie'] },
  { id: 'bonita', name: 'Bonita (BPM)', tier: 'daily', since: '2025-07', usedIn: ['harmonie'] },
  { id: 'postgres', name: 'PostgreSQL', icon: 'postgres', tier: 'daily', since: '2020-01', usedIn: ['harmonie'] },
  { id: 'hibernate', name: 'Hibernate / JPA', tier: 'daily', since: '2020-01', usedIn: ['harmonie', 'mpa', 'tempo'] },
  { id: 'intellij', name: 'IntelliJ IDEA', icon: 'intellij', tier: 'daily', since: '2018-01' },
  { id: 'gitlab', name: 'Git · GitLab', icon: 'gitlab', tier: 'daily', since: '2019-01' },

  // ── Used in production, known well ─────────────────────────────────────
  { id: 'vue', name: 'Vue.js', icon: 'vue', tier: 'solid', years: 5, usedIn: ['mpa'] },
  { id: 'security', name: 'Spring Security', icon: 'spring', tier: 'solid', years: 5, usedIn: ['mpa', 'tempo'] },
  { id: 'oracle', name: 'Oracle', icon: 'oracle', tier: 'solid', years: 8 },
  { id: 'mysql', name: 'MySQL', icon: 'mysql', tier: 'solid', years: 8 },
  { id: 'js', name: 'JavaScript', icon: 'js', tier: 'solid', years: 7 },
  { id: 'html', name: 'HTML · CSS · Sass', icon: 'html', tier: 'solid', years: 8 },
  { id: 'docker', name: 'Docker', icon: 'docker', tier: 'solid', years: 4 },
  { id: 'agile', name: 'Agile · Scrum', tier: 'solid', usedIn: ['harmonie', 'mpa', 'tempo'] },

  // ── Explored: projects, school, side work ──────────────────────────────
  { id: 'react', name: 'React', icon: 'react', tier: 'explored', years: 1 },
  { id: 'node', name: 'Node.js · Express', icon: 'node', tier: 'explored', years: 2 },
  { id: 'nuxt', name: 'Nuxt', icon: 'nuxt', tier: 'explored' },
  { id: 'csharp', name: 'C# · .NET · Unity', icon: 'csharp', tier: 'explored', years: 1 },
  { id: 'firebase', name: 'Firebase', icon: 'firebase', tier: 'explored', years: 1 },
  { id: 'mongo', name: 'MongoDB', icon: 'mongo', tier: 'explored', years: 1 },
  { id: 'android', name: 'Android', icon: 'android', tier: 'explored' },
  { id: 'ai-agents', name: 'Agents LLM · MCP', tier: 'explored', since: '2025-07', usedIn: ['harmonie'] },
]

export function skillsIn(tier: SkillTier): Skill[] {
  return SKILLS.filter(skill => skill.tier === tier)
}

/** Years of use, as of the build date for a skill still in use. */
export function skillYears(skill: Skill): number | undefined {
  return skill.since ? yearsBetween(parseYearMonth(skill.since)) : skill.years
}
