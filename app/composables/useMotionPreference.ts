/**
 * Single source of truth for motion preference (SPEC §5.1.5).
 *
 * Mirrors `prefers-reduced-motion` onto `<html data-motion>` so CSS can key off
 * one attribute, and exposes the boolean for the rare effect that has to be
 * skipped in JS (particle fields, the rAF rail fallback).
 */
export function useMotionPreference() {
  const reduced = useState('nc-motion-reduced', () => false)

  if (import.meta.client) {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const apply = () => {
      reduced.value = query.matches
      document.documentElement.dataset.motion = query.matches ? 'reduced' : 'full'
    }

    onMounted(() => {
      apply()
      useEventListener(query, 'change', apply)
    })
  }

  return {
    reduced: readonly(reduced),
    /** Convenience for `duration: motionOk ? 900 : 0` style call sites. */
    motionOk: computed(() => !reduced.value),
  }
}
