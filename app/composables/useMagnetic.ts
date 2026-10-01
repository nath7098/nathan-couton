import type { Ref } from 'vue'

/**
 * Pulls an element a little towards the pointer while it is over it — the
 * hero's main call to action leans into the hand that is about to press it.
 *
 * One `translate` written per pointer event, on one small element: no loop,
 * no layout read beyond the element's own box on entry. Off for touch, coarse
 * pointers and reduced motion, where it would be motion nobody asked for.
 */
export function useMagnetic(target: Ref<HTMLElement | { $el: HTMLElement } | undefined>, strength = 0.28) {
  const { reduced } = useMotionPreference()

  onMounted(() => {
    const raw = target.value
    const el = raw instanceof HTMLElement ? raw : raw?.$el
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let box: DOMRect | null = null
    el.style.transition = 'translate 420ms var(--ease-spring)'

    useEventListener(el, 'pointerenter', () => {
      box = el.getBoundingClientRect()
    })
    useEventListener(el, 'pointermove', (event: PointerEvent) => {
      if (!box || reduced.value) return
      const x = (event.clientX - (box.left + box.width / 2)) * strength
      const y = (event.clientY - (box.top + box.height / 2)) * strength
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
    })
    useEventListener(el, 'pointerleave', () => {
      box = null
      el.style.translate = '0 0'
    })
  })
}
