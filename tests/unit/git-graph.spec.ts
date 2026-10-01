import { describe, expect, it } from 'vitest'
import { BRANCHES, COMMITS, refsFor } from '~/data/parcours'
import { layoutGraph, months, shortHash } from '~/utils/git-graph'

const rows = layoutGraph(BRANCHES, COMMITS)
const row = (id: string) => rows.find(r => r.commit === id)!
const cell = (id: string, branch: string) => row(id).cells.find(c => c.branch === branch)

describe('git graph', () => {
  it('lists commits newest first, like git log', () => {
    const dates = rows.map(r => months(COMMITS.find(c => c.id === r.commit)!.from))
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('puts every commit on its own branch', () => {
    for (const commit of COMMITS) expect(cell(commit.id, commit.branch)?.dot, commit.id).toBe(true)
  })

  it('forks each employer branch out of main under its first commit', () => {
    expect(cell('harmonie', 'catamania')?.down).toBe('fork')
    expect(cell('tempo', 'acii')?.down).toBe('fork')
    expect(cell('sopra-2019', 'sopra')?.down).toBe('fork')
  })

  it('merges finished branches back into main, and leaves the current one open', () => {
    // ACII ended in 2025, after the 2023 training: it merges above that row.
    expect(cell('vue-training', 'acii')?.up).toBe('merge')
    expect(cell('sopra-2020', 'sopra')?.up).toBe('merge')
    expect(cell('harmonie', 'catamania')?.up).toBe('line')
  })

  it('runs main from the first commit to the top', () => {
    expect(cell('iut', 'main')?.down).toBe('none')
    expect(cell('harmonie', 'main')?.up).toBe('line')
  })

  it('decorates branch tips and the degree tag', () => {
    expect(refsFor(COMMITS.find(c => c.id === 'harmonie')!)).toContain('HEAD -> catamania')
    expect(refsFor(COMMITS.find(c => c.id === 'degree')!).some(r => r.startsWith('tag: '))).toBe(true)
  })

  it('prints stable seven-character hashes', () => {
    expect(shortHash('harmonie')).toMatch(/^[0-9a-f]{7}$/)
    expect(shortHash('harmonie')).toBe(shortHash('harmonie'))
    expect(shortHash('harmonie')).not.toBe(shortHash('mpa'))
  })
})
