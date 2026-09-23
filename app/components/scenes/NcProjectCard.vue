<script setup lang="ts">
import type { Project } from '~/data/projects'
import { projectStatus } from '~/data/projects'

/**
 * One project, drawn as a file open in an editor.
 *
 * The card is a fixed grid of eleven code lines — meta, title, description,
 * import — so the gutter numbers always line up with what is beside them and
 * every card in the row is exactly the same height, whatever its text. Behind
 * the lines sits the project's own figure (`NcProjectMotif`), which finishes
 * drawing itself when the card is hovered or focused.
 */
const props = defineProps<{ project: Project }>()

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

/** `Vue 2` reads as one identifier once the space is gone. */
const imports = computed(() => props.project.tags.map(tag => ({
  name: tag.label.replace(/\s+/g, ''),
  accent: `var(--tech-${tag.tech}-accent)`,
})))

/**
 * The gutter, as one text node rather than thirteen elements. Eight cards live
 * inside the rail's transformed track and every node in them is re-rastered as
 * it slides; thirteen spans each was a hundred and four boxes for thirteen
 * numbers. One line height per row is all it takes to keep them aligned.
 */
const GUTTER = Array.from({ length: 13 }, (_, i) => i + 1).join('\n')
</script>

<template>
  <article
    class="pc"
    :style="{ '--card-accent': accent }"
  >
    <header class="pc__bar">
      <span
        class="pc__pip"
        :data-status="status"
        aria-hidden="true"
      />
      <span class="pc__file">{{ project.file }}</span>
      <span class="pc__year">{{ project.year }}</span>
    </header>

    <div class="pc__code">
      <div
        class="pc__art"
        aria-hidden="true"
      >
        <NcProjectMotif
          :motif="project.motif"
          :seed="project.id"
        />
      </div>

      <div
        class="pc__gutter"
        aria-hidden="true"
      >
        {{ GUTTER }}
      </div>

      <p class="pc__meta">
        <span aria-hidden="true">// </span>{{ t(project.metaKey) }}
      </p>

      <h3 class="pc__title">
        {{ title }}
      </h3>

      <p class="pc__desc">
        {{ t(project.descriptionKey) }}
      </p>

      <p class="pc__import">
        <span class="pc__kw">import</span> {
        <template
          v-for="(item, index) in imports"
          :key="item.name"
        >
          <span
            class="pc__id"
            :style="{ '--id-accent': item.accent }"
          >{{ item.name }}</span><span>{{ index < imports.length - 1 ? ', ' : ' ' }}</span>
        </template>}
      </p>
    </div>

    <footer class="pc__foot">
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
          {{ link.kind === 'repo' ? t('projectsSection.statusSource') : t('projectsSection.statusLive') }}
        </a>
      </template>
      <span
        v-else
        class="pc__status"
      >{{ statusLabel }}</span>
    </footer>
  </article>
</template>

<style scoped>
.pc {
  /* One code line. Every row of the card is a whole number of these, which is
     what keeps the gutter honest and the cards the same height. */
  --lh: 1.2rem;
  --motif-ink: color-mix(in oklab, var(--card-accent) 60%, transparent);

  /* How far an accent is pulled towards the text colour to stay readable.
     White needs more help than black does. */
  --ink-mix: 70%;

  /* Read by NcProjectMotif: 0 leaves the figure half-drawn, 1 finishes it. */
  --motif-lit: 0;

  display: grid;
  grid-template-rows: auto 1fr auto;
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
    border-color: color-mix(in oklab, var(--card-accent) 58%, var(--surface-faint));
    box-shadow: var(--shadow-3);
    transform: translateY(-4px);
  }
}

.pc:focus-within {
  border-color: color-mix(in oklab, var(--card-accent) 58%, var(--surface-faint));
}

/* ── Title bar ──────────────────────────────────────────────────────────── */

.pc__bar {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0.45rem var(--space-xs);
  font-size: 0.68rem;
  color: var(--surface-dim);
  background: color-mix(in oklab, var(--surface) 8%, var(--editor));
  border-block-end: 1px solid color-mix(in oklab, var(--surface) 12%, transparent);
}

.pc__pip {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 50%;
  background: var(--card-accent);
  transition: box-shadow var(--dur-slow) var(--ease-out-expo);
}

/* A project that never became public gets a hollow pip, not a lit one. */
.pc__pip[data-status='closed'] {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--surface-faint);
}

.pc__file {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc__year {
  color: var(--surface-dim);
  white-space: nowrap;
}

/* ── Code area ──────────────────────────────────────────────────────────── */

/* Explicit rows, so the gutter numbers mean something:
   1-2 context · 3 blank · 4-5 title · 6 blank · 7-10 description · 11 blank ·
   12-13 import. */
.pc__code {
  position: relative;
  display: grid;
  grid-template-columns: 2.2rem minmax(0, 1fr);
  grid-template-rows: repeat(13, var(--lh));
  padding: var(--space-2xs) var(--space-xs) var(--space-2xs) 0;
}

/* The figure is a watermark, and a watermark that competes with the words has
   failed. It sits behind the context line and the title — the six rows above
   the description — stops at the gutter so the line numbers stay readable, and
   is gone before the first word of prose. */
.pc__art {
  position: absolute;
  z-index: -1;
  inset: calc(var(--lh) * -0.3) var(--space-xs) auto 2.2rem;
  block-size: calc(var(--lh) * 6.6);
  color: var(--motif-ink);
  opacity: 0.48;
  transition: opacity var(--dur-slow) var(--ease-out-expo);
  /* No mask: the figure already stops above the description, and a masked
     layer inside the rail's transformed track cost a whole frame quantum —
     33ms median became 50ms, measured back to back. */
}

@media (hover: hover) {
  .pc:hover,
  .pc:focus-within {
    --motif-lit: 1;
  }

  .pc:hover .pc__art,
  .pc:focus-within .pc__art {
    opacity: 0.88;
  }
}

.pc__gutter {
  grid-row: 1 / -1;
  align-self: start;
  white-space: pre;
  font-size: 0.6rem;
  line-height: var(--lh);

  /* A real gutter is nearly invisible; this one clears 4.5:1 instead, because
     axe cannot know that the numbers mean nothing. Between --surface-faint and
     --surface-dim, and measured rather than guessed. */
  color: color-mix(in oklab, var(--surface) 60%, var(--background));
  text-align: end;
  padding-inline-end: var(--space-2xs);
  user-select: none;
  border-inline-end: 1px solid color-mix(in oklab, var(--surface) 9%, transparent);
  transition: color var(--dur-base) var(--ease-out-expo);
}

@media (hover: hover) {
  .pc:hover .pc__gutter,
  .pc:focus-within .pc__gutter {
    color: color-mix(in oklab, var(--card-accent) 60%, transparent);
  }
}

.pc__meta,
.pc__title,
.pc__desc,
.pc__import {
  grid-column: 2;
  min-inline-size: 0;
  margin: 0;
  padding-inline-start: var(--space-2xs);
}

.pc__meta {
  grid-row: 1 / span 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.63rem;
  line-height: var(--lh);
  color: var(--surface-dim);
}

.pc__title {
  grid-row: 4 / span 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.26;
  color: var(--surface);
}

/* The caret only makes sense once the file is "open". */
.pc__title::after {
  content: '';
  display: inline-block;
  inline-size: 0.5em;
  block-size: 1.05em;
  margin-inline-start: 0.12em;
  vertical-align: -0.16em;
  background: var(--card-accent);
  opacity: 0;
}

@media (hover: hover) {
  .pc:hover .pc__title::after,
  .pc:focus-within .pc__title::after {
    opacity: 1;
    animation: pc-caret 1.1s steps(1, end) infinite;
  }
}

@keyframes pc-caret {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* Four lines for everyone. The full text stays in the DOM for search engines. */
.pc__desc {
  grid-row: 7 / span 4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  overflow: hidden;
  font-size: 0.7rem;
  line-height: 1.71;
  color: var(--surface-dim);
}

.pc__import {
  grid-row: 12 / span 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.64rem;
  line-height: 1.55;
  color: var(--surface-dim);
  overflow-wrap: anywhere;
}

/* The tech accents were picked to sit inside a tag's border, not to be read as
   text: raw, jQuery blue is 1.3:1 on the light editor and Bootstrap purple is
   2.4:1 on the dark one. Pulling each one towards the text colour keeps the hue
   recognisable and clears 4.5:1 — the same calibration --primary-text gets in
   tokens.css, and the percentages are measured, not judged by eye. */
.pc__kw {
  color: color-mix(in oklab, var(--card-accent) var(--ink-mix), var(--surface));
}

.pc__id {
  color: color-mix(in oklab, var(--id-accent) var(--ink-mix), var(--surface));
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

.pc__foot {
  display: flex;
  gap: var(--space-s);
  padding: 0.4rem var(--space-xs);
  font-size: 0.64rem;
  color: var(--surface-dim);
  border-block-start: 1px solid color-mix(in oklab, var(--surface) 10%, transparent);
  background: color-mix(in oklab, var(--surface) 8%, var(--editor));
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
  inline-size: 0.85rem;
  block-size: 0.85rem;
}

@media (hover: hover) {
  .pc__link:hover {
    color: var(--card-accent);
  }
}

.pc__status {
  font-style: italic;
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

:root[data-motion='reduced'] .pc__title::after {
  animation: none;
}

/* Without hover there is no reveal to wait for: the figure is simply drawn. */
@media (hover: none) {
  .pc {
    --motif-lit: 1;
  }

  .pc__art {
    opacity: 0.55;
  }
}

:root[data-motion='reduced'] .pc {
  --motif-lit: 1;
}
</style>
