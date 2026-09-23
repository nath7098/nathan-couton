/**
 * Generative artwork for the project cards — pure functions, no DOM.
 *
 * Each project used to carry a 1355×678 PNG: two flat colour blocks with a
 * ringed circle repeating the title. Those said nothing the card did not
 * already say, and their brand colours fought the palette. They are gone.
 *
 * What replaces them is drawn from the project itself: the travelling-salesman
 * solver gets a tour, the Hololens gets a depth cloud, the moneybox gets
 * stacking coins. The geometry is seeded by the project id, so a given project
 * always draws the same figure — server and client included, which matters
 * because these ship in the prerendered HTML.
 *
 * Shapes are emitted as data rather than markup so they can be unit-tested and
 * so the component stays a dumb renderer. Coordinates live in the viewBox below.
 */

/** Motif viewBox. Cards scale it; nothing here depends on the rendered size. */
export const MOTIF_WIDTH = 300
export const MOTIF_HEIGHT = 132

export type MotifKey
  = | 'tour' | 'cloud' | 'stream' | 'layers' | 'coins' | 'wave' | 'wireframe' | 'strokes'

export interface MotifDot { kind: 'dot', x: number, y: number, r: number, o: number }
export interface MotifBar { kind: 'bar', x: number, y: number, w: number, h: number, o: number }
/** `len` is the traced length, used for the stroke-dash reveal on hover. */
export interface MotifPath { kind: 'path', d: string, len: number, o: number }

export type MotifShape = MotifDot | MotifBar | MotifPath

/** mulberry32, seeded by a string. Small, and identical on every engine. */
function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One decimal is enough at this scale and keeps the prerendered HTML small. */
const r1 = (n: number) => Math.round(n * 10) / 10

function polyline(points: [number, number][], close: boolean): MotifPath {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('') + (close ? 'Z' : '')
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1])
  }
  if (close && points.length > 1) {
    len += Math.hypot(points[0]![0] - points.at(-1)![0], points[0]![1] - points.at(-1)![1])
  }
  return { kind: 'path', d, len: Math.ceil(len), o: 1 }
}

/** A closed tour over scattered cities — the problem the project solves. */
function tour(seed: string): MotifShape[] {
  const next = rng(seed)
  const cities: [number, number][] = Array.from({ length: 12 }, () => [
    22 + next() * (MOTIF_WIDTH - 44),
    18 + next() * (MOTIF_HEIGHT - 36),
  ])
  // Visiting by angle around the centroid is not the optimal tour, but it is a
  // valid one and it never self-intersects, which is what reads as "solved".
  const cx = cities.reduce((s, c) => s + c[0], 0) / cities.length
  const cy = cities.reduce((s, c) => s + c[1], 0) / cities.length
  const ordered = [...cities].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx))
  return [
    polyline(ordered, true),
    ...cities.map<MotifShape>(([x, y]) => ({ kind: 'dot', x: r1(x), y: r1(y), r: 2.6, o: 0.85 })),
  ]
}

/** A depth map read as a point cloud: denser and larger as it comes forward. */
function cloud(seed: string): MotifShape[] {
  const next = rng(seed)
  const out: MotifShape[] = []
  // Rows and columns are deliberately few: eight of these sit inside the rail's
  // transformed track, and every node in them is re-rastered as it slides.
  for (let row = 0; row < 6; row++) {
    const t = row / 5
    for (let col = 0; col < 18; col++) {
      const x = MOTIF_WIDTH / 2 + (col - 8.5) * (9 + t * 8)
      const y = 26 + row * 18 + Math.sin(col * 0.7 + row * 1.1) * 4.5
      if (x < 8 || x > MOTIF_WIDTH - 8) continue
      out.push({ kind: 'dot', x: r1(x), y: r1(y), r: r1(1.1 + t * 1.8), o: r1(0.22 + t * 0.62 - next() * 0.12) })
    }
  }
  return out
}

/**
 * Code seen from too far to read: indent guides, and runs of tokens that open
 * and close blocks. Flat rows of equal bars would have read as a skeleton
 * loader, which is the one thing a card must never look like.
 */
function stream(seed: string): MotifShape[] {
  const next = rng(seed)
  const out: MotifShape[] = []
  const INDENT = 16
  let depth = 0
  const depths: number[] = []
  for (let row = 0; row < 9; row++) {
    depths.push(depth)
    const roll = next()
    if (roll > 0.62 && depth < 3) depth++
    else if (roll < 0.22 && depth > 0) depth--
  }
  // Guides first, so the tokens sit over them.
  for (let level = 1; level <= 3; level++) {
    const rows = depths.map((d, i) => (d >= level ? i : -1)).filter(i => i >= 0)
    if (!rows.length) continue
    out.push({
      kind: 'bar',
      x: 22 + level * INDENT,
      y: 10 + rows[0]! * 12,
      w: 1,
      h: (rows.at(-1)! - rows[0]! + 1) * 12,
      o: 0.22,
    })
  }
  for (let row = 0; row < depths.length; row++) {
    let x = 26 + depths[row]! * INDENT
    for (let token = 0; token < 4; token++) {
      const w = 10 + next() * 40
      if (x + w > MOTIF_WIDTH - 20) break
      out.push({ kind: 'bar', x: r1(x), y: 10 + row * 12, w: r1(w), h: 3, o: r1(0.25 + next() * 0.5) })
      x += w + 6
      if (next() > 0.68) break
    }
  }
  return out
}

/** Cover layered over cover — the shape of an insurance product. */
function layers(_seed: string): MotifShape[] {
  const out: MotifShape[] = []
  for (let i = 0; i < 6; i++) {
    const y = 22 + i * 16
    const half = 92 - i * 10
    out.push({
      ...polyline([
        [MOTIF_WIDTH / 2 - half, y], [MOTIF_WIDTH / 2, y - 10],
        [MOTIF_WIDTH / 2 + half, y], [MOTIF_WIDTH / 2, y + 10],
      ], true),
      o: r1(0.9 - i * 0.11),
    })
  }
  return out
}

/** Columns that stack up, coin by coin. */
function coins(seed: string): MotifShape[] {
  const next = rng(seed)
  const out: MotifShape[] = []
  for (let col = 0; col < 7; col++) {
    const height = 2 + Math.floor(next() * 6)
    for (let i = 0; i < height; i++) {
      out.push({
        kind: 'bar',
        x: 30 + col * 36,
        y: MOTIF_HEIGHT - 18 - i * 11,
        w: 28,
        h: 7,
        o: r1(0.25 + (i / 8) * 0.6),
      })
    }
  }
  return out
}

/** A swallow, recorded: the trace and the envelope that bounds it. */
function wave(seed: string): MotifShape[] {
  const next = rng(seed)
  const mid = MOTIF_HEIGHT / 2
  const trace: [number, number][] = []
  const top: [number, number][] = []
  const bottom: [number, number][] = []
  for (let i = 0; i <= 46; i++) {
    const x = 12 + (i / 46) * (MOTIF_WIDTH - 24)
    const bell = Math.exp(-(((i - 20) / 11) ** 2)) + 0.55 * Math.exp(-(((i - 34) / 5) ** 2))
    const amp = bell * 42
    trace.push([x, mid + Math.sin(i * 1.4) * amp * (0.55 + next() * 0.45)])
    top.push([x, mid - amp])
    bottom.push([x, mid + amp])
  }
  return [
    { ...polyline(top, false), o: 0.3 },
    { ...polyline(bottom, false), o: 0.3 },
    { ...polyline(trace, false), o: 0.9 },
  ]
}

/** The first page anyone lays out: header, columns, footer. */
function wireframe(_seed: string): MotifShape[] {
  const frame = (x: number, y: number, w: number, h: number, o: number): MotifPath => ({
    ...polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true),
    o,
  })
  return [
    frame(24, 14, MOTIF_WIDTH - 48, 22, 0.85),
    frame(24, 44, 88, 68, 0.6),
    frame(120, 44, 72, 30, 0.6),
    frame(120, 82, 72, 30, 0.45),
    frame(200, 44, MOTIF_WIDTH - 248, 68, 0.6),
  ]
}

/** Brush sweeps, loaded at the start and lifting at the end. */
function strokes(seed: string): MotifShape[] {
  const next = rng(seed)
  const out: MotifShape[] = []
  for (let i = 0; i < 7; i++) {
    const y = 16 + i * 17
    const x0 = 16 + next() * 26
    const x1 = MOTIF_WIDTH - 20 - next() * 70
    const sag = 5 + next() * 9
    const points: [number, number][] = []
    for (let k = 0; k <= 8; k++) {
      const t = k / 8
      points.push([x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI) * sag])
    }
    out.push({ ...polyline(points, false), o: r1(0.85 - i * 0.08) })
  }
  return out
}

const BUILDERS: Record<MotifKey, (seed: string) => MotifShape[]> = {
  tour, cloud, stream, layers, coins, wave, wireframe, strokes,
}

/**
 * Shapes for one project's motif. `seed` is the project id, so two projects
 * sharing a motif kind still draw differently.
 */
export function motifShapes(key: MotifKey, seed: string): MotifShape[] {
  return BUILDERS[key](seed)
}
