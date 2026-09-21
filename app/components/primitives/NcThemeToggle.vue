<script setup lang="ts">
/**
 * Theme switch.
 *
 * L0 shape: functional and accessible, deliberately plain. The sun/moon dial
 * with craters and stars from v1 gets redrawn in L2 (SPEC §7.1) — this is the
 * behaviour it will hang off.
 */
const { t } = useI18n()
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function toggle() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    role="switch"
    :aria-checked="isDark"
    :aria-label="t('a11y.toggleTheme')"
    @click="toggle"
  >
    <span
      class="theme-toggle__track"
      aria-hidden="true"
    >
      <span class="theme-toggle__thumb" />
    </span>
    <ClientOnly>
      <span class="nc-sr-only">{{ isDark ? t('a11y.themeDark') : t('a11y.themeLight') }}</span>
    </ClientOnly>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3xs);
  border-radius: var(--radius-pill);
}

.theme-toggle__track {
  position: relative;
  display: block;
  inline-size: 3.25rem;
  block-size: 1.75rem;
  background: var(--surface-faint);
  border: 1px solid var(--surface-dim);
  border-radius: var(--radius-pill);
  transition: background-color var(--dur-base) var(--ease-out-expo);
}

.theme-toggle__thumb {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0.2rem;
  inline-size: 1.15rem;
  block-size: 1.15rem;
  background: var(--primary);
  border-radius: 50%;
  transform: translate3d(0, -50%, 0);
  transition: transform var(--dur-base) var(--ease-spring), background-color var(--dur-base) var(--ease-out-expo);
}

.theme-toggle[aria-checked='false'] .theme-toggle__thumb {
  transform: translate3d(1.5rem, -50%, 0);
}
</style>
