<script setup lang="ts">
import type { Project } from '~/data/projects'
import { projectStatus } from '~/data/projects'

/**
 * One project, drawn as a spec sheet.
 *
 * A status pip and an index at the top, then the project's own figure
 * (`NcProjectMotif`) in a band of its own, then the fields: year, context,
 * role, stack, links. Every field has a fixed number of lines, so the cards in
 * a row are exactly the same height whatever their text — which is what the
 * old cards, ranging from 288px to 366px, were not.
 */
const props = defineProps<{ project: Project, index: number, total: number }>()

const { t, locale } = useI18n()

/** v1 built the old-site link from the active locale: ancien-fr / ancien-en. */
const links = computed(() => props.project.links.map(link => ({
  ...link,
  href: link.href.replace('{locale}', locale.value),
})))

const title = computed(() => t(props.project.titleKey))
const status = computed(() => projectStatus(props.project))

const statusLabel = computed(() => t({
  live: 'projectsSection.statusLive',
  source: 'projectsSection.statusSource',
  closed: 'projectsSection.statusClosed',
}[status.value]))

/** The card's hue: the first technology it was built with. */
const accent = computed(() => `var(--tech-${props.project.tags[0]?.tech ?? 'vue'}-accent)`)

const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <article
    class="pc"
    :style="{ '--card-accent': accent }"
  >
    <header class="pc__head">
      <span
        class="pc__led"
        :data-status="status"
        aria-hidden="true"
      />
      <span class="pc__state">{{ statusLabel }}</span>
      <span class="pc__index">{{ pad(index + 1) }} / {{ pad(total) }}</span>
    </header>

    <div
      class="pc__art"
      aria-hidden="true"
    >
      <NcProjectMotif
        :motif="project.motif"
        :seed="project.id"
      />
    </div>

    <div class="pc__body">
      <h3 class="pc__title">
        {{ title }}
      </h3>
      <p class="pc__desc">
        {{ t(project.descriptionKey) }}
      </p>

      <dl class="pc__rows">
        <div class="pc__row">
          <dt class="pc__key">
            {{ t('projectsSection.labelYear') }}
          </dt>
          <dd class="pc__val">
            {{ t(project.yearKey) }}
          </dd>
        </div>
        <div class="pc__row">
          <dt class="pc__key">
            {{ t('projectsSection.labelContext') }}
          </dt>
          <dd class="pc__val pc__val--1">
            {{ t(project.contextKey) }}
          </dd>
        </div>
        <div class="pc__row">
          <dt class="pc__key">
            {{ t('projectsSection.labelRole') }}
          </dt>
          <dd class="pc__val pc__val--2">
            {{ t(project.roleKey) }}
          </dd>
        </div>
        <div class="pc__row pc__row--stack">
          <dt class="pc__key">
            {{ t('projectsSection.labelStack') }}
          </dt>
          <dd class="pc__val">
            <NcTag
              v-for="tag in project.tags"
              :key="tag.label"
              size="sm"
              :label="tag.label"
              :tech="tag.tech"
            />
          </dd>
        </div>
        <div class="pc__row pc__row--links">
          <dt class="pc__key">
            {{ t('projectsSection.labelLinks') }}
          </dt>
          <dd class="pc__val">
            <template v-if="links.length">
              <a
                v-for="link in links"
                :key="link.href"
                class="pc__link"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="t(link.kind === 'repo'
                  ? 'projectsSection.viewRepo'
                  : 'projectsSection.viewLive', { name: title })"
              >
                <NcIcon :name="link.kind === 'repo' ? 'gitlab' : 'eye'" />
                {{ link.kind === 'repo' ? t('projectsSection.linkRepo') : t('projectsSection.linkLive') }}
              </a>
            </template>
            <span
              v-else
              class="pc__none"
            >—</span>
          </dd>
        </div>
      </dl>
    </div>
  </article>
</template>

<style scoped>
.pc {
  --motif-ink: color-mix(in oklab, var(--card-accent) 60%, transparent);

  /* Read by NcProjectMotif: 0 leaves the figure half-drawn, 1 finishes it. */
  --motif-lit: 0;

  /* How far an accent is pulled towards the text colour to stay readable.
     White needs more help than black does. */
  --ink-mix: 70%;

  display: grid;
  grid-template-rows: auto auto 1fr;
  inline-size: clamp(15.5rem, 18.5vw, 18.5rem);
  background: var(--editor);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-1);
  overflow: hidden;
  isolation: isolate;
  transition:
    border-color var(--dur-base) var(--ease-out-expo),
    box-shadow var(--dur-slow) var(--ease-out-expo),
    transform var(--dur-slow) var(--ease-out-expo);
}

@media (hover: hover) {
  .pc:hover,
  .pc:focus-within {
    --motif-lit: 1;

    border-color: color-mix(in oklab, var(--card-accent) 58%, var(--surface-faint));
    box-shadow: var(--shadow-3);
    transform: translateY(-4px);
  }
}

.pc:focus-within {
  border-color: color-mix(in oklab, var(--card-accent) 58%, var(--surface-faint));
}

/* ── Head ───────────────────────────────────────────────────────────────── */

.pc__head {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0.45rem var(--space-xs);
  font-size: 0.64rem;
  color: var(--surface-dim);
  border-block-end: 1px solid color-mix(in oklab, var(--surface) 12%, transparent);
}

.pc__led {
  inline-size: 0.42rem;
  block-size: 0.42rem;
  border-radius: 50%;
  background: var(--card-accent);
  box-shadow: 0 0 0 0 color-mix(in oklab, var(--card-accent) 55%, transparent);
  transition: box-shadow var(--dur-slow) var(--ease-out-expo);
}

/* A project that never became public gets a hollow pip, not a lit one. */
.pc__led[data-status='closed'] {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--surface-faint);
}

@media (hover: hover) {
  .pc:hover .pc__led:not([data-status='closed']) {
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--card-accent) 22%, transparent);
  }
}

.pc__state {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc__index {
  color: var(--surface-dim);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── The figure ─────────────────────────────────────────────────────────── */

/* Its own band, edge to edge. The motif viewBox has this aspect ratio, so the
   figure fills the band exactly instead of floating in it. */
.pc__art {
  aspect-ratio: 300 / 132;
  color: var(--motif-ink);
  background: radial-gradient(
    120% 90% at 50% 115%,
    color-mix(in oklab, var(--card-accent) 14%, transparent),
    transparent 72%
  );
  border-block-end: 1px solid color-mix(in oklab, var(--surface) 10%, transparent);
  opacity: 0.72;
  transition: opacity var(--dur-slow) var(--ease-out-expo);
}

@media (hover: hover) {
  .pc:hover .pc__art,
  .pc:focus-within .pc__art {
    opacity: 1;
  }
}

/* ── Fields ─────────────────────────────────────────────────────────────── */

.pc__body {
  display: grid;
  align-content: start;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-xs) var(--space-xs);
}

/* A fixed number of lines each, always: the cards sit side by side and a ragged
   row of different heights reads as a mistake, not as movement. */
.pc__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  min-block-size: calc(2 * 1.28em);
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.28;
  color: var(--surface);
}

.pc__desc {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  min-block-size: calc(3 * 1.6em);
  margin: 0;
  font-size: 0.68rem;
  line-height: 1.6;
  color: var(--surface-dim);
}

.pc__rows {
  display: grid;
  gap: 0.28rem;
  margin: 0;
  padding-block-start: var(--space-3xs);
  border-block-start: 1px solid color-mix(in oklab, var(--surface) 10%, transparent);
}

.pc__row {
  display: grid;
  grid-template-columns: 4.1rem minmax(0, 1fr);
  gap: var(--space-2xs);
  align-items: baseline;
  font-size: 0.64rem;
  line-height: 1.5;
}

.pc__key {
  color: var(--surface-dim);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pc__val {
  margin: 0;
  color: var(--surface-dim);
  overflow-wrap: anywhere;
}

.pc__val--1,
.pc__val--2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pc__val--1 {
  -webkit-line-clamp: 1;
  line-clamp: 1;
  min-block-size: calc(1 * 1.5em);
}

.pc__val--2 {
  -webkit-line-clamp: 2;
  line-clamp: 2;
  min-block-size: calc(2 * 1.5em);
}

/* The one field whose value is a list, and the only one that needs the whole
   card: squeezed into the value column of a narrow card, a four-technology
   stack ran to three rows and lost two of them behind the clip. The label sits
   above instead, and two rows then hold the longest stack at every width.

   A fixed two rows, not a minimum: a card whose stack fits on one line would
   otherwise pull its LIENS row up and break the alignment across the row. A
   small pill is 1.38rem tall and the gap is 0.25rem. */
.pc__row--stack {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.2rem;
}

.pc__row--stack .pc__val {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-content: start;
  block-size: calc(2 * 1.38rem + 0.25rem);
  overflow: hidden;
}

.pc__row--links .pc__val {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}

.pc__link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: inherit;
  text-decoration: none;
  border-radius: var(--radius-s);
  transition: color var(--dur-base) var(--ease-out-expo);
}

.pc__link :deep(svg) {
  inline-size: 0.8rem;
  block-size: 0.8rem;
}

@media (hover: hover) {
  .pc__link:hover {
    color: color-mix(in oklab, var(--card-accent) var(--ink-mix), var(--surface));
  }
}

.pc__none {
  color: var(--surface-dim);
}

/* On white the pale accents (jQuery, React, C++) all but vanish, so the ink is
   pulled towards the text colour instead of towards transparency. */
:root[data-theme='light'] .pc {
  --motif-ink: color-mix(in oklab, var(--card-accent) 62%, var(--surface));
  --ink-mix: 40%;
}

:root[data-motion='reduced'] .pc {
  transition: none;
}

/* A short viewport has to fit the same nine fields. The scene centres itself in
   its row, so content taller than the row spills out of *both* ends — and the
   top end is where the scene's title sits. Rather than let the card overflow,
   it gives up what it can spare: first a line of prose, then the prose
   altogether, then the height of the figure. Measured against the rail's own
   floor of 600px. */
@media (height < 840px) {
  .pc__desc {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    min-block-size: calc(2 * 1.6em);
  }
}

@media (height < 760px) {
  .pc__desc {
    display: none;
  }

  .pc__art {
    max-block-size: 5.5rem;
  }
}

@media (height < 680px) {
  .pc__art {
    max-block-size: 4rem;
  }
}

/* At the rail's own floor the figure is the last thing to go, and it goes. */
@media (height < 620px) {
  .pc__art {
    display: none;
  }
}

/* Without hover there is no reveal to wait for: the figure is simply drawn. */
@media (hover: none) {
  .pc {
    --motif-lit: 1;
  }

  .pc__art {
    opacity: 0.9;
  }
}
</style>
