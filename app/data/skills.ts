import type { CommitId } from './parcours'
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
 * `years` are the owner's own figures, carried over from v1 and brought up to
 * date in 2026; where v1 had none, they follow from the Parcours dates, or
 * are left out.
 */
export type SkillTier = 'daily' | 'solid' | 'explored'

export interface Skill {
  id: string
  name: string
  icon?: IconName
  tier: SkillTier
  years?: number
  /** Where it was used, as anchors into the Parcours. */
  usedIn?: readonly CommitId[]
}

export const TIERS: readonly SkillTier[] = ['daily', 'solid', 'explored']

export const SKILLS: readonly Skill[] = [
  // ── Every day, on the current mission ──────────────────────────────────
  { id: 'java', name: 'Java', icon: 'java', tier: 'daily', years: 6, usedIn: ['harmonie', 'mpa', 'tempo', 'sopra-2020'] },
  { id: 'spring', name: 'Spring Boot', icon: 'spring', tier: 'daily', years: 6, usedIn: ['harmonie', 'mpa', 'tempo'] },
  { id: 'spring-batch', name: 'Spring Batch', icon: 'spring', tier: 'daily', years: 1, usedIn: ['harmonie'] },
  { id: 'angular', name: 'Angular', icon: 'angular', tier: 'daily', years: 5, usedIn: ['harmonie', 'tempo', 'sopra-2020'] },
  { id: 'ts', name: 'TypeScript', icon: 'ts', tier: 'daily', years: 6, usedIn: ['harmonie', 'mpa'] },
  { id: 'kafka', name: 'Kafka', icon: 'kafka', tier: 'daily', years: 1, usedIn: ['harmonie'] },
  { id: 'spark', name: 'Spark', icon: 'spark', tier: 'daily', years: 1, usedIn: ['harmonie'] },
  { id: 'intellij', name: 'IntelliJ IDEA', icon: 'intellij', tier: 'daily', years: 8 },
  { id: 'gitlab', name: 'Git · GitLab', icon: 'gitlab', tier: 'daily', years: 7 },

  // ── Used in production, known well ─────────────────────────────────────
  { id: 'vue', name: 'Vue.js', icon: 'vue', tier: 'solid', years: 5, usedIn: ['mpa'] },
  { id: 'security', name: 'Spring Security', icon: 'spring', tier: 'solid', years: 5, usedIn: ['mpa', 'tempo'] },
  { id: 'hibernate', name: 'Hibernate / JPA', tier: 'solid', years: 5, usedIn: ['mpa', 'tempo'] },
  { id: 'oracle', name: 'Oracle', icon: 'oracle', tier: 'solid', years: 8 },
  { id: 'postgres', name: 'PostgreSQL', icon: 'postgres', tier: 'solid', years: 6 },
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
]

export function skillsIn(tier: SkillTier): Skill[] {
  return SKILLS.filter(skill => skill.tier === tier)
}
