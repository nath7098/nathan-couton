<script setup lang="ts">
import type { Project } from '~/data/projects'

/** One project. The card surface, spotlight and tilt come from NcCard. */
const props = defineProps<{ project: Project }>()

const { t, locale } = useI18n()

/** v1 built the old-site link from the active locale: ancien-fr / ancien-en. */
const links = computed(() => props.project.links.map(link => ({
  ...link,
  href: link.href.replace('{locale}', locale.value),
})))

const title = computed(() => t(props.project.titleKey))
</script>

<template>
  <NcCard
    interactive
    class="project"
  >
    <div class="project__media">
      <NuxtImg
        :src="project.image"
        :alt="t(project.altKey)"
        width="320"
        height="200"
        format="webp"
        loading="lazy"
        class="project__image"
      />
    </div>

    <div class="project__body">
      <h3 class="project__title">
        {{ title }}
      </h3>
      <p class="project__description">
        {{ t(project.descriptionKey) }}
      </p>

      <div class="project__tags">
        <NcTag
          v-for="tag in project.tags"
          :key="tag.label"
          size="sm"
          :label="tag.label"
          :tech="tag.tech"
        />
      </div>

      <div
        v-if="links.length"
        class="project__links"
      >
        <a
          v-for="link in links"
          :key="link.href"
          class="project__link"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t(link.kind === 'repo' ? 'projectsSection.viewRepo' : 'projectsSection.viewLive', { name: title })"
        >
          <NcIcon :name="link.kind === 'repo' ? 'gitlab' : 'eye'" />
        </a>
      </div>
    </div>
  </NcCard>
</template>

<style scoped>
.project {
  inline-size: clamp(13rem, 17vw, 16rem);
  overflow: hidden;
}

.project__media {
  aspect-ratio: 16 / 9;
  display: grid;
  place-items: center;
  padding: var(--space-2xs);
  background: color-mix(in oklab, var(--surface) 6%, var(--editor));
}

.project__image {
  max-inline-size: 100%;
  max-block-size: 100%;
  object-fit: contain;
}

.project__body {
  display: grid;
  gap: var(--space-3xs);
  padding: var(--space-2xs) var(--space-s) var(--space-s);
}

.project__title {
  font-size: var(--step-0);
  font-weight: 700;
  color: var(--surface);
}

/* Three lines keeps every card the same height, which the two drifting rows
   depend on. The full text stays in the DOM for search engines. */
.project__description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--surface-dim);
}

.project__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
}

.project__links {
  display: flex;
  gap: var(--space-2xs);
  margin-block-start: var(--space-3xs);
}

.project__link {
  display: grid;
  place-items: center;
  inline-size: 1.75rem;
  block-size: 1.75rem;
  color: var(--surface-dim);
  border-radius: var(--radius-s);
  transition: color var(--dur-base) var(--ease-out-expo), transform var(--dur-fast) var(--ease-spring);
}

@media (hover: hover) {
  .project__link:hover {
    color: var(--primary-text);
    transform: scale(1.12);
  }
}
</style>
