import { describe, expect, it } from 'vitest'
import { shortestStep } from '~/utils/wheel'

describe('shortestStep', () => {
  it('steps forward within the near half', () => {
    expect(shortestStep(0, 1, 8)).toBe(1)
    expect(shortestStep(0, 3, 8)).toBe(3)
  })

  it('goes backwards rather than the long way round', () => {
    // v1's bug: stepping from 0 to 7 of 8 spun +7 instead of −1.
    expect(shortestStep(0, 7, 8)).toBe(-1)
    expect(shortestStep(1, 0, 8)).toBe(-1)
    expect(shortestStep(2, 7, 8)).toBe(-3)
  })

  it('resolves an exact half turn forwards', () => {
    expect(shortestStep(0, 4, 8)).toBe(4)
    expect(shortestStep(4, 0, 8)).toBe(4)
  })

  it('never travels more than half the circle', () => {
    for (const count of [2, 5, 6, 8, 13]) {
      for (let from = 0; from < count; from++) {
        for (let to = 0; to < count; to++) {
          expect(Math.abs(shortestStep(from, to, count))).toBeLessThanOrEqual(count / 2)
        }
      }
    }
  })

  it('always lands on the requested index', () => {
    for (const count of [3, 5, 8]) {
      for (let from = 0; from < count; from++) {
        for (let to = 0; to < count; to++) {
          const landed = ((from + shortestStep(from, to, count)) % count + count) % count
          expect(landed).toBe(to)
        }
      }
    }
  })

  it('is a no-op for the current index and for degenerate counts', () => {
    expect(shortestStep(3, 3, 8)).toBe(0)
    expect(shortestStep(0, 1, 0)).toBe(0)
  })
})
