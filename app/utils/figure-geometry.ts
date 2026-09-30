/**
 * Where an arrow between two boxes of a case-study figure starts and ends —
 * pure geometry, no DOM. The line runs centre to centre and is cut where it
 * leaves each box, plus a small gap, so arrowheads never sit inside a label.
 */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** The point where the ray from `box`'s centre towards (tx, ty) leaves it. */
export function exitPoint(box: Box, tx: number, ty: number, gap = 0): [number, number] {
  const dx = tx - box.x
  const dy = ty - box.y
  if (dx === 0 && dy === 0) return [box.x, box.y]
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : (box.w / 2) / Math.abs(dx)
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : (box.h / 2) / Math.abs(dy)
  const scale = Math.min(scaleX, scaleY)
  const length = Math.hypot(dx, dy)
  const extra = gap / length
  return [box.x + dx * (scale + extra), box.y + dy * (scale + extra)]
}

/** A connector from one box to another, as the two end points. */
export function connector(from: Box, to: Box, gap = 4): { x1: number, y1: number, x2: number, y2: number } {
  const [x1, y1] = exitPoint(from, to.x, to.y, gap)
  const [x2, y2] = exitPoint(to, from.x, from.y, gap)
  const round = (n: number) => Math.round(n * 10) / 10
  return { x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2) }
}
