import { describe, expect, it } from 'vitest'
import { SCENES, TOTAL_SPAN } from '~/data/scenes'
import {
  WALK_SPAN,
  activeSceneAt,
  lockFraction,
  progressForScene,
  sceneBounds,
  sceneProgressAt,
  scrollSpan,
  splitScroll,
  travel,
} from '~/utils/rail-geometry'

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

    // Targets align a scene's LEFT edge with the viewport, so the last scene's
    // target is `(TOTAL_SPAN - span) / (TOTAL_SPAN - 1)` — which is exactly 1
    // while that scene is one viewport wide, and short of 1 if it is ever
    // widened again. Either way it must land inside it.
    const contact = progressForScene(bounds, 'contact', TOTAL_SPAN)
    const contactSpan = SCENES.at(-1)!.span
    expect(contact).toBeCloseTo((TOTAL_SPAN - contactSpan) / (TOTAL_SPAN - 1))
    expect(contact).toBeLessThanOrEqual(1)
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

/**
 * The walk budget is scroll the track does not consume. These are the
 * guarantees the contact scene is built on: the track is parked for every
 * frame of the walk, and the walk starts at exactly 0 the instant it parks.
 */
describe('the contact walk budget', () => {
  it('adds the walk to the track travel, and nothing else', () => {
    expect(scrollSpan(TOTAL_SPAN)).toBe(travel(TOTAL_SPAN) + WALK_SPAN)
    expect(WALK_SPAN).toBeGreaterThan(0)
  })

  it('locks part-way through the scrollbar, leaving room for the walk', () => {
    const lock = lockFraction(TOTAL_SPAN)
    expect(lock).toBeGreaterThan(0)
    expect(lock).toBeLessThan(1)
    expect(lock).toBeCloseTo(travel(TOTAL_SPAN) / scrollSpan(TOTAL_SPAN))
  })

  it('hands the whole scrollbar to the track when there is no walk', () => {
    // travel(1) is 0: a single-viewport rail is all walk and no track.
    expect(lockFraction(1)).toBe(0)
    expect(splitScroll(0.4, 1)).toEqual({ progress: 1, walk: 0.4 })
  })

  it('runs the track first and the walk second, never both at once', () => {
    const lock = lockFraction(TOTAL_SPAN)

    expect(splitScroll(0, TOTAL_SPAN)).toEqual({ progress: 0, walk: 0 })
    expect(splitScroll(lock, TOTAL_SPAN).progress).toBeCloseTo(1)
    expect(splitScroll(lock, TOTAL_SPAN).walk).toBeCloseTo(0)
    expect(splitScroll(1, TOTAL_SPAN)).toEqual({ progress: 1, walk: 1 })

    // Mid-track the walk has not begun; mid-walk the track is fully parked.
    expect(splitScroll(lock / 2, TOTAL_SPAN).walk).toBe(0)
    expect(splitScroll((lock + 1) / 2, TOTAL_SPAN).progress).toBe(1)
  })

  it('keeps both halves monotonic and inside [0, 1]', () => {
    let lastProgress = -1
    let lastWalk = -1
    for (let i = 0; i <= 400; i++) {
      const { progress, walk } = splitScroll(i / 400, TOTAL_SPAN)
      expect(progress).toBeGreaterThanOrEqual(lastProgress)
      expect(walk).toBeGreaterThanOrEqual(lastWalk)
      expect(progress).toBeLessThanOrEqual(1)
      expect(walk).toBeLessThanOrEqual(1)
      lastProgress = progress
      lastWalk = walk
    }
  })

  it('parks the last scene full screen at the lock point', () => {
    // The scene the walk belongs to has to be the one on screen when the track
    // stops, or the walk animates something nobody is looking at.
    const lock = lockFraction(TOTAL_SPAN)
    const { progress } = splitScroll(lock, TOTAL_SPAN)
    expect(activeSceneAt(bounds, progress, TOTAL_SPAN)).toBe('contact')
    expect(SCENES.at(-1)!.span).toBe(1)
  })
})
