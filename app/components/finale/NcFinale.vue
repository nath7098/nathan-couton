<script setup lang="ts">
import {
  FINALE_SEGMENTS,
  FINALE_SEGMENTS_NARROW,
  FINALE_SPAN,
  FINALE_SPAN_NARROW,
  finaleMarks,
} from '~/utils/finale-geometry'

/**
 * The finale — where the page stops being a document and becomes a world.
 *
 * Everything above scrolls down like a file. Here the scroll is caught: the
 * stage pins, and the vertical motion of the wheel is spent sideways, on a
 * scene that moves like the side-scroller it comes from. The Knight crosses
 * Greenpath and sits on a bench; the form arrives when he does.
 *
 * Three boxes, three jobs:
 * - `.finale__track` is the scroll budget. Its height is one screen plus the
 *   segments in `finale-geometry.ts`, and it carries the `view-timeline` every
 *   animation in the scene runs on.
 * - `.finale__stage` is sticky inside it: pinned for exactly that budget.
 * - `.finale__dock` holds the form. On a wide screen it shares the track's
 *   grid cell and pins alongside the stage, so the form sits over the scene;
 *   below `--stage-wide` it drops into the flow after the track.
 */
const track = ref<HTMLElement>()
const finale = provideFinale(track)
const { t } = useI18n()

const WIDE = finaleMarks(FINALE_SEGMENTS)
const NARROW = finaleMarks(FINALE_SEGMENTS_NARROW)
</script>

<template>
  <section
    id="contact"
    data-section="contact"
    class="finale"
    :class="{ 'is-arrived': finale.arrived.value, 'is-walking': finale.walking.value }"
    :style="{
      '--span-wide': FINALE_SPAN,
      '--span-narrow': FINALE_SPAN_NARROW,
      '--open-from-wide': WIDE.openFrom,
      '--walk-from-wide': WIDE.walkFrom,
      '--walk-to-wide': WIDE.walkTo,
      '--open-from-narrow': NARROW.openFrom,
      '--walk-from-narrow': NARROW.walkFrom,
    }"
    aria-labelledby="contact-title"
  >
    <h2
      id="contact-title"
      class="nc-sr-only"
    >
      {{ t('sections.contact.title') }}
    </h2>

    <div
      ref="track"
      class="finale__track"
    >
      <div class="finale__stage">
        <NcHollowScene />
        <NcTerminal />
      </div>
    </div>

    <div class="finale__dock">
      <NcContactPanel />
    </div>
  </section>
</template>

<style scoped>
.finale {
  /* Narrow first; the wide layout overrides. Reduced motion collapses the
     budget to nothing below — no scroll is spent on a sequence that will not
     play. */
  --finale-span: var(--span-narrow);
  --open-from: var(--open-from-narrow);
  --walk-from: var(--walk-from-narrow);
  --walk-to: var(--walk-from-narrow);

  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  /* The finale's animations reach the dock too, which is not inside the track
     that declares the timeline. */
  timeline-scope: --finale;
}

@media (--stage-wide) {
  .finale {
    --finale-span: var(--span-wide);
    --open-from: var(--open-from-wide);
    --walk-from: var(--walk-from-wide);
    --walk-to: var(--walk-to-wide);
  }
}

@media (prefers-reduced-motion: reduce) {
  .finale {
    --finale-span: 0;
  }
}

:root[data-motion='reduced'] .finale {
  --finale-span: 0;
}

.finale__track {
  grid-area: 1 / 1;
  block-size: calc((1 + var(--finale-span)) * 100svh);
  view-timeline: --finale block;
}

.finale__stage {
  position: sticky;
  inset-block-start: 0;
  block-size: 100svh;
  overflow: clip;
  background: #0b1a1f;
}

/* ── The dock ──────────────────────────────────────────────────────────────
   Below `--stage-wide`: the second row, in the flow, always there. */
.finale__dock {
  grid-area: 2 / 1;
  padding: var(--space-xl) var(--gutter) var(--space-2xl);
  background: #0b1a1f;
}

@media (--stage-wide) {
  /* Same cell as the track, and as tall: sticky, it pins for exactly as long
     as the stage does, so the form holds still over the scene. It is a full
     screen of air, centred on the right; only the panel takes clicks. */
  .finale__dock {
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    grid-area: 1 / 1;
    align-self: start;
    display: grid;
    align-items: center;
    justify-items: end;
    block-size: 100svh;
    padding: var(--header-h) var(--gutter) var(--space-l);
    background: none;
    pointer-events: none;
  }

  .finale__dock > :deep(*) {
    pointer-events: auto;
  }
}
</style>
