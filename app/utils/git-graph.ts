/**
 * Layout of the Parcours' `git log --graph` — pure functions, no DOM.
 *
 * The page draws the graph one row at a time: each row is a commit (a mission,
 * an internship, a degree) and its graph cell has to know, for every branch,
 * whether the branch passes above the commit's dot, below it, forks off main
 * underneath it, or merges back into main above it. That is decided here from
 * dates alone, so the picture cannot disagree with the history it draws.
 *
 * Time runs downwards (newest first, as `git log` prints it). A row's dot sits
 * at its commit's date; the half-cell above the dot is "a little later", the
 * half below "a little earlier".
 */

/** `YYYY-MM`, compared as a number of months. */
export type YearMonth = `${number}-${number}${number}`

export function months(value: YearMonth): number {
  const [year, month] = value.split('-').map(Number)
  return year! * 12 + (month! - 1)
}

export interface GraphBranch {
  id: string
  /** 0 is main; the rest are drawn to its right. */
  lane: number
  from: YearMonth
  /** Undefined while the branch is still open (the current employer). */
  to?: YearMonth
}

export interface GraphCommit {
  id: string
  branch: string
  from: YearMonth
}

export type SegmentShape = 'none' | 'line' | 'fork' | 'merge'

export interface LaneCell {
  lane: number
  branch: string
  /** Half-cell above the dot. `merge` curves into main at the top edge. */
  up: SegmentShape
  /** Half-cell below the dot. `fork` curves out of main at the bottom edge. */
  down: SegmentShape
  /** The row's own commit sits on this lane. */
  dot: boolean
}

export interface GraphRow {
  commit: string
  cells: LaneCell[]
}

/**
 * For each commit (newest first), what every branch draws in that row.
 *
 * Main (lane 0) is drawn from its first commit to the top of the graph: it is
 * the line everything else leaves from and comes back to.
 */
export function layoutGraph(branches: readonly GraphBranch[], commits: readonly GraphCommit[]): GraphRow[] {
  const sorted = [...commits].sort((a, b) => months(b.from) - months(a.from))
  const main = branches.find(branch => branch.lane === 0)

  return sorted.map((commit) => {
    const at = months(commit.from)

    const cells = branches.map<LaneCell>((branch) => {
      const start = months(branch.from)
      const end = branch.to === undefined ? Number.POSITIVE_INFINITY : months(branch.to)
      const dot = commit.branch === branch.id

      if (branch === main) {
        return {
          lane: 0,
          branch: branch.id,
          up: at >= start ? 'line' : 'none',
          down: at > start ? 'line' : 'none',
          dot,
        }
      }

      // Alive just after this commit's date / just before it.
      const aliveAbove = start <= at && at < end
      const aliveBelow = start < at && at <= end

      let up: SegmentShape = aliveAbove ? 'line' : 'none'
      let down: SegmentShape = aliveBelow ? 'line' : 'none'

      // The branch starts with this very commit: it came out of main below it.
      if (dot && at === start) down = 'fork'
      // A branch that starts between this row and the next one down, without a
      // commit of its own there, still has to leave main somewhere visible.
      if (!dot && aliveAbove && !aliveBelow) down = 'fork'
      // The branch ends before the next commit up: it goes back into main
      // above this row.
      if (aliveAbove && !isAliveAt(end, sorted, commit)) up = 'merge'

      return { lane: branch.lane, branch: branch.id, up, down, dot }
    })

    return { commit: commit.id, cells: cells.filter(cell => cell.up !== 'none' || cell.down !== 'none' || cell.dot) }
  })
}

/**
 * Whether a branch ending at `end` is still alive at the next commit up the
 * graph from `commit`. When it is not, its last visible stretch is the top of
 * this row, and that is where it merges.
 */
function isAliveAt(end: number, sorted: readonly GraphCommit[], commit: GraphCommit): boolean {
  if (!Number.isFinite(end)) return true
  const index = sorted.indexOf(commit)
  const above = sorted[index - 1]
  if (!above) return false
  return months(above.from) <= end
}

/**
 * A short, stable pseudo-hash for a commit, like the ones `git log` prints.
 * FNV-1a over the id: the same seven characters on the server and the client.
 */
export function shortHash(id: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0')
  return hex.slice(0, 7)
}
