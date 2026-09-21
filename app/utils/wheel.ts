/**
 * Shortest signed step between two positions on a circular list.
 *
 * v1 computed `delta = index - previous` and, when negative, added the count —
 * so stepping back one position spun the wheel almost a full turn forwards.
 * This returns the shorter direction, negative meaning anticlockwise.
 *
 * Exact half-turns resolve forwards, so the motion stays predictable.
 */
export function shortestStep(from: number, to: number, count: number): number {
  if (count <= 0) return 0
  const raw = ((to - from) % count + count) % count
  return raw > count / 2 ? raw - count : raw
}
