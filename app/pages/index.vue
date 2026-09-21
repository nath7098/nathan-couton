<script setup lang="ts">
/**
 * The site is one page. NcRail mounts the seven scenes and owns the scroll;
 * L3 fills each scene through the named slots.
 */
useSiteSeo()
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
      <NcRail>
        <template #home>
          <NcHomeScene />
        </template>
        <template #about>
          <NcAboutScene />
        </template>
        <template #experience>
          <NcExperienceScene />
        </template>
        <template #skills>
          <NcSkillsScene />
        </template>
        <template #education>
          <NcEducationScene />
        </template>
        <template #projects>
          <NcProjectsScene />
        </template>
        <template #contact>
          <NcContactScene />
        </template>
      </NcRail>
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
