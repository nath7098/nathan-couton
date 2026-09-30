<script setup lang="ts">
import { ARCHIVE, CASE_STUDIES } from '~/data/projects'

/**
 * Projects — `projets/`.
 *
 * Four case studies told in full, then the archive as a plain list. v1 laid
 * nine identical cards in a row behind a rainbow of sixteen technology
 * filters, which put a 2018 learning project on the same footing as the
 * current mission. The filter is gone with the rainbow: there is nothing to
 * filter in four stories.
 */
const { t, locale } = useI18n()

const href = (value: string) => value.replace('{locale}', locale.value)
</script>

<template>
  <div class="projects">
    <NcCaseStudy
      v-for="(study, index) in CASE_STUDIES"
      :key="study.id"
      :study="study"
      :index="index"
    />

    <section
      class="archive nc-reveal"
      aria-labelledby="archive-title"
    >
      <header class="archive__head">
        <p
          class="archive__file"
          aria-hidden="true"
        >
          ls -l projets/archives
        </p>
        <h3
          id="archive-title"
          class="archive__title"
        >
          {{ t('projects.archiveTitle') }}
        </h3>
      </header>

      <ul class="archive__list">
        <li
          v-for="entry in ARCHIVE"
          :key="entry.id"
          class="archive__row"
        >
          <span class="archive__year">{{ entry.year }}</span>
          <span class="archive__main">
            <span class="archive__name">{{ t(`projects.archive.${entry.id}.title`) }}</span>
            <span class="archive__line">{{ t(`projects.archive.${entry.id}.line`) }}</span>
          </span>
          <span class="archive__stack">{{ entry.stack.join(' · ') }}</span>
          <span class="archive__links">
            <a
              v-for="link in entry.links"
              :key="link.href"
              :href="href(link.href)"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="t(link.kind === 'repo' ? 'projects.viewRepo' : 'projects.viewLive', { name: t(`projects.archive.${entry.id}.title`) })"
            >
              {{ t(link.kind === 'repo' ? 'projects.linkRepo' : 'projects.linkLive') }}
              <NcIcon name="arrow-up-right" />
            </a>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.projects {
  display: grid;
}

.archive {
  display: grid;
  gap: var(--space-m);
  padding-block-start: var(--space-xl);
  border-block-start: 1px solid var(--line);
}

.archive__file {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.archive__title {
  font-size: var(--step-3);
}

.archive__list {
  display: grid;
  padding: 0;
  margin: 0;
  list-style: none;
}

.archive__row {
  display: grid;
  grid-template-columns: 4rem minmax(0, 2.2fr) minmax(0, 1fr) 13rem;
  gap: var(--space-2xs) var(--space-m);
  align-items: baseline;
  padding-block: var(--space-s);
  border-block-end: 1px solid var(--line);
  transition: background-color var(--dur-base) var(--ease-out-expo);
}

@media (hover: hover) {
  .archive__row:hover {
    background: color-mix(in oklab, var(--brand) 5%, transparent);
  }
}

.archive__year {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--brand-ink);
}

.archive__main {
  display: grid;
  gap: 0.1rem;
}

.archive__name {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 560;
}

.archive__line {
  font-size: var(--step--1);
  color: var(--text-dim);
}

.archive__stack {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.archive__links {
  display: flex;
  gap: var(--space-s);
  justify-content: flex-end;
  font-size: var(--step--1);
}

.archive__links a {
  display: inline-flex;
  gap: 0.2em;
  align-items: center;
  color: var(--text-dim);
}

@media (hover: hover) {
  .archive__links a:hover {
    color: var(--brand-ink);
  }
}

@media (width < 800px) {
  .archive__row {
    grid-template-columns: 3.5rem minmax(0, 1fr);
  }

  .archive__stack,
  .archive__links {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
