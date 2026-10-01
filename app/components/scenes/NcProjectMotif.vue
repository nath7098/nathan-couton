<script setup lang="ts">
import type { MotifKey } from '~/utils/project-motifs'
import { MOTIF_HEIGHT, MOTIF_WIDTH, motifShapes } from '~/utils/project-motifs'

/**
 * The figure behind a project card's text. Geometry comes from
 * `project-motifs.ts`; this component only draws it.
 *
 * Static by default: drawn once, no frame time. With `animate`, a path is
 * traced over and over and the dots along it pulse as the trace reaches them
 * — the TSP solver's tour being walked, which is what its demo does. CSS only,
 * and the static drawing with reduced motion.
 */
const props = defineProps<{ motif: MotifKey, seed: string, animate?: boolean }>()

const shapes = computed(() => motifShapes(props.motif, props.seed))
</script>

<template>
  <svg
    class="motif"
    :class="{ 'is-animated': animate }"
    :viewBox="`0 0 ${MOTIF_WIDTH} ${MOTIF_HEIGHT}`"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    focusable="false"
  >
    <template
      v-for="(shape, index) in shapes"
      :key="index"
    >
      <circle
        v-if="shape.kind === 'dot'"
        class="motif__dot"
        :cx="shape.x"
        :cy="shape.y"
        :r="shape.r"
        :opacity="shape.o"
        :style="shape.at === undefined ? undefined : { '--at': shape.at }"
      />
      <rect
        v-else-if="shape.kind === 'bar'"
        class="motif__bar"
        :x="shape.x"
        :y="shape.y"
        :width="shape.w"
        :height="shape.h"
        rx="2"
        :opacity="shape.o"
      />
      <path
        v-else
        class="motif__path"
        :d="shape.d"
        :opacity="shape.o"
        :style="{ '--len': shape.len, '--n': index }"
      />
    </template>
  </svg>
</template>

<style scoped>
.motif {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
}

/*
  The card raises `--motif-lit` from 0 to 1 when it is hovered or focused.
  Driving the reveal through a custom property rather than a class on the parent
  keeps this component from having to know what contains it — and the transition
  still runs, because it is `stroke-dashoffset` that changes, not the property.

  Only strokes move. Dots and bars used to scale individually on the same
  signal, which put every one of them on its own render surface: with a hundred
  of them inside the rail's transformed track, the p95 scroll frame went from
  83ms to 100ms. They are static now, and the group's opacity — animated once,
  on the card — is what brings them up.
*/

.motif__dot,
.motif__bar {
  fill: var(--motif-ink, currentcolor);
}

/* Drawn in full at rest. It used to stop at 42% and wait for a hover — which
   read as an empty slot to anyone who did not hover. */
.motif__path {
  fill: none;
  stroke: var(--motif-ink, currentcolor);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-dasharray: var(--len);
  stroke-dashoffset: calc(var(--len) * 0.58 * (1 - var(--motif-lit, 1)));
  transition: stroke-dashoffset 900ms var(--ease-out-expo) calc(var(--n) * 55ms);
}

:root[data-motion='reduced'] .motif__path {
  transition: none;
}

/* ── Animated: the tour being walked ──────────────────────────────────────
   One 6s cycle: the trace runs for the first 60%, holds, fades, restarts.
   A city pulses `at × 60%` into the cycle — the moment the trace reaches it. */
@media (prefers-reduced-motion: no-preference) {
  .motif.is-animated .motif__path {
    transition: none;
    animation: motif-trace 6s linear infinite;
  }

  .motif.is-animated .motif__dot {
    transform-box: fill-box;
    transform-origin: center;
    animation: motif-visit 6s var(--ease-out-expo, ease-out) infinite;
    animation-delay: calc(var(--at, 0) * 3.6s);
  }
}

:root[data-motion='reduced'] .motif.is-animated :is(.motif__path, .motif__dot) {
  animation: none;
}

@keyframes motif-trace {
  0% { stroke-dashoffset: var(--len); opacity: 1; }
  60%, 88% { stroke-dashoffset: 0; opacity: 1; }
  97% { stroke-dashoffset: 0; opacity: 0; }
  100% { stroke-dashoffset: var(--len); opacity: 0; }
}

@keyframes motif-visit {
  0% { scale: 1; }
  5% { scale: 2.2; }
  18%, 100% { scale: 1; }
}
</style>
