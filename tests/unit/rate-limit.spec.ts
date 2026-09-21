import { afterEach, describe, expect, it, vi } from 'vitest'
import { _resetRateLimit, rateLimit } from '../../server/utils/rate-limit'

afterEach(() => {
  _resetRateLimit()
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('allows up to the limit, then refuses', () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('ip', 5, 1000).allowed, `call ${i + 1}`).toBe(true)
    }
    expect(rateLimit('ip', 5, 1000).allowed).toBe(false)
  })

  it('counts down the remaining allowance and floors at zero', () => {
    expect(rateLimit('ip', 3, 1000).remaining).toBe(2)
    expect(rateLimit('ip', 3, 1000).remaining).toBe(1)
    expect(rateLimit('ip', 3, 1000).remaining).toBe(0)
    expect(rateLimit('ip', 3, 1000).remaining).toBe(0)
  })

  it('keeps keys independent', () => {
    rateLimit('a', 1, 1000)
    expect(rateLimit('a', 1, 1000).allowed).toBe(false)
    expect(rateLimit('b', 1, 1000).allowed).toBe(true)
  })

  it('starts a fresh window once the old one passes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    rateLimit('ip', 1, 1000)
    expect(rateLimit('ip', 1, 1000).allowed).toBe(false)

    vi.setSystemTime(1001)
    expect(rateLimit('ip', 1, 1000).allowed).toBe(true)
  })

  it('reports when the window resets', () => {
    vi.useFakeTimers()
    vi.setSystemTime(5000)
    expect(rateLimit('ip', 5, 2000).resetAt).toBe(7000)
  })
})
