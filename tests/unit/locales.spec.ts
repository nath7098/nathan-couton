import { describe, expect, it } from 'vitest'
import en from '../../i18n/locales/en'
import fr from '../../i18n/locales/fr'
import { SCENES } from '~/data/scenes'

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

  it('defines a navigation label for every scene', () => {
    for (const scene of SCENES) {
      const key = scene.labelKey.split('.')
      const lookup = (bundle: Json) => key.reduce<unknown>((acc, k) => (acc as Json)?.[k], bundle)
      expect(lookup(fr as Json), `fr misses ${scene.labelKey}`).toBeTruthy()
      expect(lookup(en as Json), `en misses ${scene.labelKey}`).toBeTruthy()
    }
  })

  it('carries the contact.email key that v1 only had in English', () => {
    // v1 shipped `contact.mail` in fr.js but ContactView read `contact.email`,
    // so the French form rendered the raw key. Both files now define it.
    expect(fr.contact.email).toBe('Votre e-mail')
    expect(en.contact.email).toBe('Your e-mail')
  })
})
