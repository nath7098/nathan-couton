<script setup lang="ts">
/**
 * The site is one page. NcRail mounts the seven scenes and owns the scroll;
 * L3 fills each scene through the named slots.
 */
const { t } = useI18n()

useSeoMeta({
  title: '',
  description: () => t('home.position'),
})
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

    <main id="main">
      <NcRail />
    </main>
  </div>
</template>

<style scoped>
.page__header {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 30;
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
</style>
