import { describe, expect, it } from 'vitest'
import { SCENE_IDS, SCENES, TOTAL_SPAN, isSceneId } from '~/data/scenes'

describe('scene registry', () => {
  it('keeps the seven sections of the v1 site, in order', () => {
    expect(SCENE_IDS).toEqual([
      'home', 'about', 'experience', 'skills', 'education', 'projects', 'contact',
    ])
  })

  it('exposes one meta entry per id', () => {
    expect(SCENES.map(scene => scene.id)).toEqual([...SCENE_IDS])
  })

  it('sums the spans used to size the scroll proxy', () => {
    // Asserted as a sum, not a fixed number: spans are a pacing decision and
    // get re-tuned (contact went 2 → 3 to give the Knight room to walk).
    expect(TOTAL_SPAN).toBe(SCENES.reduce((sum, s) => sum + s.span, 0))
    expect(TOTAL_SPAN).toBeGreaterThan(SCENES.length)
  })

  it('gives every scene a positive span', () => {
    for (const scene of SCENES) expect(scene.span).toBeGreaterThan(0)
  })

  it('narrows arbitrary strings to scene ids', () => {
    expect(isSceneId('projects')).toBe(true)
    expect(isSceneId('blog')).toBe(false)
  })
})
