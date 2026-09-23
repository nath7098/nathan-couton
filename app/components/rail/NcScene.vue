<script setup lang="ts">
import type { SceneMeta } from '~/data/scenes'

/**
 * One scene of the rail. Owns its width (`--scene-span`), its slice of the
 * scroll timeline (`--scene-range-*`) and the landmark semantics.
 */
const props = defineProps<{
  scene: SceneMeta
  index: number
  range: { start: number, end: number }
}>()

const { t } = useI18n()

const number = computed(() => String(props.index + 1).padStart(2, '0'))
const titleId = computed(() => `${props.scene.id}-title`)
</script>

<template>
  <section
    :id="scene.id"
    :data-scene="scene.id"
    class="scene"
    :class="{ 'is-full-bleed': scene.fullBleed }"
    :style="{
      '--scene-span': scene.span,
      '--scene-range-start': range.start,
      '--scene-range-end': range.end,
      '--scene-index': index,
    }"
    :aria-labelledby="titleId"
  >
    <NcParticleField
      :preset="scene.particles"
      :seed="index * 7919 + 13"
    />
    <!-- The scene number and title are the landmark's label. The home scene
         carries the page's only h1, so its title is visually hidden here. -->
    <header class="scene__head">
      <p
        class="scene__number"
        aria-hidden="true"
      >
        {{ number }}
      </p>
      <h2
        :id="titleId"
        class="scene__title nc-braces"
        :class="{ 'nc-sr-only': scene.id === 'home' }"
      >
        {{ t(scene.labelKey) }}
      </h2>
    </header>

    <div class="scene__body">
      <slot>
        <p class="scene__hint">
          {{ t('a11y.sceneOf', { current: index + 1, total: 7 }) }}
        </p>
      </slot>
    </div>
  </section>
</template>

<style scoped>
.scene {
  grid-template-rows: auto 1fr;
  gap: var(--space-m);
  align-content: center;
}

/* ── Full-bleed scenes ─────────────────────────────────────────────────────
   Contact paints a Hollow Knight vista from edge to edge, and every landmark
   inside it — the ground line, the seat of the bench — is measured off that
   artwork as a share of the viewport. So the scene's box has to *be* the
   viewport: no gutter, no padding reserved for the header or the nav, and no
   auto row for the numbered title.

   The title survives as screen-reader text, so the landmark keeps its label;
   the header row simply stops taking up space. Getting this wrong is what
   pushed the old backdrop a hundred-odd pixels down the screen and left a
   white band above it.

   Scoped to the rail on purpose. The stacked layout has no full-bleed scene —
   it is an ordinary section with a backdrop — and hiding the heading there
   would leave the contact section wearing a number and no title. */
@media (--rail) {
  .scene.is-full-bleed {
    grid-template-rows: minmax(0, 1fr);
    gap: 0;
    padding: 0;
  }

  /* Out of flow rather than `display: none`: the <h2> still has to exist for
     the section's `aria-labelledby` to resolve to something. */
  .scene.is-full-bleed .scene__head {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}

.scene__head {
  /* Above any backdrop the scene lays down. Contact's is full-bleed and
     positioned, so without this it paints straight over the scene's title. */
  position: relative;
  z-index: 1;

  /* Being on top is for painting, not for catching clicks. This box runs the
     full width of the scene while the number and the title only take their own
     text, so the empty rest of it was sitting over whatever the scene put near
     its top edge — and on a short viewport, where a dense scene spills up past
     its row, that was the projects filter row: its pills looked normal and
     ignored every click on their upper half. The children take their events
     back so the title can still be selected. */
  pointer-events: none;
  display: grid;
  gap: var(--space-3xs);
  justify-items: start;
  /* Follows this scene's own sweep across the viewport. */
  opacity: calc(0.3 + 0.7 * var(--scene-progress, 1));
  transform: translate3d(calc((1 - var(--scene-progress, 1)) * 1.5rem), 0, 0);
}

.scene__head > * {
  pointer-events: auto;
}

/* A single full-height row, so a scene can lay a full-bleed backdrop behind its
   content. Scenes centre their own content — `align-content: center` here would
   shrink the row to the text and leave a backdrop covering only that. */
.scene__body {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  min-block-size: 0;
  block-size: 100%;
}

.scene__number {
  color: var(--surface-dim);
  font-size: var(--step-1);
  font-variant-numeric: tabular-nums;
}

.scene__title {
  font-size: var(--step-2);
  color: var(--primary-text);
}

.scene__hint {
  color: var(--surface-dim);
  font-size: var(--step--1);
}
</style>
