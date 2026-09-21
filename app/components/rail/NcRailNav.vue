<script setup lang="ts">
import { SCENES } from '~/data/scenes'

/**
 * Progress bar and scene dots. Doubles as the site's only navigation.
 * SPEC §3.7.
 */
const { t } = useI18n()
const rail = useRail()
</script>

<template>
  <nav
    class="rail-nav"
    :aria-label="t('a11y.mainNav')"
  >
    <p
      class="rail-nav__label"
      aria-hidden="true"
    >
      {{ t(SCENES.find(s => s.id === rail.activeScene.value)!.labelKey) }}
    </p>

    <ol class="rail-nav__dots">
      <li
        v-for="scene in SCENES"
        :key="scene.id"
        class="rail-nav__item"
        :style="{ '--dot-span': scene.span }"
      >
        <button
          type="button"
          class="rail-nav__dot"
          :class="{ 'is-active': scene.id === rail.activeScene.value }"
          :aria-current="scene.id === rail.activeScene.value ? 'true' : undefined"
          :aria-label="t('rail.goTo', { name: t(scene.labelKey) })"
          @click="rail.goTo(scene.id)"
        >
          <span class="rail-nav__dot-mark" />
        </button>
      </li>
    </ol>

    <div
      class="rail-nav__track"
      role="progressbar"
      :aria-label="t('rail.progress')"
      :aria-valuenow="Math.round(rail.progress.value * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="rail-nav__fill"
        aria-hidden="true"
      />
    </div>
  </nav>
</template>

<style scoped>
.rail-nav {
  position: fixed;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: 20;
  display: grid;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--gutter) var(--space-s);
  background: linear-gradient(to top, var(--background) 45%, transparent);
  pointer-events: none;
}

.rail-nav > * {
  pointer-events: auto;
}

.rail-nav__label {
  color: var(--secondary-text);
  font-size: var(--step--1);
  font-weight: 700;
  text-transform: lowercase;
  justify-self: center;
}

.rail-nav__dots {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  list-style: none;
}

/* Dots are sized by their scene's span, so the row is a map of the rail. */
.rail-nav__item {
  flex: 0 0 auto;
  inline-size: calc(var(--dot-span) * 1.1rem);
}

.rail-nav__dot {
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 1.25rem;
  border-radius: var(--radius-pill);
}

.rail-nav__dot-mark {
  display: block;
  inline-size: 100%;
  block-size: 2px;
  background: var(--surface-faint);
  border-radius: var(--radius-pill);
  transition:
    background-color var(--dur-base) var(--ease-out-expo),
    block-size var(--dur-base) var(--ease-spring);
}

.rail-nav__dot.is-active .rail-nav__dot-mark {
  block-size: 4px;
  background: var(--primary);
}

@media (hover: hover) {
  .rail-nav__dot:hover .rail-nav__dot-mark {
    background: var(--surface);
  }
}

.rail-nav__track {
  position: relative;
  block-size: 1px;
  background: var(--surface-faint);
  overflow: hidden;
}

/* scaleX rather than width: composited, no layout per frame. */
.rail-nav__fill {
  position: absolute;
  inset: 0;
  background: var(--primary);
  transform: scaleX(var(--rail-progress));
  transform-origin: left center;
}

/* Stacked layout: the bar is a thin top progress indicator, dots move aside. */
@media not all and (min-width: 1024px) {
  .rail-nav {
    inset-block: 0 auto;
    padding: 0;
    background: none;
  }

  .rail-nav__label,
  .rail-nav__dots {
    display: none;
  }
}
</style>
