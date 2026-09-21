import type { IconName } from '~/utils/icon-names'

export interface Skill {
  id: string
  name: string
  icon: IconName
  /** Years of practice. */
  years: number
  /** Self-assessed level out of 5. */
  level: number
}

export interface SkillFamily {
  id: 'front' | 'back' | 'database' | 'tools'
  titleKey: string
  /** Which semantic accent colours the wheel. */
  accent: 'secondary' | 'primary' | 'tertiary' | 'danger'
  skills: readonly Skill[]
}

/** skills.json from v1, values unchanged. */
export const SKILL_FAMILIES: readonly SkillFamily[] = [
  {
    id: 'front',
    titleKey: 'skillFamilies.front',
    accent: 'secondary',
    skills: [
      { id: 'vue', name: 'Vue', icon: 'vue', years: 2, level: 4 },
      { id: 'js', name: 'Javascript', icon: 'js', years: 4, level: 4 },
      { id: 'ts', name: 'Typescript', icon: 'ts', years: 3, level: 4 },
      { id: 'sass', name: 'Sass', icon: 'sass', years: 2, level: 3 },
      { id: 'angular', name: 'Angular', icon: 'angular', years: 2, level: 3 },
      { id: 'bootstrap', name: 'Bootstrap', icon: 'bootstrap', years: 4, level: 4 },
      { id: 'html', name: 'Html 5', icon: 'html', years: 5, level: 5 },
      { id: 'react', name: 'React', icon: 'react', years: 1, level: 2 },
    ],
  },
  {
    id: 'back',
    titleKey: 'skillFamilies.back',
    accent: 'primary',
    skills: [
      { id: 'java', name: 'Java', icon: 'java', years: 3, level: 4.5 },
      { id: 'spring', name: 'Spring', icon: 'spring', years: 3, level: 4 },
      { id: 'node', name: 'NodeJS', icon: 'node', years: 2, level: 3 },
      { id: 'csharp', name: 'CSharp', icon: 'csharp', years: 1, level: 2 },
      { id: 'dotnet', name: '.NET Core', icon: 'dotnet', years: 1, level: 1.5 },
    ],
  },
  {
    id: 'database',
    titleKey: 'skillFamilies.database',
    accent: 'danger',
    skills: [
      { id: 'oracle', name: 'Oracle', icon: 'oracle', years: 5, level: 4.2 },
      { id: 'postgres', name: 'PostgreSQL', icon: 'postgres', years: 3, level: 3.5 },
      { id: 'mysql', name: 'MySQL', icon: 'mysql', years: 5, level: 4 },
      { id: 'firebase', name: 'Firebase', icon: 'firebase', years: 1, level: 2.1 },
      { id: 'mongo', name: 'MongoDb', icon: 'mongo', years: 1, level: 2.2 },
    ],
  },
  {
    id: 'tools',
    titleKey: 'skillFamilies.tools',
    accent: 'tertiary',
    skills: [
      { id: 'intellij', name: 'IntelliJ', icon: 'intellij', years: 5, level: 4.5 },
      { id: 'vscode', name: 'VsCode', icon: 'vscode', years: 3, level: 4 },
      { id: 'gitlab', name: 'GitLab', icon: 'gitlab', years: 4, level: 4 },
      { id: 'github', name: 'GitHub', icon: 'github', years: 4, level: 3.5 },
      { id: 'docker', name: 'Docker', icon: 'docker', years: 1, level: 2.5 },
      { id: 'illustrator', name: 'Illustrator', icon: 'illustrator', years: 2, level: 2.7 },
    ],
  },
]
