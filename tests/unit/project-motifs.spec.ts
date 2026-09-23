import { describe, expect, it } from 'vitest'
import { PROJECTS, projectStatus } from '~/data/projects'
import type { MotifKey } from '~/utils/project-motifs'
import { MOTIF_HEIGHT, MOTIF_WIDTH, motifShapes } from '~/utils/project-motifs'

const KEYS: MotifKey[] = ['tour', 'cloud', 'stream', 'layers', 'coins', 'wave', 'wireframe', 'strokes', 'flow']

/** Every coordinate a shape puts on screen, so bounds can be checked at once. */
function extent(key: MotifKey, seed: string) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const shape of motifShapes(key, seed)) {
    const points: [number, number][] = shape.kind === 'dot'
      ? [[shape.x - shape.r, shape.y - shape.r], [shape.x + shape.r, shape.y + shape.r]]
      : shape.kind === 'bar'
        ? [[shape.x, shape.y], [shape.x + shape.w, shape.y + shape.h]]
        : [...shape.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])])
    for (const [x, y] of points) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  return { minX, maxX, minY, maxY }
}

describe('project motifs', () => {
  it('draws the same figure every time, which SSR and the client both depend on', () => {
    for (const key of KEYS) {
      const first = JSON.stringify(motifShapes(key, 'seed'))
      const second = JSON.stringify(motifShapes(key, 'seed'))
      expect(second, `${key} is not deterministic`).toBe(first)
    }
  })

  it('draws a different figure for a different project', () => {
    // Two projects can share a motif kind; the seed is what keeps them apart.
    const a = JSON.stringify(motifShapes('stream', 'portfolio'))
    const b = JSON.stringify(motifShapes('stream', 'first-website'))
    expect(a).not.toBe(b)
  })

  it('stays inside the viewBox, so nothing is clipped at the card edge', () => {
    for (const key of KEYS) {
      const { minX, maxX, minY, maxY } = extent(key, key)
      expect(minX, `${key} overflows left`).toBeGreaterThanOrEqual(0)
      expect(maxX, `${key} overflows right`).toBeLessThanOrEqual(MOTIF_WIDTH)
      expect(minY, `${key} overflows top`).toBeGreaterThanOrEqual(0)
      expect(maxY, `${key} overflows bottom`).toBeLessThanOrEqual(MOTIF_HEIGHT)
    }
  })

  it('emits a traced length for every path', () => {
    for (const key of KEYS) {
      for (const shape of motifShapes(key, key)) {
        if (shape.kind === 'path') expect(shape.len, `${key} has a zero-length path`).toBeGreaterThan(0)
      }
    }
  })
})

describe('projects', () => {
  it('gives every project its own motif seed', () => {
    const ids = PROJECTS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses motifs that exist', () => {
    for (const project of PROJECTS) expect(KEYS).toContain(project.motif)
  })

  it('gives every project its own motif', () => {
    const motifs = PROJECTS.map(p => p.motif)
    expect(new Set(motifs).size, 'two projects share a figure').toBe(motifs.length)
  })

  it('reads the status off the links rather than storing it twice', () => {
    expect(projectStatus(PROJECTS.find(p => p.id === 'integration')!)).toBe('closed')
    expect(projectStatus(PROJECTS.find(p => p.id === 'prevoyance')!)).toBe('closed')
    expect(projectStatus(PROJECTS.find(p => p.id === 'portfolio')!)).toBe('source')
    expect(projectStatus(PROJECTS.find(p => p.id === 'tsp')!)).toBe('live')
  })
})
