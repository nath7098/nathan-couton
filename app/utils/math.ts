/** Clamps `value` into the inclusive [min, max] range. */
export function clamp(value: number, min = 0, max = 1): number {
  return value < min ? min : value > max ? max : value
}

/** Frame-rate independent linear interpolation. */
export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

/** Maps `value` from one range to another, without clamping. */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/** Maps into [0, 1] and clamps. Handy for scene-local progress. */
export function normalize(value: number, min: number, max: number): number {
  return clamp(mapRange(value, min, max, 0, 1))
}
