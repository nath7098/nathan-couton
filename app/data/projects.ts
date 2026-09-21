import type { Tag } from './types'

export interface ProjectLink {
  href: string
  kind: 'repo' | 'live'
}

export interface Project {
  id: string
  image: string
  titleKey: string
  descriptionKey: string
  altKey: string
  tags: Tag[]
  links: ProjectLink[]
  group: 'main' | 'other'
}

/** The eight projects of v1, same order, same links. */
export const PROJECTS: readonly Project[] = [
  {
    id: 'prevoyance',
    image: '/img/projects/mdpa_logo.png',
    titleKey: 'projects[0].title',
    descriptionKey: 'projects[0].description',
    altKey: 'projects[0].alt',
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
    image: '/img/projects/portfolio_logo.png',
    titleKey: 'projects[1].title',
    descriptionKey: 'projects[1].description',
    altKey: 'projects[1].alt',
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
    image: '/img/projects/tsp_logo.png',
    titleKey: 'projects[2].title',
    descriptionKey: 'projects[2].description',
    altKey: 'projects[2].alt',
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
    image: '/img/projects/hololens_logo.png',
    titleKey: 'projects[3].title',
    descriptionKey: 'projects[3].description',
    altKey: 'projects[3].alt',
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
    image: '/img/projects/moneybox_logo.png',
    titleKey: 'other[0].title',
    descriptionKey: 'other[0].description',
    altKey: 'other[0].alt',
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
    image: '/img/projects/swallow_logo.png',
    titleKey: 'other[1].title',
    descriptionKey: 'other[1].description',
    altKey: 'other[1].alt',
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
    image: '/img/projects/portfolio_logo.png',
    titleKey: 'other[2].title',
    descriptionKey: 'other[2].description',
    altKey: 'other[2].alt',
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
    image: '/img/projects/ajl_logo.png',
    titleKey: 'other[3].title',
    descriptionKey: 'other[3].description',
    altKey: 'other[3].alt',
    tags: [
      { label: 'React', tech: 'react' },
      { label: 'Firebase', tech: 'firebase' },
      { label: 'Bootstrap', tech: 'bootstrap' },
    ],
    links: [{ href: 'https://ajlnettoyage.com', kind: 'live' }],
    group: 'other',
  },
]
