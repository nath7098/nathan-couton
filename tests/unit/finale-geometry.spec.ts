import { describe, expect, it } from 'vitest'
import {
  FINALE_SEGMENTS,
  FINALE_SEGMENTS_NARROW,
  FINALE_SPAN,
  finaleMarks,
  finaleProgress,
  scrollForFinale,
  splitFinale,
} from '~/utils/finale-geometry'

describe('finale geometry', () => {
  it('orders the segments run → open → walk → hold', () => {
    const marks = finaleMarks()
    expect(marks.runFrom).toBe(0)
    expect(marks.openFrom).toBeGreaterThan(0)
    expect(marks.walkFrom).toBeGreaterThan(marks.openFrom)
    expect(marks.walkTo).toBeGreaterThan(marks.walkFrom)
    expect(marks.walkTo).toBeLessThan(1)
  })

  it('spends less scroll on the walk than the rail did', () => {
    // The rail's walk was 2.5 viewports; the form was on one frame in 31.
    expect(FINALE_SEGMENTS.walk).toBeLessThan(2.5)
    expect(FINALE_SPAN).toBeCloseTo(Object.values(FINALE_SEGMENTS).reduce((a, b) => a + b, 0))
  })

  it('has no walk at all on narrow screens', () => {
    const marks = finaleMarks(FINALE_SEGMENTS_NARROW)
    expect(marks.walkTo).toBe(marks.walkFrom)
    expect(splitFinale(1, marks).walk).toBe(0)
  })

  it('never runs two segments at once', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const split = splitFinale(p)
      const moving = [split.run, split.open, split.walk].filter(v => v > 0 && v < 1)
      expect(moving.length, `at ${p.toFixed(2)}`).toBeLessThanOrEqual(1)
    }
  })

  it('is monotonic and bounded', () => {
    let previous = splitFinale(0)
    for (let p = 0; p <= 1.001; p += 0.02) {
      const split = splitFinale(p)
      for (const key of ['run', 'open', 'walk'] as const) {
        expect(split[key]).toBeGreaterThanOrEqual(previous[key])
        expect(split[key]).toBeGreaterThanOrEqual(0)
        expect(split[key]).toBeLessThanOrEqual(1)
      }
      previous = split
    }
    expect(splitFinale(1).walk).toBe(1)
  })

  it('maps document scroll onto the pinned range and back', () => {
    const top = 5000
    const height = 900 * (1 + FINALE_SPAN)
    expect(finaleProgress(top - 10, top, height, 900)).toBe(0)
    expect(finaleProgress(top + height - 900, top, height, 900)).toBe(1)
    const y = scrollForFinale(0.4, top, height, 900)
    expect(finaleProgress(y, top, height, 900)).toBeCloseTo(0.4)
  })
})
