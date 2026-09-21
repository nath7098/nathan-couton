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
    :style="{
      '--scene-span': scene.span,
      '--scene-range-start': range.start,
      '--scene-range-end': range.end,
      '--scene-index': index,
    }"
    :aria-labelledby="titleId"
  >
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

.scene__head {
  display: grid;
  gap: var(--space-3xs);
  justify-items: start;
  /* Follows this scene's own sweep across the viewport. */
  opacity: calc(0.3 + 0.7 * var(--scene-progress, 1));
  transform: translate3d(calc((1 - var(--scene-progress, 1)) * 1.5rem), 0, 0);
}

.scene__body {
  display: grid;
  align-content: center;
  min-block-size: 0;
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
