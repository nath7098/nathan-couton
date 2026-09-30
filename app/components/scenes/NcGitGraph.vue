<script setup lang="ts">
import { BRANCHES, COMMITS, refsFor, type Commit } from '~/data/parcours'
import { layoutGraph, shortHash, type LaneCell } from '~/utils/git-graph'

/**
 * The Parcours, drawn as `git log --graph`.
 *
 * Each row is an ordinary list item — a title, a period, a few lines, a
 * stack — so the whole history reads (and searches) as text. The graph cell
 * beside it is decoration, computed from dates by `layoutGraph()`: straight
 * segments are borders, the fork and merge curves are small SVGs, so nothing
 * stretches when a row grows taller.
 */
const { t, tm, rt } = useI18n()

const rows = computed(() => {
  const layout = layoutGraph(BRANCHES, COMMITS)
  return layout.map((row) => {
    const commit = COMMITS.find(c => c.id === row.commit)! as Commit
    return { commit, cells: row.cells, refs: refsFor(commit), hash: shortHash(commit.id) }
  })
})

const LANES = Math.max(...BRANCHES.map(b => b.lane)) + 1

function points(id: string): string[] {
  const list: unknown = tm(`parcours.${id}.points` as never)
  return Array.isArray(list) ? list.map(item => rt(item as never)) : []
}

const cellStyle = (cell: LaneCell) => ({ '--lane': cell.lane })
</script>

<template>
  <ol
    class="graph"
    :style="{ '--lanes': LANES }"
  >
    <li
      v-for="row in rows"
      :id="`commit-${row.commit.id}`"
      :key="row.commit.id"
      class="commit nc-reveal"
      :class="[`commit--${row.commit.kind}`, { 'commit--minor': row.commit.minor }]"
    >
      <div
        class="commit__graph"
        aria-hidden="true"
      >
        <template
          v-for="cell in row.cells"
          :key="cell.branch"
        >
          <span
            v-if="cell.up === 'line'"
            class="lane lane--up"
            :class="`is-${cell.branch}`"
            :style="cellStyle(cell)"
          />
          <span
            v-if="cell.down === 'line'"
            class="lane lane--down"
            :class="`is-${cell.branch}`"
            :style="cellStyle(cell)"
          />
          <template v-if="cell.up === 'merge'">
            <span
              class="lane lane--to-curve-up"
              :class="`is-${cell.branch}`"
              :style="cellStyle(cell)"
            />
            <svg
              class="curve curve--merge"
              :class="`is-${cell.branch}`"
              :style="cellStyle(cell)"
              viewBox="0 0 10 10"
              preserveAspectRatio="none"
            >
              <path
                d="M10 10 C10 4 0 6 0 0"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </template>
          <template v-if="cell.down === 'fork'">
            <span
              class="lane lane--to-curve-down"
              :class="`is-${cell.branch}`"
              :style="cellStyle(cell)"
            />
            <svg
              class="curve curve--fork"
              :class="`is-${cell.branch}`"
              :style="cellStyle(cell)"
              viewBox="0 0 10 10"
              preserveAspectRatio="none"
            >
              <path
                d="M10 0 C10 6 0 4 0 10"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </template>
          <span
            v-if="cell.dot"
            class="dot"
            :class="[`is-${cell.branch}`, `dot--${row.commit.kind}`]"
            :style="cellStyle(cell)"
          />
        </template>
      </div>

      <div class="commit__body">
        <p class="commit__meta">
          <span class="commit__hash">{{ row.hash }}</span>
          <span
            v-for="ref in row.refs"
            :key="ref"
            class="commit__ref"
            :class="{ 'is-head': ref.startsWith('HEAD'), 'is-tag': ref.startsWith('tag') }"
          >{{ ref }}</span>
          <span class="commit__period">{{ t(`parcours.${row.commit.id}.period`) }}</span>
        </p>

        <h3 class="commit__title">
          {{ t(`parcours.${row.commit.id}.title`) }}
        </h3>

        <template v-if="!row.commit.minor">
          <p class="commit__role">
            {{ t(`parcours.${row.commit.id}.role`) }}
          </p>

          <p class="commit__summary">
            {{ t(`parcours.${row.commit.id}.summary`) }}
          </p>

          <ul
            v-if="points(row.commit.id).length"
            class="commit__points"
          >
            <li
              v-for="point in points(row.commit.id)"
              :key="point"
            >
              {{ point }}
            </li>
          </ul>

          <ul
            v-if="row.commit.stack"
            class="commit__stack"
            :aria-label="t('parcours.stackLabel')"
          >
            <li
              v-for="item in row.commit.stack"
              :key="item"
            >
              <NcTag
                size="sm"
                :label="item"
              />
            </li>
          </ul>
        </template>
        <p
          v-else
          class="commit__summary commit__summary--minor"
        >
          {{ t(`parcours.${row.commit.id}.summary`) }}
        </p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.graph {
  --lane-w: 1.6rem;
  --dot-y: 2.05rem;
  --curve-h: 1.4rem;

  display: grid;
  padding: 0;
  margin: 0;
  list-style: none;
}

.commit {
  display: grid;
  grid-template-columns: calc(var(--lanes) * var(--lane-w) + 1rem) minmax(0, 1fr);
  gap: clamp(0.75rem, 2vw, 2rem);
  scroll-margin-top: calc(var(--header-h) + var(--space-m));
}

/* ── The graph cell ────────────────────────────────────────────────────── */
.commit__graph {
  position: relative;
  min-block-size: 100%;
}

.lane,
.dot,
.curve {
  --x: calc(var(--lane) * var(--lane-w) + var(--lane-w) / 2);
  --c: var(--line-strong);

  position: absolute;
}

.is-catamania { --c: var(--brand); }
.is-acii { --c: oklch(0.7 0.11 265); }
.is-sopra { --c: var(--warm); }

.lane {
  inset-inline-start: calc(var(--x) - 1px);
  inline-size: 2px;
  background: var(--c);
}

.lane--up {
  inset-block: 0 auto;
  block-size: var(--dot-y);
}

.lane--down {
  inset-block: var(--dot-y) 0;
}

/* The straight part of a lane that ends in a curve. */
.lane--to-curve-up {
  inset-block: var(--curve-h) auto;
  block-size: calc(var(--dot-y) - var(--curve-h));
}

.lane--to-curve-down {
  inset-block: var(--dot-y) var(--curve-h);
}

/* Curves span from main (lane 0) to this lane. */
.curve {
  inset-inline-start: calc(var(--lane-w) / 2);
  inline-size: calc(var(--x) - var(--lane-w) / 2);
  block-size: var(--curve-h);
  overflow: visible;
}

.curve path {
  fill: none;
  stroke: var(--c);
  stroke-width: 2;
}

.curve--merge {
  inset-block-start: 0;
}

.curve--fork {
  inset-block-end: 0;
}

.dot {
  inset-block-start: var(--dot-y);
  inset-inline-start: var(--x);
  inline-size: 0.95rem;
  block-size: 0.95rem;
  background: var(--bg);
  border: 2px solid var(--c);
  border-radius: 50%;
  translate: -50% -50%;
}

.dot--mission {
  background: var(--c);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--c) 18%, transparent);
}

.dot--degree {
  border-radius: 3px;
  rotate: 45deg;
}

.commit--minor .dot {
  inline-size: 0.65rem;
  block-size: 0.65rem;
}

/* ── The entry ─────────────────────────────────────────────────────────── */
.commit__body {
  display: grid;
  gap: var(--space-2xs);
  justify-items: start;
  padding-block: var(--space-s) var(--space-xl);
}

.commit--minor .commit__body {
  gap: var(--space-3xs);
  padding-block-end: var(--space-l);
}

.commit__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.6rem;
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.commit__hash {
  color: var(--warm-ink);
}

.commit__ref {
  padding: 0.05em 0.5em;
  color: var(--text-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
}

.commit__ref.is-head {
  color: var(--on-brand);
  background: var(--brand);
  border-color: var(--brand);
}

.commit__ref.is-tag {
  color: var(--warm-ink);
  border-color: color-mix(in oklab, var(--warm) 50%, transparent);
}

.commit__period {
  color: var(--text-dim);
}

.commit__title {
  font-size: var(--step-3);
  line-height: 1.05;
}

.commit--minor .commit__title,
.commit--school .commit__title,
.commit--degree .commit__title {
  font-size: var(--step-2);
}

.commit__role {
  font-size: var(--step-0);
  font-weight: 600;
  color: var(--brand-ink);
}

.commit__summary {
  max-inline-size: var(--measure);
  color: var(--text-dim);
  text-wrap: pretty;
}

.commit__summary--minor {
  font-size: var(--step--1);
}

.commit__points {
  display: grid;
  gap: var(--space-2xs);
  max-inline-size: var(--measure);
  padding: 0;
  margin: var(--space-2xs) 0 0;
  list-style: none;
}

.commit__points li {
  position: relative;
  padding-inline-start: 1.4em;
  text-wrap: pretty;
}

.commit__points li::before {
  content: '+';
  position: absolute;
  inset-inline-start: 0;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--brand-ink);
}

.commit__stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
  padding: 0;
  margin: var(--space-2xs) 0 0;
  list-style: none;
}

@media (width < 640px) {
  .graph {
    --lane-w: 1.15rem;
  }

  .commit {
    gap: var(--space-2xs);
  }
}
</style>
