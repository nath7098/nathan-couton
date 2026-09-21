<script setup lang="ts">
/**
 * Locale switch.
 *
 * L0 shape: plain links, correct semantics, no flags. The sliding-flag
 * interaction from v1 gets rebuilt with inline SVG flags in L2 (SPEC §7.1) —
 * v1 loaded them from cdn.countryflags.com, which we are not reintroducing.
 */
const { t } = useI18n()
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <nav
    class="locale-switch"
    :aria-label="t('a11y.selectLanguage')"
  >
    <NuxtLink
      v-for="item in locales"
      :key="item.code"
      class="locale-switch__link"
      :to="switchLocalePath(item.code)"
      :aria-current="item.code === locale ? 'true' : undefined"
    >
      {{ item.code.toUpperCase() }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.locale-switch {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
}

.locale-switch__link {
  padding: var(--space-3xs) var(--space-2xs);
  color: var(--surface-dim);
  font-size: var(--step--1);
  text-decoration: none;
  border-radius: var(--radius-s);
  transition: color var(--dur-fast) var(--ease-out-expo);
}

.locale-switch__link[aria-current='true'] {
  color: var(--primary-text);
  font-weight: 700;
}

@media (hover: hover) {
  .locale-switch__link:hover {
    color: var(--surface);
  }
}
</style>
