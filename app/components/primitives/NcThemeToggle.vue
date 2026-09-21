<script setup lang="ts">
/**
 * Sun/moon dial — the v1 switch, rebuilt.
 *
 * Kept from v1: the handle that slides and rotates, craters that fade in on the
 * moon, stars that stretch into streaks. Fixed: the invalid `90px - 6` radius,
 * the checkbox-with-no-name, and the hydration mismatch (colorMode differs
 * between prerender and client, so anything derived from it waits for mount).
 */
const { t } = useI18n()
const colorMode = useColorMode()
const mounted = useMounted()

const isDark = computed(() => mounted.value && colorMode.value === 'dark')

function toggle() {
  const next = isDark.value ? 'light' : 'dark'
  // A circular wipe from the control, where supported; a plain swap otherwise.
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    colorMode.preference = next
    return
  }
  document.startViewTransition(() => {
    colorMode.preference = next
  })
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    role="switch"
    :aria-checked="mounted ? isDark : undefined"
    :aria-label="t('a11y.toggleTheme')"
    @click="toggle"
  >
    <span
      class="theme-toggle__sky"
      :class="{ 'is-night': isDark }"
      aria-hidden="true"
    >
      <span class="theme-toggle__star theme-toggle__star--1" />
      <span class="theme-toggle__star theme-toggle__star--2" />
      <span class="theme-toggle__star theme-toggle__star--3" />
      <span class="theme-toggle__star theme-toggle__star--4" />
      <span class="theme-toggle__star theme-toggle__star--5" />
      <span class="theme-toggle__star theme-toggle__star--6" />

      <span class="theme-toggle__handle">
        <span class="theme-toggle__crater theme-toggle__crater--1" />
        <span class="theme-toggle__crater theme-toggle__crater--2" />
        <span class="theme-toggle__crater theme-toggle__crater--3" />
      </span>
    </span>

    <span
      v-if="mounted"
      class="nc-sr-only"
    >{{ isDark ? t('a11y.themeDark') : t('a11y.themeLight') }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  --track-w: 3.75rem;
  --track-h: 1.9rem;
  --handle: 1.45rem;
  --inset: 0.225rem;

  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-pill);
}

.theme-toggle__sky {
  position: relative;
  display: block;
  inline-size: var(--track-w);
  block-size: var(--track-h);
  background: #83d8ff;
  border-radius: var(--radius-pill);
  overflow: hidden;
  transition: background-color var(--dur-slow) var(--ease-in-out-quint);
}

.theme-toggle__sky.is-night {
  background: #1b2a4a;
}

.theme-toggle__handle {
  position: absolute;
  inset-block-start: var(--inset);
  inset-inline-start: var(--inset);
  inline-size: var(--handle);
  block-size: var(--handle);
  background: #ffcf96;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgb(0 0 0 / 30%);
  transform: rotate(-45deg);
  transition: transform var(--dur-slow) var(--ease-spring), background-color var(--dur-slow) var(--ease-out-expo);
}

.theme-toggle__sky.is-night .theme-toggle__handle {
  background: #e8e4d8;
  transform: translate3d(calc(var(--track-w) - var(--handle) - 2 * var(--inset)), 0, 0) rotate(0deg);
}

.theme-toggle__crater {
  position: absolute;
  background: #cdc7b4;
  border-radius: 50%;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out-expo);
}

.theme-toggle__sky.is-night .theme-toggle__crater {
  opacity: 1;
}

.theme-toggle__crater--1 {
  inset-block-start: 45%;
  inset-inline-start: 22%;
  inline-size: 18%;
  block-size: 18%;
}

.theme-toggle__crater--2 {
  inset-block-start: 22%;
  inset-inline-start: 55%;
  inline-size: 26%;
  block-size: 26%;
}

.theme-toggle__crater--3 {
  inset-block-start: 66%;
  inset-inline-start: 52%;
  inline-size: 14%;
  block-size: 14%;
}

/* Stars double as clouds: wide streaks by day, points by night. */
.theme-toggle__star {
  position: absolute;
  background: #fff;
  border-radius: var(--radius-pill);
  transition:
    inline-size var(--dur-slow) var(--ease-in-out-quint),
    block-size var(--dur-slow) var(--ease-in-out-quint),
    opacity var(--dur-base) var(--ease-out-expo),
    transform var(--dur-slow) var(--ease-in-out-quint);
}

.theme-toggle__star--1 {
  inset-block-start: 18%;
  inset-inline-start: 46%;
  inline-size: 44%;
  block-size: 3px;
}

.theme-toggle__star--2 {
  inset-block-start: 45%;
  inset-inline-start: 38%;
  inline-size: 50%;
  block-size: 3px;
}

.theme-toggle__star--3 {
  inset-block-start: 70%;
  inset-inline-start: 56%;
  inline-size: 34%;
  block-size: 3px;
}

.theme-toggle__star--4,
.theme-toggle__star--5,
.theme-toggle__star--6 {
  opacity: 0;
  inline-size: 2px;
  block-size: 2px;
  transform: translateX(3px);
}

.theme-toggle__star--4 {
  inset-block-start: 26%;
  inset-inline-start: 16%;
}

.theme-toggle__star--5 {
  inset-block-start: 62%;
  inset-inline-start: 26%;
}

.theme-toggle__star--6 {
  inset-block-start: 40%;
  inset-inline-start: 34%;
}

.theme-toggle__sky.is-night .theme-toggle__star--1 {
  inline-size: 2px;
  block-size: 2px;
}

.theme-toggle__sky.is-night .theme-toggle__star--2 {
  inline-size: 3px;
  block-size: 3px;
  transform: translateX(-6px);
}

.theme-toggle__sky.is-night .theme-toggle__star--3 {
  inline-size: 2px;
  block-size: 2px;
  transform: translateX(-9px);
}

.theme-toggle__sky.is-night .theme-toggle__star--4,
.theme-toggle__sky.is-night .theme-toggle__star--5,
.theme-toggle__sky.is-night .theme-toggle__star--6 {
  opacity: 1;
  transform: translateX(0);
}

.theme-toggle__sky.is-night .theme-toggle__star--4 { transition-delay: 160ms; }
.theme-toggle__sky.is-night .theme-toggle__star--5 { transition-delay: 240ms; }
.theme-toggle__sky.is-night .theme-toggle__star--6 { transition-delay: 320ms; }
</style>
