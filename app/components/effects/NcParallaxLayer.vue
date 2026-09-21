<script setup lang="ts">
/**
 * A parallax layer (SPEC §5.2).
 *
 * Depth drives two things in CSS: how far the layer shifts against the rail
 * (negative goes with the background, positive leads), and how much it answers
 * the pointer. Nothing is written per frame — the layer reads the rail's and
 * the pointer's custom properties.
 */
withDefaults(defineProps<{
  /** −1 → 1. Negative trails the rail, positive leads it. */
  depth?: number
  /** Horizontal amplitude, any CSS length. */
  amplitude?: string
  /** Extra scale applied across the scene's sweep. */
  scaleWith?: number
}>(), { depth: 0, amplitude: '12vw', scaleWith: 0 })
</script>

<template>
  <div
    class="parallax-layer"
    :style="{
      '--depth': depth,
      '--amplitude': amplitude,
      '--scale-with': scaleWith,
    }"
    aria-hidden="true"
  >
    <slot />
  </div>
</template>

<style scoped>
.parallax-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
  transform:
    translate3d(
      calc(
        (var(--scene-progress, 0.5) - 0.5) * var(--depth) * var(--amplitude)
        + var(--pointer-x, 0) * var(--depth) * 1.2vw
      ),
      calc(var(--pointer-y, 0) * var(--depth) * 0.8vh),
      0
    )
    scale(calc(1 + var(--scale-with) * var(--scene-progress, 0)));
}

/* Reduced motion pins every layer at its mid position. */
:root[data-motion='reduced'] .parallax-layer {
  transform: none;
}
</style>
