<script setup lang="ts">
import { STEPS, type CaseStudy, type Step } from '~/data/projects'

/**
 * One case study: three short beats of text beside a figure that follows them.
 *
 * The text scrolls; the figure stays (sticky) and lights the part of the
 * architecture the paragraph in the middle of the screen is about. That is one
 * IntersectionObserver per case setting `data-step` — a discrete state
 * change, not a per-frame style — and without it every part of the figure is
 * simply lit.
 */
const props = defineProps<{ study: CaseStudy, index: number }>()

const { t, locale } = useI18n()

const root = ref<HTMLElement>()
const step = ref<Step | null>(null)

const links = computed(() => props.study.links.map(link => ({
  ...link,
  href: link.href.replace('{locale}', locale.value),
})))

onMounted(() => {
  const el = root.value
  if (!el) return
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) step.value = (entry.target as HTMLElement).dataset.step as Step
    }
  }, { rootMargin: '-45% 0px -50% 0px' })
  for (const item of el.querySelectorAll<HTMLElement>('[data-step]')) observer.observe(item)

  // Leaving the case entirely hands the figure back to its all-lit state.
  const outer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) step.value = null
  })
  outer.observe(el)

  onBeforeUnmount(() => {
    observer.disconnect()
    outer.disconnect()
  })
})
</script>

<template>
  <article
    ref="root"
    class="case"
    :data-step="step ?? undefined"
    :aria-labelledby="`case-${study.id}`"
  >
    <header class="case__head nc-reveal">
      <p class="case__meta">
        <span class="case__index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span>{{ t(`projects.cases.${study.id}.where`) }}</span>
        <span
          v-if="study.nda"
          class="case__nda"
        >{{ t('projects.nda') }}</span>
      </p>
      <h3
        :id="`case-${study.id}`"
        class="case__title"
      >
        {{ t(`projects.cases.${study.id}.title`) }}
      </h3>
      <p class="case__pitch">
        {{ t(`projects.cases.${study.id}.pitch`) }}
      </p>
    </header>

    <div class="case__body">
      <div class="case__figure">
        <NcFigure
          :figure="study.figure"
          :case-id="study.id"
        />
      </div>

      <ol class="case__steps">
        <li
          v-for="name in STEPS"
          :key="name"
          class="case__step"
          :class="{ 'is-current': step === name }"
          :data-step="name"
        >
          <p class="case__step-label">
            {{ t(`projects.steps.${name}`) }}
          </p>
          <p class="case__step-text">
            {{ t(`projects.cases.${study.id}.${name}`) }}
          </p>
        </li>

        <li class="case__foot">
          <ul
            class="case__stack"
            :aria-label="t('parcours.stackLabel')"
          >
            <li
              v-for="item in study.stack"
              :key="item"
            >
              <NcTag
                size="sm"
                :label="item"
              />
            </li>
          </ul>
          <div
            v-if="links.length"
            class="case__links"
          >
            <NcButton
              v-for="link in links"
              :key="link.href"
              :variant="link.kind === 'live' ? 'primary' : 'ghost'"
              size="sm"
              :icon="link.kind === 'live' ? 'eye' : 'gitlab'"
              :href="link.href"
              external
            >
              {{ t(link.kind === 'live' ? 'projects.linkLive' : 'projects.linkRepo') }}
            </NcButton>
          </div>
        </li>
      </ol>
    </div>
  </article>
</template>

<style scoped>
.case {
  display: grid;
  gap: var(--space-l);
  padding-block: var(--space-xl);
  border-block-start: 1px solid var(--line);
}

.case__head {
  display: grid;
  gap: var(--space-2xs);
  max-inline-size: 60rem;
}

.case__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs) var(--space-s);
  align-items: baseline;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
}

.case__index {
  color: var(--brand-ink);
}

.case__nda {
  padding: 0.1em 0.6em;
  color: var(--warm-ink);
  border: 1px solid color-mix(in oklab, var(--warm) 50%, transparent);
  border-radius: var(--radius-pill);
}

.case__title {
  font-size: var(--step-4);
  line-height: 1;
}

.case__pitch {
  max-inline-size: var(--measure);
  font-size: var(--step-1);
  line-height: 1.45;
  color: var(--text-dim);
  text-wrap: pretty;
}

.case__body {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}

.case__figure {
  position: sticky;
  inset-block-start: calc(var(--header-h) + var(--space-l));
  display: grid;
  gap: var(--space-2xs);
}

.case__steps {
  display: grid;
  gap: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.case__step {
  display: grid;
  gap: var(--space-2xs);
  padding-block: var(--space-l);
  border-block-end: 1px solid var(--line);
  opacity: 0.6;
  transition: opacity var(--dur-slow) var(--ease-out-expo);
}

/* Before the observer has run — or without it — every step reads at full
   strength. */
.case:not([data-step]) .case__step,
.case__step.is-current {
  opacity: 1;
}

.case__step:first-child {
  padding-block-start: 0;
}

.case__step-label {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--brand-ink);
  text-transform: lowercase;
}

.case__step-text {
  max-inline-size: 52ch;
  font-size: var(--step-0);
  line-height: 1.6;
  text-wrap: pretty;
}

.case__foot {
  display: grid;
  gap: var(--space-s);
  padding-block-start: var(--space-l);
}

.case__stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
  padding: 0;
  margin: 0;
  list-style: none;
}

.case__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

/* The figure lights what the step in the middle of the screen is about. */
.case[data-step='problem'] :deep(:is(.figure__node, .figure__edge):not([data-lit~='problem'])),
.case[data-step='work'] :deep(:is(.figure__node, .figure__edge):not([data-lit~='work'])),
.case[data-step='outcome'] :deep(:is(.figure__node, .figure__edge):not([data-lit~='outcome'])) {
  opacity: 0.25;
}

@media (width < 960px) {
  .case__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .case__figure {
    position: static;
  }

  .case__step {
    opacity: 1;
  }
}
</style>
