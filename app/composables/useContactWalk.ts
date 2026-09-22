/**
 * The contact scene's walk, as one number (SPEC §6.7).
 *
 * `--walk` runs 0 → 1 over the stretch of scroll that begins the moment the
 * rail's track parks with the contact scene full screen, and ends at the
 * bottom of the page. The rail owns that split — see `WALK_SPAN` and
 * `splitScroll` in `app/utils/rail-geometry.ts` — so there is no geometry to
 * re-derive here and nothing that can fall out of step with it.
 *
 * CSS gets the same number without going through JS at all on engines with
 * scroll-driven animations: every transform in the scene is keyed straight off
 * the scroll timeline over the same range. This composable is for the
 * decisions CSS cannot make — chiefly whether the Knight has arrived and
 * should be sitting — and for the fallback path, where the rail publishes
 * `--walk` on `<html>` each frame.
 */
export function useContactWalk() {
  const rail = useRail()

  /**
   * True once the Knight reaches the bench. A discrete swap, so it is driven
   * from JS on both rail paths: a frame of lag on a state change nobody can
   * perceive beats keeping two animation systems in step.
   */
  const arrived = computed(() => rail.walk.value >= 0.985)

  return { walk: rail.walk, arrived }
}
