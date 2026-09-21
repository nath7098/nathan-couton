<script setup lang="ts">
import { lerp } from '~/utils/math'

/**
 * Custom cursor (SPEC §5.4) — a lagging disc that grows over interactive
 * elements.
 *
 * The native cursor is never hidden: this rides on top of it. Hiding it would
 * break text selection and form fields for the sake of decoration.
 */
const { reduced } = useMotionPreference()

const dot = ref<HTMLElement>()
const enabled = ref(false)
const hovering = ref(false)

const target = { x: 0, y: 0 }
const current = { x: 0, y: 0 }

onMounted(() => {
  enabled.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced.value
  if (!enabled.value) return

  useEventListener(window, 'pointermove', (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    target.x = event.clientX
    target.y = event.clientY

    // Grows over anything the pointer can act on.
    const el = event.target as HTMLElement | null
    hovering.value = Boolean(el?.closest('a, button, [role="button"], input, textarea, summary'))
  }, { passive: true })

  current.x = window.innerWidth / 2
  current.y = window.innerHeight / 2
})

useFrameLoop(() => {
  if (!enabled.value || !dot.value) return
  current.x = lerp(current.x, target.x, 0.18)
  current.y = lerp(current.y, target.y, 0.18)
  dot.value.style.transform = `translate3d(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px, 0) translate(-50%, -50%)`
}, enabled)
</script>

<template>
  <div
    v-if="enabled"
    ref="dot"
    class="cursor"
    :class="{ 'is-hovering': hovering }"
    aria-hidden="true"
  />
</template>

<style scoped>
.cursor {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  z-index: 9997;
  inline-size: 1.65rem;
  block-size: 1.65rem;
  border: 1px solid color-mix(in oklab, var(--primary) 70%, transparent);
  border-radius: 50%;
  pointer-events: none;
  transition:
    inline-size var(--dur-base) var(--ease-spring),
    block-size var(--dur-base) var(--ease-spring),
    background-color var(--dur-base) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo);
}

.cursor.is-hovering {
  inline-size: 2.6rem;
  block-size: 2.6rem;
  background: color-mix(in oklab, var(--primary) 14%, transparent);
  border-color: var(--primary);
}
</style>
