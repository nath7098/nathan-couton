import { describe, expect, it } from 'vitest'
import { LEGACY_HASHES, LEGACY_PATHS, SECTIONS, SECTION_IDS, isSectionId } from '~/data/sections'
import { exitPoint } from '~/utils/figure-geometry'

describe('sections', () => {
  it('lists the six sections in order, ending on the finale', () => {
    expect(SECTIONS.map(s => s.id)).toEqual([...SECTION_IDS])
    expect(SECTION_IDS.at(-1)).toBe('contact')
  })

  it('thins the {{ }} scaffolding down the page', () => {
    const code = SECTIONS.map(s => s.code)
    expect([...code].sort((a, b) => b - a)).toEqual(code)
    expect(code.at(-1)).toBe(0)
  })

  it('sends every legacy anchor and path to a section that exists', () => {
    for (const target of Object.values(LEGACY_HASHES)) expect(isSectionId(target)).toBe(true)
    for (const target of Object.values(LEGACY_PATHS)) expect(isSectionId(target)).toBe(true)
    expect(LEGACY_HASHES.experience).toBe('parcours')
    expect(LEGACY_HASHES.education).toBe('parcours')
  })
})

describe('figure geometry', () => {
  it('cuts a connector at the edge of its box', () => {
    const box = { x: 100, y: 100, w: 40, h: 20 }
    expect(exitPoint(box, 200, 100)).toEqual([120, 100])
    expect(exitPoint(box, 100, 200)).toEqual([100, 110])
  })
})
