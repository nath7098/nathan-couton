import { describe, expect, it } from 'vitest'
import en from '../../i18n/locales/en'
import fr from '../../i18n/locales/fr'
import { SECTION_IDS } from '~/data/sections'
import { COMMITS } from '~/data/parcours'
import { ARCHIVE, CASE_STUDIES, STEPS } from '~/data/projects'

type Json = Record<string, unknown>

/** Flattens to dotted paths, with array indices, so the two files can be diffed. */
function paths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => paths(item, `${prefix}[${i}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Json).flatMap(([key, child]) =>
      paths(child, prefix ? `${prefix}.${key}` : key))
  }
  return [prefix]
}

describe('locales', () => {
  it('has identical key sets in both languages', () => {
    const frKeys = paths(fr).sort()
    const enKeys = paths(en).sort()
    expect(enKeys).toEqual(frKeys)
  })

  it('has no empty string anywhere', () => {
    for (const [name, bundle] of [['fr', fr], ['en', en]] as const) {
      const empties = paths(bundle).filter((path) => {
        const value = path.split(/[.[\]]+/).filter(Boolean)
          .reduce<unknown>((acc, key) => (acc as Json)?.[key], bundle)
        return typeof value === 'string' && value.trim() === ''
      })
      expect(empties, `${name} has empty values`).toEqual([])
    }
  })

  const lookup = (bundle: Json, path: string) =>
    path.split('.').reduce<unknown>((acc, key) => (acc as Json)?.[key], bundle)

  it('names every section, in both languages', () => {
    for (const id of SECTION_IDS) {
      for (const field of ['nav', 'title', 'file']) {
        expect(lookup(fr as Json, `sections.${id}.${field}`), `fr sections.${id}.${field}`).toBeTruthy()
        expect(lookup(en as Json, `sections.${id}.${field}`), `en sections.${id}.${field}`).toBeTruthy()
      }
    }
  })

  it('tells every commit of the Parcours', () => {
    for (const commit of COMMITS) {
      for (const bundle of [fr, en] as Json[]) {
        expect(lookup(bundle, `parcours.${commit.id}.title`), commit.id).toBeTruthy()
        expect(lookup(bundle, `parcours.${commit.id}.period`), commit.id).toBeTruthy()
        expect(lookup(bundle, `parcours.${commit.id}.summary`), commit.id).toBeTruthy()
      }
    }
  })

  it('tells every case study in four beats, and every archive entry in a line', () => {
    for (const bundle of [fr, en] as Json[]) {
      for (const study of CASE_STUDIES) {
        for (const step of STEPS) {
          expect(lookup(bundle, `projects.cases.${study.id}.${step}`), `${study.id}.${step}`).toBeTruthy()
        }
        if (study.figure.kind === 'graph') {
          for (const node of study.figure.nodes) {
            expect(lookup(bundle, `projects.cases.${study.id}.nodes.${node.id}`), `${study.id}/${node.id}`).toBeTruthy()
          }
        }
      }
      for (const entry of ARCHIVE) {
        expect(lookup(bundle, `projects.archive.${entry.id}.line`), entry.id).toBeTruthy()
      }
    }
  })

  it('carries none of the typos the audit found', () => {
    const text = JSON.stringify(fr)
    for (const typo of ['A propos', 'Contactez moi', 'Envoyez moi', 'ASSEYEZ VOUS', 'Revfonte', 'Sopra Baking', 'intéractive', 'les médecin ', 'connaissance sur']) {
      expect(text, typo).not.toContain(typo)
    }
    const english = JSON.stringify(en)
    for (const typo of ['It\'s purpose', 'a points cloud', 'detect deceases']) {
      expect(english, typo).not.toContain(typo)
    }
  })

  it('carries the contact.email key that v1 only had in English', () => {
    // v1 shipped `contact.mail` in fr.js but ContactView read `contact.email`,
    // so the French form rendered the raw key. Both files now define it.
    expect(fr.contact.email).toBe('Votre e-mail')
    expect(en.contact.email).toBe('Your e-mail')
  })
})
