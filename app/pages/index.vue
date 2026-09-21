<script setup lang="ts">
import { SCENES } from '~/data/scenes'

/**
 * L0 skeleton: the seven scenes stacked vertically, themed and translated.
 * L1 wraps them in NcRail and turns this into the horizontal rail (SPEC §3);
 * L3 fills each one with its real content.
 */
const { t } = useI18n()

useSeoMeta({
  title: '',
  description: () => t('home.position'),
})

const sceneNumber = (index: number) => String(index + 1).padStart(2, '0')
</script>

<template>
  <div class="page">
    <header class="page__header">
      <p class="page__brand">
        &lt;Nathan Couton /&gt;
      </p>
      <div class="page__controls">
        <NcLocaleSwitch />
        <NcThemeToggle />
      </div>
    </header>

    <main
      id="main"
      class="rail"
    >
      <section
        v-for="(scene, index) in SCENES"
        :id="scene.id"
        :key="scene.id"
        class="scene"
        :style="{ '--scene-span': scene.span }"
        :aria-labelledby="`${scene.id}-title`"
      >
        <p class="scene__number">
          {{ sceneNumber(index) }}
        </p>
        <h2
          :id="`${scene.id}-title`"
          class="scene__title nc-braces"
        >
          {{ t(scene.labelKey) }}
        </h2>
        <p class="scene__placeholder">
          {{ t('a11y.sceneOf', { current: index + 1, total: SCENES.length }) }}
          · span {{ scene.span }}
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page__header {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 10;
  display: flex;
  gap: var(--space-m);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-s) var(--gutter);
  background: var(--glass);
  backdrop-filter: blur(12px);
}

.page__brand {
  color: var(--secondary-text);
  font-size: var(--step--1);
  font-weight: 700;
}

.page__controls {
  display: flex;
  gap: var(--space-m);
  align-items: center;
}

.scene {
  display: grid;
  align-content: center;
  gap: var(--space-s);
  min-block-size: 100svh;
  padding-inline: var(--gutter);
  border-block-end: 1px solid var(--surface-faint);
}

.scene__number {
  color: var(--surface-faint);
  font-size: var(--step-1);
  font-variant-numeric: tabular-nums;
}

.scene__title {
  font-size: var(--step-3);
  color: var(--primary-text);
}

.scene__placeholder {
  color: var(--surface-dim);
  font-size: var(--step--1);
}
</style>
