/**
 * Particle field state — plain data, no DOM, no Vue. Kept separate so the
 * simulation can be tested and so the component stays about rendering.
 *
 * Particles live in parallel Float32Arrays rather than objects: the pool is
 * allocated once, nothing is created per frame, and the GC stays out of the
 * animation loop (SPEC §5.3).
 */

export type ParticlePreset
  = | 'code-rain' | 'dust' | 'constellation' | 'embers' | 'grid-pulse' | 'spores'

export interface FieldOptions {
  preset: ParticlePreset
  width: number
  height: number
  /** Multiplies the preset's base count. */
  density?: number
  /** Deterministic seed, so tests and screenshots are reproducible. */
  seed?: number
}

/** Base particle count per preset, before density and viewport scaling. */
const BASE_COUNT: Record<ParticlePreset, number> = {
  'code-rain': 70,
  'dust': 60,
  'constellation': 48,
  'embers': 55,
  'grid-pulse': 90,
  'spores': 65,
}

/** Small, fast, seedable PRNG (mulberry32) — reproducible fields. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Count for a viewport, scaled by area and halved on low-core machines.
 * A 1440×900 desktop sits at roughly the preset's base count.
 */
export function countFor(preset: ParticlePreset, width: number, height: number, density = 1, cores = 8): number {
  const area = width * height
  const scale = Math.min(Math.max(area / 1_300_000, 0.35), 1.4)
  const cored = cores <= 4 ? 0.5 : 1
  return Math.round(BASE_COUNT[preset] * density * scale * cored)
}

export class ParticleField {
  readonly preset: ParticlePreset
  width: number
  height: number
  count: number

  readonly x: Float32Array
  readonly y: Float32Array
  readonly vx: Float32Array
  readonly vy: Float32Array
  readonly size: Float32Array
  readonly seedValue: Float32Array

  private random: () => number

  constructor(options: FieldOptions) {
    this.preset = options.preset
    this.width = options.width
    this.height = options.height
    this.random = createRandom(options.seed ?? 0x9e3779b9)
    this.count = countFor(options.preset, options.width, options.height, options.density)

    this.x = new Float32Array(this.count)
    this.y = new Float32Array(this.count)
    this.vx = new Float32Array(this.count)
    this.vy = new Float32Array(this.count)
    this.size = new Float32Array(this.count)
    this.seedValue = new Float32Array(this.count)

    for (let i = 0; i < this.count; i++) this.spawn(i, true)
  }

  /** Places particle `i`. On respawn, entry happens at the edge it left from. */
  spawn(i: number, initial: boolean) {
    const r = this.random
    this.seedValue[i] = r()

    switch (this.preset) {
      case 'code-rain':
        this.x[i] = r() * this.width
        this.y[i] = initial ? r() * this.height : -20
        this.vx[i] = 0
        this.vy[i] = 14 + r() * 26
        this.size[i] = 8 + r() * 6
        break
      case 'embers':
        this.x[i] = r() * this.width
        this.y[i] = initial ? r() * this.height : this.height + 10
        this.vx[i] = (r() - 0.5) * 6
        this.vy[i] = -(10 + r() * 24)
        this.size[i] = 1 + r() * 2
        break
      case 'spores':
        this.x[i] = r() * this.width
        this.y[i] = initial ? r() * this.height : this.height + 10
        this.vx[i] = (r() - 0.5) * 8
        this.vy[i] = -(4 + r() * 12)
        this.size[i] = 1.2 + r() * 2.6
        break
      case 'grid-pulse':
        this.x[i] = r() * this.width
        this.y[i] = r() * this.height
        this.vx[i] = 0
        this.vy[i] = 0
        this.size[i] = 1.2
        break
      default: // dust, constellation
        this.x[i] = r() * this.width
        this.y[i] = r() * this.height
        this.vx[i] = (r() - 0.5) * 8
        this.vy[i] = (r() - 0.5) * 8
        this.size[i] = 1 + r() * 1.8
    }
  }

  /** Advances the simulation. `delta` is in seconds. */
  step(delta: number) {
    const { width, height } = this
    for (let i = 0; i < this.count; i++) {
      if (this.preset === 'grid-pulse') continue

      this.x[i]! += this.vx[i]! * delta
      this.y[i]! += this.vy[i]! * delta

      // Brownian wander for the floating presets.
      if (this.preset === 'dust' || this.preset === 'constellation') {
        this.vx[i]! += (this.random() - 0.5) * 2 * delta
        this.vy[i]! += (this.random() - 0.5) * 2 * delta
        this.vx[i] = Math.max(-12, Math.min(12, this.vx[i]!))
        this.vy[i] = Math.max(-12, Math.min(12, this.vy[i]!))
        // Wrap instead of respawning: the field stays evenly covered.
        if (this.x[i]! < 0) this.x[i] = width
        if (this.x[i]! > width) this.x[i] = 0
        if (this.y[i]! < 0) this.y[i] = height
        if (this.y[i]! > height) this.y[i] = 0
        continue
      }

      // Sideways drift for rising particles.
      if (this.preset === 'embers' || this.preset === 'spores') {
        this.vx[i]! += Math.sin((this.y[i]! + this.seedValue[i]! * 500) * 0.01) * 6 * delta
      }

      const gone = this.y[i]! < -24 || this.y[i]! > height + 24
        || this.x[i]! < -40 || this.x[i]! > width + 40
      if (gone) this.spawn(i, false)
    }
  }

  /** Re-lays the field for a new size without reallocating. */
  resize(width: number, height: number) {
    const scaleX = width / (this.width || width)
    const scaleY = height / (this.height || height)
    this.width = width
    this.height = height
    for (let i = 0; i < this.count; i++) {
      this.x[i]! *= scaleX
      this.y[i]! *= scaleY
    }
  }
}
