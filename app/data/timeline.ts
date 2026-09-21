import type { AccentKey, Tag } from './types'

/**
 * Experience and education, carried over from v1 unchanged.
 *
 * Structure lives here, words live in the locale files: an entry references its
 * i18n keys so both languages stay in step.
 */
export interface TimelineDetail {
  contentKey: string
  dateKey?: string
  titleKey?: string
  skills: Tag[]
}

export interface TimelineEntry {
  id: string
  dateKey: string
  titleKey: string
  contentKey: string
  accent: AccentKey
  details?: TimelineDetail[]
}

export const EXPERIENCE: readonly TimelineEntry[] = [
  {
    id: 'acii',
    dateKey: 'experience[0].date',
    titleKey: 'experience[0].title',
    contentKey: 'experience[0].content',
    accent: 'acii',
    details: [
      {
        dateKey: 'experience[0].details[0].date',
        titleKey: 'experience[0].details[0].title',
        contentKey: 'experience[0].details[0].content',
        skills: [
          { label: 'Vue 2', tech: 'vue', detailsKey: 'experience[0].details[0].skills[0].details' },
          { label: 'Java 8', tech: 'java', detailsKey: 'experience[0].details[0].skills[1].details' },
          { label: 'Spring', tech: 'spring', detailsKey: 'experience[0].details[0].skills[2].details' },
          { label: 'Agile', tech: 'agile', detailsKey: 'experience[0].details[0].skills[3].details' },
        ],
      },
      {
        dateKey: 'experience[0].details[1].date',
        titleKey: 'experience[0].details[1].title',
        contentKey: 'experience[0].details[1].content',
        skills: [
          { label: 'Angular 11', tech: 'angular', detailsKey: 'experience[0].details[1].skills[0].details' },
          { label: 'Java 15', tech: 'java', detailsKey: 'experience[0].details[1].skills[1].details' },
          { label: 'Spring', tech: 'spring', detailsKey: 'experience[0].details[1].skills[2].details' },
          { label: 'Agile', tech: 'agile', detailsKey: 'experience[0].details[1].skills[3].details' },
        ],
      },
    ],
  },
  {
    id: 'sopra-2020',
    dateKey: 'experience[1].date',
    titleKey: 'experience[1].title',
    contentKey: 'experience[1].content',
    accent: 'iut-red',
    details: [
      {
        contentKey: 'experience[1].details[0].content',
        skills: [
          { label: 'Angular', tech: 'angular', detailsKey: 'experience[1].details[0].skills[0].details' },
          { label: 'Java', tech: 'java', detailsKey: 'experience[1].details[0].skills[1].details' },
          { label: 'Agile', tech: 'agile', detailsKey: 'experience[1].details[0].skills[2].details' },
        ],
      },
    ],
  },
  {
    id: 'sopra-2019',
    dateKey: 'experience[2].date',
    titleKey: 'experience[2].title',
    contentKey: 'experience[2].content',
    accent: 'iut-red',
    details: [
      {
        contentKey: 'experience[2].details[0].content',
        skills: [
          { label: 'Flex', tech: 'flex', detailsKey: 'experience[2].details[0].skills[0].details' },
          { label: 'Java', tech: 'java', detailsKey: 'experience[2].details[0].skills[1].details' },
        ],
      },
    ],
  },
]

export const EDUCATION: readonly TimelineEntry[] = [
  {
    id: 'vuejs-2023',
    dateKey: 'education[0].date',
    titleKey: 'education[0].title',
    contentKey: 'education[0].content',
    accent: 'green',
  },
  {
    id: 'polytech',
    dateKey: 'education[1].date',
    titleKey: 'education[1].title',
    contentKey: 'education[1].content',
    accent: 'polytech',
  },
  {
    id: 'iut',
    dateKey: 'education[2].date',
    titleKey: 'education[2].title',
    contentKey: 'education[2].content',
    accent: 'iut-red',
  },
]
