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
    expect(TOTAL_SPAN).toBeCloseTo(11.5)
    expect(TOTAL_SPAN).toBe(SCENES.reduce((sum, s) => sum + s.span, 0))
  })

  it('gives every scene a positive span', () => {
    for (const scene of SCENES) expect(scene.span).toBeGreaterThan(0)
  })

  it('narrows arbitrary strings to scene ids', () => {
    expect(isSceneId('projects')).toBe(true)
    expect(isSceneId('blog')).toBe(false)
  })
})
