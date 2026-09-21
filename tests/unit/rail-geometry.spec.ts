import { describe, expect, it } from 'vitest'
import { SCENES, TOTAL_SPAN } from '~/data/scenes'
import { activeSceneAt, progressForScene, sceneBounds, sceneProgressAt, travel } from '~/utils/rail-geometry'

const bounds = sceneBounds(SCENES)

describe('rail geometry', () => {
  it('lays scenes end to end without gaps', () => {
    expect(bounds[0]!.start).toBe(0)
    for (let i = 1; i < bounds.length; i++) {
      expect(bounds[i]!.start).toBe(bounds[i - 1]!.end)
    }
    expect(bounds.at(-1)!.end).toBe(TOTAL_SPAN)
  })

  it('travels one viewport less than the track width', () => {
    expect(travel(TOTAL_SPAN)).toBe(TOTAL_SPAN - 1)
    expect(travel(1)).toBe(0)
    expect(travel(0.5)).toBe(0)
  })

  it('starts at 0 and orders scene targets along the rail', () => {
    expect(progressForScene(bounds, 'home', TOTAL_SPAN)).toBe(0)

    // Targets align a scene's LEFT edge with the viewport. The last scene is two
    // viewports wide, so its target is short of 1 — the tail of the rail shows
    // its second half. Progress 1 must still land inside it.
    // The last scene's target sits short of 1 by its own extra width: it is
    // `(TOTAL_SPAN - span) / (TOTAL_SPAN - 1)`, not a fixed 0.9-something.
    const contact = progressForScene(bounds, 'contact', TOTAL_SPAN)
    const contactSpan = SCENES.at(-1)!.span
    expect(contact).toBeCloseTo((TOTAL_SPAN - contactSpan) / (TOTAL_SPAN - 1))
    expect(contact).toBeLessThan(1)
    expect(activeSceneAt(bounds, contact, TOTAL_SPAN)).toBe('contact')

    const targets = SCENES.map(s => progressForScene(bounds, s.id, TOTAL_SPAN))
    expect(targets).toEqual([...targets].sort((a, b) => a - b))
  })

  it('lands on the intended scene for every nav target', () => {
    for (const scene of SCENES) {
      const target = progressForScene(bounds, scene.id, TOTAL_SPAN)
      expect(activeSceneAt(bounds, target, TOTAL_SPAN)).toBe(scene.id)
    }
  })

  it('never returns a progress outside [0, 1]', () => {
    for (const scene of SCENES) {
      const p = progressForScene(bounds, scene.id, TOTAL_SPAN)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('reports the scene under the viewport centre', () => {
    expect(activeSceneAt(bounds, 0, TOTAL_SPAN)).toBe('home')
    expect(activeSceneAt(bounds, 1, TOTAL_SPAN)).toBe('contact')
  })

  it('activates each scene somewhere along the rail', () => {
    const seen = new Set<string>()
    for (let i = 0; i <= 400; i++) seen.add(activeSceneAt(bounds, i / 400, TOTAL_SPAN))
    expect([...seen].sort()).toEqual(SCENES.map(s => s.id).sort())
  })

  it('advances a scene from 0 to 1 as it crosses the viewport', () => {
    const first = sceneProgressAt(bounds, 'home', 0, TOTAL_SPAN)
    const last = sceneProgressAt(bounds, 'home', 1, TOTAL_SPAN)
    expect(first).toBeGreaterThan(0)
    expect(last).toBe(1)
  })

  it('keeps scene progress monotonic', () => {
    let previous = -1
    for (let i = 0; i <= 200; i++) {
      const value = sceneProgressAt(bounds, 'projects', i / 200, TOTAL_SPAN)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('is clamped for scenes far off screen', () => {
    expect(sceneProgressAt(bounds, 'contact', 0, TOTAL_SPAN)).toBe(0)
  })

  it('returns neutral values for an unknown scene', () => {
    expect(progressForScene(bounds, 'blog' as never, TOTAL_SPAN)).toBe(0)
    expect(sceneProgressAt(bounds, 'blog' as never, 0.5, TOTAL_SPAN)).toBe(0)
  })
})
