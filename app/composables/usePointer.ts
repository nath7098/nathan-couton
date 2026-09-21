import { lerp } from '~/utils/math'

/**
 * Smoothed pointer position, published as --pointer-x / --pointer-y on <html>
 * in the range −1 → 1 (SPEC §5.2b).
 *
 * Written once per frame as two custom properties; every parallax layer and
 * spotlight reads them in CSS. Off on coarse pointers and reduced motion.
 */
export function providePointer() {
  if (import.meta.server) return

  const { reduced } = useMotionPreference()
  const target = { x: 0, y: 0 }
  const current = { x: 0, y: 0 }
  let enabled = false

  onMounted(() => {
    enabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced.value
    if (!enabled) return

    useEventListener(window, 'pointermove', (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      target.x = (event.clientX / window.innerWidth) * 2 - 1
      target.y = (event.clientY / window.innerHeight) * 2 - 1
    }, { passive: true })
  })

  useFrameLoop(() => {
    if (!enabled) return
    current.x = lerp(current.x, target.x, 0.08)
    current.y = lerp(current.y, target.y, 0.08)
    const style = document.documentElement.style
    style.setProperty('--pointer-x', current.x.toFixed(4))
    style.setProperty('--pointer-y', current.y.toFixed(4))
  })
}
