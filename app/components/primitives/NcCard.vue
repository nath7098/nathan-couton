<script setup lang="ts">
/**
 * Elevated surface with a cursor spotlight and a slight 3D tilt.
 *
 * The pointer position is written as custom properties on the element, once per
 * frame, and everything visual follows in CSS — no style writes per property.
 */
const props = withDefaults(defineProps<{
  interactive?: boolean
  /** Tilt amplitude in degrees; 0 disables it. */
  tilt?: number
}>(), { interactive: false, tilt: 3.5 })

const root = ref<HTMLElement>()
const { reduced } = useMotionPreference()

let frame = 0

function onPointerMove(event: PointerEvent) {
  if (!props.interactive || reduced.value || event.pointerType !== 'mouse') return
  const el = root.value
  if (!el) return

  cancelAnimationFrame(frame)
  const { clientX, clientY } = event
  frame = requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    el.style.setProperty('--card-mx', `${(x * 100).toFixed(2)}%`)
    el.style.setProperty('--card-my', `${(y * 100).toFixed(2)}%`)
    el.style.setProperty('--card-rx', `${((0.5 - y) * props.tilt).toFixed(2)}deg`)
    el.style.setProperty('--card-ry', `${((x - 0.5) * props.tilt).toFixed(2)}deg`)
  })
}

function onPointerLeave() {
  cancelAnimationFrame(frame)
  const el = root.value
  if (!el) return
  el.style.setProperty('--card-rx', '0deg')
  el.style.setProperty('--card-ry', '0deg')
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <div
    ref="root"
    class="nc-card"
    :class="{ 'is-interactive': interactive }"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <div
      class="nc-card__spotlight"
      aria-hidden="true"
    />
    <slot />
  </div>
</template>

<style scoped>
.nc-card {
  --card-mx: 50%;
  --card-my: 50%;
  --card-rx: 0deg;
  --card-ry: 0deg;

  position: relative;
  display: grid;
  background: var(--editor);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-1);
  isolation: isolate;
  transition:
    box-shadow var(--dur-slow) var(--ease-out-expo),
    transform var(--dur-slow) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo);
}

.nc-card.is-interactive {
  transform: perspective(900px) rotateX(var(--card-rx)) rotateY(var(--card-ry));
  transform-style: preserve-3d;
}

/* Spotlight follows the pointer; hidden until the card is hovered. */
.nc-card__spotlight {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  opacity: 0;
  background: radial-gradient(
    18rem circle at var(--card-mx) var(--card-my),
    color-mix(in oklab, var(--primary) 18%, transparent),
    transparent 70%
  );
  transition: opacity var(--dur-slow) var(--ease-out-expo);
}

@media (hover: hover) {
  .nc-card.is-interactive:hover {
    border-color: color-mix(in oklab, var(--primary) 45%, var(--surface-faint));
    box-shadow: var(--shadow-3);
  }

  .nc-card.is-interactive:hover .nc-card__spotlight {
    opacity: 1;
  }
}

:root[data-motion='reduced'] .nc-card.is-interactive {
  transform: none;
}
</style>
