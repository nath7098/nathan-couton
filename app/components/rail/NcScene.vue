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
    <slot>
      <!-- Placeholder until L3 fills the scenes with real content. -->
      <div class="scene__placeholder">
        <p class="scene__number">
          {{ number }}
        </p>
        <h2
          :id="titleId"
          class="scene__title nc-braces"
        >
          {{ t(scene.labelKey) }}
        </h2>
        <p class="scene__hint">
          {{ t('a11y.sceneOf', { current: index + 1, total: 7 }) }}
        </p>
      </div>
    </slot>
  </section>
</template>

<style scoped>
.scene__placeholder {
  display: grid;
  gap: var(--space-s);
  justify-items: start;
  /* Tracks this scene's own sweep across the viewport — proof the per-scene
     timeline is wired before L4 leans on it. */
  opacity: calc(0.25 + 0.75 * var(--scene-progress));
  transform: translate3d(calc((1 - var(--scene-progress)) * 2rem), 0, 0);
}

.scene__number {
  color: var(--surface-dim);
  font-size: var(--step-1);
  font-variant-numeric: tabular-nums;
}

.scene__title {
  font-size: var(--step-3);
  color: var(--primary-text);
}

.scene__hint {
  color: var(--surface-dim);
  font-size: var(--step--1);
}
</style>
