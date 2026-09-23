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

      <NcButton
        variant="ghost"
        size="sm"
        icon-end="chevron-right"
        :aria-expanded="showOther"
        class="projects__toggle"
        :class="{ 'is-open': showOther }"
        @click="showOther = !showOther"
      >
        {{ showOther ? t('projectsSection.otherToggleClose') : t('projectsSection.otherToggle') }}
      </NcButton>
    </div>

    <!-- The main projects and the extra panel share one row: opening the panel
         extends the rail sideways instead of stacking below. The control that
         opens it sits in the filter row, not at the end of the cards — with
         nine projects the end of the row falls outside the viewport, and a
         button you can only reach by scrolling the rail is not a button. -->
    <div class="projects__rows">
      <NcProjectCard
        v-for="project in main"
        :key="project.id"
        :project="project"
        :index="PROJECTS.indexOf(project)"
        :total="PROJECTS.length"
        class="projects__card"
        :class="{ 'is-dimmed': dimmed(project.tags) }"
      />

      <div
        class="projects__panel"
        :class="{ 'is-open': showOther }"
      >
        <div class="projects__panel-inner">
          <NcProjectCard
            v-for="project in other"
            :key="project.id"
            :project="project"
            :index="PROJECTS.indexOf(project)"
            :total="PROJECTS.length"
            class="projects__card"
            :class="{ 'is-dimmed': dimmed(project.tags) }"
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
   filters and the panel toggle.

   It also called for alternating vertical offsets on a single row, to keep some
   of that moving-sheet feel. That is gone too: every card is now exactly the
   same height, and against eight identical rectangles a staggered baseline
   stopped reading as movement and started reading as a misalignment. The row is
   flat and the gaps are even. */
.projects__rows {
  display: flex;
  gap: var(--space-s);
  align-items: stretch;
}

.projects__card {
  transition: opacity var(--dur-base) var(--ease-out-expo), filter var(--dur-base) var(--ease-out-expo);
}

.projects__card.is-dimmed {
  opacity: 0.32;
  filter: saturate(0.35);
}

/* Sits at the end of the filter row, separated from the technology pills so it
   does not read as one of them. Not at the end of the card row: with nine
   projects that end falls a screen and a half to the right, so the control that
   reveals four of them only appeared once you had scrolled past them. */
.projects__toggle {
  flex: 0 0 auto;
  margin-inline-start: var(--space-s);
  color: var(--surface-dim);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-pill);
}

.projects__toggle.is-open :deep(.nc-button__icon-end) {
  transform: rotate(180deg);
}

@media (hover: hover) {
  .projects__toggle:hover {
    color: var(--primary-text);
    border-color: color-mix(in oklab, var(--primary) 50%, var(--surface-faint));
  }
}

/* grid-template-columns 0fr → 1fr: the panel widens the rail in place. */
.projects__panel {
  display: grid;
  grid-template-columns: 0fr;
  overflow: hidden;
  transition: grid-template-columns var(--dur-slow) var(--ease-out-expo);
}

.projects__panel.is-open {
  grid-template-columns: 1fr;
}

/* The panel's track is 0fr when closed, but the row inside keeps its natural
   width and is simply clipped. Letting it collapse instead squeezed the four
   cards to nothing, and a tag pill 2px wide wraps its own label one letter per
   line: boxes 157px tall, hanging out of the bottom of the scene. */
.projects__panel-inner {
  display: flex;
  inline-size: max-content;
  min-inline-size: 0;
  gap: var(--space-m);
  align-items: stretch;
}

@media not all and (min-width: 1024px) {
  .projects__rows {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
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
    inline-size: auto;
    flex-direction: column;
  }
}
</style>
