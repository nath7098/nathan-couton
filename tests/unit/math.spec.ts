import { describe, expect, it } from 'vitest'
import { clamp, lerp, mapRange, normalize } from '~/utils/math'

describe('math utils', () => {
  it('clamps to the given bounds', () => {
    expect(clamp(-1)).toBe(0)
    expect(clamp(2)).toBe(1)
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.25)).toBe(2.5)
  })

  it('maps between ranges without clamping', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50)
    expect(mapRange(15, 0, 10, 0, 100)).toBe(150)
  })

  it('returns the low bound when the input range is degenerate', () => {
    expect(mapRange(3, 2, 2, 7, 9)).toBe(7)
  })

  it('normalizes and clamps', () => {
    expect(normalize(5, 0, 10)).toBe(0.5)
    expect(normalize(-5, 0, 10)).toBe(0)
    expect(normalize(50, 0, 10)).toBe(1)
  })
})
