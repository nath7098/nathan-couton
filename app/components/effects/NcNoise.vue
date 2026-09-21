<script setup lang="ts">
/**
 * Film grain over the whole page (SPEC §5.5).
 *
 * One inlined SVG turbulence, stepped through eight offsets — the texture is
 * generated once by the browser, never per frame. It unifies the surfaces and
 * breaks the banding in the large gradients.
 */
</script>

<template>
  <div
    class="noise"
    aria-hidden="true"
  />
</template>

<style scoped>
.noise {
  position: fixed;
  /* The grain shifts by at most 2%, so a 4% margin covers it. `inset: -50%`
     made the blended surface four times the viewport, which measured as half
     the frame budget on its own. */
  inset: -4%;
  z-index: 9998;
  pointer-events: none;
  /* No mix-blend-mode.
     `overlay` across the viewport doubled the frame time on its own (median
     16.7ms → 33.3ms, p95 33ms → 83ms, measured). Plain alpha keeps the texture
     and costs nothing. Slightly higher opacity compensates for the lost blend. */
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: nc-grain 800ms steps(8) infinite;
}

@keyframes nc-grain {
  0% { transform: translate(0, 0); }
  12.5% { transform: translate(-2%, 1%); }
  25% { transform: translate(1%, -2%); }
  37.5% { transform: translate(-1%, 2%); }
  50% { transform: translate(2%, 1%); }
  62.5% { transform: translate(1%, 2%); }
  75% { transform: translate(-2%, -1%); }
  87.5% { transform: translate(2%, -2%); }
}

:root[data-motion='reduced'] .noise {
  animation: none;
}
</style>
