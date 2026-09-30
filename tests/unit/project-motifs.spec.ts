import { describe, expect, it } from 'vitest'
import { ARCHIVE, CASE_STUDIES, STEPS } from '~/data/projects'
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
  it('gives every case study and archive entry its own id', () => {
    const ids = [...CASE_STUDIES, ...ARCHIVE].map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses motifs that exist', () => {
    for (const study of CASE_STUDIES) {
      if (study.figure.kind === 'motif') expect(KEYS).toContain(study.figure.motif)
    }
  })

  it('draws every diagram inside its viewBox, with edges between real nodes', () => {
    for (const study of CASE_STUDIES) {
      if (study.figure.kind !== 'graph') continue
      const ids = new Set(study.figure.nodes.map(node => node.id))
      for (const node of study.figure.nodes) {
        expect(node.x - node.w / 2, `${study.id}/${node.id}`).toBeGreaterThanOrEqual(0)
        expect(node.x + node.w / 2, `${study.id}/${node.id}`).toBeLessThanOrEqual(400)
        expect(node.y - node.h / 2, `${study.id}/${node.id}`).toBeGreaterThanOrEqual(0)
        expect(node.y + node.h / 2, `${study.id}/${node.id}`).toBeLessThanOrEqual(300)
      }
      for (const edge of study.figure.edges) {
        expect(ids.has(edge.from) && ids.has(edge.to), `${study.id}: ${edge.from} → ${edge.to}`).toBe(true)
      }
    }
  })

  it('lights something at every step of every diagram', () => {
    for (const study of CASE_STUDIES) {
      if (study.figure.kind !== 'graph') continue
      for (const step of STEPS) {
        expect(study.figure.nodes.some(node => node.lit.includes(step)), `${study.id} is dark at ${step}`).toBe(true)
      }
    }
  })

  it('never links client work under NDA', () => {
    for (const study of CASE_STUDIES.filter(s => s.nda)) expect(study.links).toEqual([])
  })
})
