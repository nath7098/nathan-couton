/** Shared content types. See SPEC §9.1. */

/** Keys of the --tech-*-accent / --tech-*-bg token pairs in tokens.css. */
export type TechKey
  = | 'vue' | 'vuex' | 'pinia' | 'vite' | 'nuxt' | 'react' | 'jquery' | 'p5'
    | 'bootstrap' | 'angular' | 'java' | 'js' | 'ts' | 'sass' | 'html' | 'css'
    | 'unity' | 'csharp' | 'cpp' | 'agile' | 'firebase' | 'express' | 'node'
    | 'android' | 'docker' | 'flex' | 'spring' | 'dotnet' | 'oracle' | 'postgres'
    | 'mysql' | 'mongo' | 'intellij' | 'vscode' | 'gitlab' | 'github'
    | 'illustrator' | 'kafka' | 'spark'

export interface Tag {
  label: string
  tech: TechKey
  /** i18n key for the explanation shown in the modal. */
  detailsKey?: string
}

export type AccentKey = 'green' | 'polytech' | 'acii' | 'iut-red' | 'catamania'
