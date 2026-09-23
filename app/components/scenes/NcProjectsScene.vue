<script setup lang="ts">
import { PROJECTS } from '~/data/projects'
import type { TechKey } from '~/data/types'

/**
 * Scene 06 — projects.
 *
 * Main projects sit in two rows that drift at slightly different speeds. The
 * "other projects" panel extends the rail rather than opening a modal, which
 * keeps the scroll continuous (SPEC §13 #10).
 */
const { t } = useI18n()

const showOther = ref(false)
const filter = ref<TechKey | null>(null)

const main = computed(() => PROJECTS.filter(p => p.group === 'main'))
const other = computed(() => PROJECTS.filter(p => p.group === 'other'))

/** Every tech present across the visible projects, in first-seen order. */
const techs = computed(() => {
  const pool = showOther.value ? PROJECTS : main.value
  const seen = new Map<TechKey, string>()
  for (const project of pool) {
    for (const tag of project.tags) if (!seen.has(tag.tech)) seen.set(tag.tech, tag.label)
  }
  return [...seen].map(([tech, label]) => ({ tech, label }))
})

/** Filtering dims rather than removes, so nothing reflows under the pointer. */
function dimmed(tags: { tech: TechKey }[]) {
  return filter.value !== null && !tags.some(tag => tag.tech === filter.value)
}

function toggleFilter(tech: TechKey) {
  filter.value = filter.value === tech ? null : tech
}
</script>

<template>
  <div class="projects">
    <div class="projects__filters">
      <span class="projects__filters-label">{{ t('projectsSection.filterLabel') }}</span>
      <NcButton
        size="sm"
        :variant="filter === null ? 'solid' : 'ghost'"
        @click="filter = null"
      >
        {{ t('projectsSection.filterAll') }}
      </NcButton>
      <NcTag
        v-for="item in techs"
        :key="item.tech"
        size="sm"
        :label="item.label"
        :tech="item.tech"
        :details="' '"
        :class="{ 'is-filter-active': filter === item.tech }"
        @open="toggleFilter(item.tech)"
      />
    </div>

    <!-- Main projects, the toggle and the extra panel share one row: opening
         the panel extends the rail sideways instead of stacking below. -->
    <div class="projects__rows">
      <NcProjectCard
        v-for="(project, index) in main"
        :key="project.id"
        :project="project"
        class="projects__card"
        :class="{ 'is-dimmed': dimmed(project.tags) }"
        :style="{ '--row': index % 2, '--i': index }"
      />

      <NcButton
        variant="ghost"
        :icon-end="showOther ? 'chevron-right' : 'chevron-right'"
        :aria-expanded="showOther"
        class="projects__toggle"
        :class="{ 'is-open': showOther }"
        @click="showOther = !showOther"
      >
        {{ showOther ? t('projectsSection.otherToggleClose') : t('projectsSection.otherToggle') }}
      </NcButton>

      <div
        class="projects__panel"
        :class="{ 'is-open': showOther }"
      >
        <div class="projects__panel-inner">
          <NcProjectCard
            v-for="(project, index) in other"
            :key="project.id"
            :project="project"
            class="projects__card"
            :class="{ 'is-dimmed': dimmed(project.tags) }"
            :style="{ '--row': index % 2 }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects {
  display: grid;
  gap: var(--space-s);
  align-content: center;
}

.projects__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  align-items: center;
}

.projects__filters-label {
  font-size: var(--step--1);
  color: var(--surface-dim);
  margin-inline-end: var(--space-2xs);
}

.is-filter-active {
  background: var(--tag-bg);
  box-shadow: 0 0 0 2px var(--tag-accent);
}

/* One row, not two.
   SPEC §6.6 called for two stacked rows drifting at different speeds, but two
   rows of cards do not fit a viewport's height alongside the scene title,
   filters and the panel toggle. A single row with alternating vertical offsets
   gives the same moving-sheet feel and leaves the scene readable. */
.projects__rows {
  display: flex;
  gap: var(--space-s);
  align-items: center;
}

/* Alternating cards sit a little lower and drift the other way, so the row
   reads as a sheet in motion rather than a rigid strip. */
.projects__card {
  --drift: calc((var(--row, 0) - 0.5) * (var(--scene-progress, 0.5) - 0.5));

  transform: translate3d(calc(var(--drift) * -5vw), calc(var(--row, 0) * 1.25rem), 0);
  transition: opacity var(--dur-base) var(--ease-out-expo), filter var(--dur-base) var(--ease-out-expo);
}

.projects__card.is-dimmed {
  opacity: 0.32;
  filter: saturate(0.35);
}

/* A tab on the side of the row, cut from the same chrome as the cards: opening
   it slides four more files into the editor. A plain ghost button beside eight
   editor windows read as a stray slab. */
.projects__toggle {
  flex: 0 0 auto;
  writing-mode: vertical-rl;
  padding-block: var(--space-m);
  padding-inline: var(--space-3xs);
  font-size: var(--step--1);
  color: var(--surface-dim);
  background: color-mix(in oklab, var(--surface) 6%, var(--editor));
  border: 1px solid var(--surface-faint);
  border-inline-start-style: dashed;
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-start-end-radius: var(--radius-m);
  border-end-end-radius: var(--radius-m);
}

@media (hover: hover) {
  .projects__toggle:hover {
    color: var(--primary-text);
    border-color: color-mix(in oklab, var(--primary) 50%, var(--surface-faint));
  }
}

.projects__toggle.is-open :deep(.nc-button__icon-end) {
  transform: rotate(180deg);
}

/* grid-template-columns 0fr → 1fr: the panel widens the rail in place. */
.projects__panel {
  display: grid;
  grid-template-columns: 0fr;
  overflow: hidden;
  transition: grid-template-columns var(--dur-slow) var(--ease-out-expo);

  /* Four more cards sit in here, clipped to nothing. They stay in the DOM —
     the page is prerendered and their text is what a crawler reads — but a
     closed panel has no business being laid out or painted on every frame of
     the rail. */
  content-visibility: hidden;
}

.projects__panel.is-open {
  content-visibility: visible;
}

.projects__panel-inner {
  min-inline-size: 0;
  display: flex;
  gap: var(--space-s);
  align-items: center;
}

.projects__panel.is-open {
  grid-template-columns: 1fr;
}

.projects__panel-inner {
  min-inline-size: 0;
  display: flex;
  gap: var(--space-m);
}

@media not all and (min-width: 1024px) {
  .projects__rows {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  }

  .projects__card {
    transform: none;
  }

  .projects__rows {
    align-items: stretch;
  }

  .projects__toggle {
    writing-mode: horizontal-tb;
  }

  .projects__panel {
    grid-template-columns: 1fr;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--dur-slow) var(--ease-out-expo);
  }

  .projects__panel.is-open {
    grid-template-rows: 1fr;
  }

  .projects__panel-inner {
    flex-direction: column;
  }
}
</style>
