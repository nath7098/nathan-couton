<script setup lang="ts">
import type { FigureSpec } from '~/data/projects'
import { connector } from '~/utils/figure-geometry'

/**
 * A case study's figure: a generic architecture diagram, or a project's own
 * motif. Everything is drawn at rest — the old project cards drew their
 * figures to 42% and waited for a hover that nobody skimming nine cards would
 * give them.
 *
 * Which boxes are lit follows the step being read: the case study sets
 * `data-step` on itself and each node carries the steps it belongs to in
 * `data-lit`. Without that attribute (no JS, reduced motion), everything is lit.
 */
const props = defineProps<{ figure: FigureSpec, caseId: string }>()

const { t } = useI18n()

const nodes = computed(() => (props.figure.kind === 'graph' ? props.figure.nodes : []))

const edges = computed(() => {
  if (props.figure.kind !== 'graph') return []
  const byId = Object.fromEntries(nodes.value.map(node => [node.id, node]))
  return props.figure.edges.map(edge => ({
    ...edge,
    ...connector(byId[edge.from]!, byId[edge.to]!, 5),
  }))
})

const markerId = computed(() => `arrow-${props.caseId}`)
</script>

<template>
  <div class="figure">
    <svg
      v-if="figure.kind === 'graph'"
      class="figure__svg"
      viewBox="0 0 400 300"
      role="img"
      :aria-label="t(`projects.cases.${caseId}.figureLabel`)"
    >
      <defs>
        <marker
          :id="markerId"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M0 1 L9 5 L0 9 z"
            class="figure__arrowhead"
          />
        </marker>
      </defs>

      <g class="figure__edges">
        <line
          v-for="edge in edges"
          :key="`${edge.from}-${edge.to}`"
          class="figure__edge"
          :data-lit="edge.lit.join(' ')"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          :marker-end="`url(#${markerId})`"
        />
      </g>

      <g
        v-for="node in nodes"
        :key="node.id"
        class="figure__node"
        :class="`is-${node.role}`"
        :data-lit="node.lit.join(' ')"
      >
        <rect
          :x="node.x - node.w / 2"
          :y="node.y - node.h / 2"
          :width="node.w"
          :height="node.h"
          :rx="node.role === 'store' ? node.h / 2 : 8"
        />
        <text
          :x="node.x"
          :y="node.tech ? node.y - 3 : node.y + 4"
          text-anchor="middle"
          class="figure__label"
        >{{ t(`projects.cases.${caseId}.nodes.${node.id}`) }}</text>
        <text
          v-if="node.tech"
          :x="node.x"
          :y="node.y + 12"
          text-anchor="middle"
          class="figure__tech"
        >{{ node.tech }}</text>
      </g>
    </svg>

    <div
      v-else
      class="figure__motif"
      role="img"
      :aria-label="t(`projects.cases.${caseId}.figureLabel`)"
    >
      <NcProjectMotif
        :motif="figure.motif"
        :seed="caseId"
        animate
      />
    </div>
  </div>
</template>

<style scoped>
.figure {
  position: relative;
  padding: var(--space-m);
  background:
    radial-gradient(circle at 80% 10%, var(--brand-soft), transparent 60%),
    var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
}

.figure__svg {
  inline-size: 100%;
  block-size: auto;
  overflow: visible;
}

.figure__node rect {
  fill: var(--bg);
  stroke: var(--line-strong);
  stroke-width: 1;
}

.figure__node.is-process rect { stroke: var(--brand); }
.figure__node.is-bus rect { stroke: var(--warm); stroke-dasharray: 4 3; }
.figure__node.is-ui rect { fill: var(--brand-soft); stroke: var(--brand); }
.figure__node.is-store rect { stroke: var(--text-dim); }
.figure__node.is-actor rect { fill: none; stroke-dasharray: 2 3; }

.figure__label {
  font-family: var(--font-text);
  font-size: 11px;
  font-weight: 600;
  fill: var(--text);
}

.figure__tech {
  font-family: var(--font-mono);
  font-size: 9px;
  fill: var(--brand-ink);
}

.figure__edge {
  stroke: var(--text-dim);
  stroke-width: 1.3;
  stroke-dasharray: 5 4;
}

.figure__arrowhead {
  fill: var(--text-dim);
}

/* Data moving along the pipes. Paint-only, on a handful of short lines. */
@media (prefers-reduced-motion: no-preference) {
  .figure__edge {
    animation: flow 1.1s linear infinite;
  }
}

@keyframes flow {
  to { stroke-dashoffset: -9; }
}

:root[data-motion='reduced'] .figure__edge {
  animation: none;
}

/* ── Following the text ────────────────────────────────────────────────────
   The dimming itself is written by NcCaseStudy, which owns `data-step`. */
.figure__node,
.figure__edge {
  transition: opacity var(--dur-slow) var(--ease-out-expo);
}

.figure__motif {
  aspect-ratio: 300 / 170;
  color: var(--brand-ink);
}
</style>
