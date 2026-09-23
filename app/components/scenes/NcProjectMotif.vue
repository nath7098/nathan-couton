<script setup lang="ts">
import type { MotifKey } from '~/utils/project-motifs'
import { MOTIF_HEIGHT, MOTIF_WIDTH, motifShapes } from '~/utils/project-motifs'

/**
 * The figure behind a project card's text. Geometry comes from
 * `project-motifs.ts`; this component only draws it.
 *
 * Nothing animates until the card is hovered, so eight of these on screen cost
 * eight static SVGs and no frame time.
 */
const props = defineProps<{ motif: MotifKey, seed: string }>()

const shapes = computed(() => motifShapes(props.motif, props.seed))
</script>

<template>
  <svg
    class="motif"
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

/* Drawn most of the way at rest: enough to read as a figure, short enough that
   finishing the line is still a reveal. */
.motif__path {
  fill: none;
  stroke: var(--motif-ink, currentcolor);
  stroke-width: 1.1;
  stroke-linejoin: round;
  stroke-dasharray: var(--len);
  stroke-dashoffset: calc(var(--len) * 0.58 * (1 - var(--motif-lit, 0)));
  transition: stroke-dashoffset 900ms var(--ease-out-expo) calc(var(--n) * 55ms);
}

:root[data-motion='reduced'] .motif__path {
  transition: none;
}
</style>
