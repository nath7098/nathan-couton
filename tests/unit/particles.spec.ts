import { describe, expect, it } from 'vitest'
import { ParticleField, countFor, createRandom } from '~/utils/particles'

describe('createRandom', () => {
  it('is deterministic for a seed', () => {
    const a = createRandom(42)
    const b = createRandom(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('stays within [0, 1)', () => {
    const random = createRandom(7)
    for (let i = 0; i < 500; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('countFor', () => {
  it('scales with viewport area, within bounds', () => {
    const small = countFor('dust', 360, 640)
    const desktop = countFor('dust', 1440, 900)
    const huge = countFor('dust', 3840, 2160)
    expect(small).toBeLessThan(desktop)
    expect(huge).toBeGreaterThan(desktop)
    // The clamp keeps a 4K screen from an order-of-magnitude larger field.
    expect(huge / small).toBeLessThan(5)
  })

  it('halves the field on low-core machines', () => {
    expect(countFor('dust', 1440, 900, 1, 4)).toBe(Math.round(countFor('dust', 1440, 900, 1, 8) / 2))
  })

  it('honours the density multiplier', () => {
    expect(countFor('embers', 1440, 900, 0.5)).toBeLessThan(countFor('embers', 1440, 900, 1))
  })
})

describe('ParticleField', () => {
  it('allocates parallel arrays of the same length', () => {
    const field = new ParticleField({ preset: 'dust', width: 800, height: 600, seed: 1 })
    for (const array of [field.x, field.y, field.vx, field.vy, field.size]) {
      expect(array).toBeInstanceOf(Float32Array)
      expect(array.length).toBe(field.count)
    }
  })

  it('starts every particle inside the field', () => {
    const field = new ParticleField({ preset: 'spores', width: 800, height: 600, seed: 2 })
    for (let i = 0; i < field.count; i++) {
      expect(field.x[i]).toBeGreaterThanOrEqual(0)
      expect(field.x[i]).toBeLessThanOrEqual(800)
      expect(field.y[i]).toBeGreaterThanOrEqual(0)
      expect(field.y[i]).toBeLessThanOrEqual(600)
    }
  })

  it('keeps wrapping presets inside the field forever', () => {
    const field = new ParticleField({ preset: 'dust', width: 400, height: 300, seed: 3 })
    for (let step = 0; step < 300; step++) field.step(1 / 60)
    for (let i = 0; i < field.count; i++) {
      expect(field.x[i]).toBeGreaterThanOrEqual(-1)
      expect(field.x[i]).toBeLessThanOrEqual(401)
      expect(field.y[i]).toBeGreaterThanOrEqual(-1)
      expect(field.y[i]).toBeLessThanOrEqual(301)
    }
  })

  it('recycles particles that leave, without growing the pool', () => {
    const field = new ParticleField({ preset: 'code-rain', width: 400, height: 300, seed: 4 })
    const size = field.count
    for (let step = 0; step < 600; step++) field.step(1 / 60)
    expect(field.count).toBe(size)
    expect(field.x.length).toBe(size)
    // Nothing has drifted far outside: they respawned at the top.
    for (let i = 0; i < field.count; i++) expect(field.y[i]).toBeLessThan(400)
  })

  it('leaves the static preset alone', () => {
    const field = new ParticleField({ preset: 'grid-pulse', width: 400, height: 300, seed: 5 })
    const before = Float32Array.from(field.x)
    field.step(1)
    expect(Array.from(field.x)).toEqual(Array.from(before))
  })

  it('rescales positions on resize without reallocating', () => {
    const field = new ParticleField({ preset: 'dust', width: 400, height: 300, seed: 6 })
    const array = field.x
    field.resize(800, 600)
    expect(field.x).toBe(array)
    expect(field.width).toBe(800)
    for (let i = 0; i < field.count; i++) expect(field.x[i]).toBeLessThanOrEqual(801)
  })
})
