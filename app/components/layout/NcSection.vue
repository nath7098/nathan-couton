<script setup lang="ts">
import type { SectionMeta } from '~/data/sections'

/**
 * One section of the document: the landmark, its label, and the file tab that
 * carries the code thread (`02 · README.md`).
 *
 * `--code` is how much {{ }} scaffolding is left around the title. It falls
 * section by section down the page, which is the "compile" half of
 * Compile → Run: the braces thin out and are gone by the finale.
 */
const props = defineProps<{
  section: SectionMeta
  index: number
}>()

const { t, te } = useI18n()

const number = computed(() => String(props.index).padStart(2, '0'))
const titleId = computed(() => `${props.section.id}-title`)
const ledeKey = computed(() => `sections.${props.section.id}.lede`)
</script>

<template>
  <section
    :id="section.id"
    :data-section="section.id"
    class="section"
    :class="`section--${section.layout}`"
    :style="{ '--code': section.code }"
    :aria-labelledby="titleId"
  >
    <div class="section__inner">
      <header class="section__head">
        <p
          class="section__tab"
          aria-hidden="true"
        >
          <span class="section__index">{{ number }}</span>
          <span class="section__file">{{ t(`sections.${section.id}.file`) }}</span>
        </p>
        <h2
          :id="titleId"
          class="section__title nc-braces"
        >
          {{ t(`sections.${section.id}.title`) }}
        </h2>
        <p
          v-if="te(ledeKey)"
          class="section__lede"
        >
          {{ t(ledeKey) }}
        </p>
      </header>

      <slot />
    </div>
  </section>
</template>

<style scoped>
.section {
  position: relative;
  padding-block: clamp(5rem, 12vh, 9rem) clamp(4rem, 10vh, 7rem);
  padding-inline: var(--gutter);
  /* Lands under the fixed header, not behind it, when reached by an anchor. */
  scroll-margin-top: calc(var(--header-h) - 1px);
}

.section__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(2rem, 5vh, 3.5rem);
  max-inline-size: var(--content);
  margin-inline: auto;
}

.section__head {
  display: grid;
  gap: var(--space-2xs);
  justify-items: start;
}

.section__tab {
  display: inline-flex;
  gap: var(--space-2xs);
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-faint);
}

.section__index {
  color: var(--brand-ink);
}

.section__file {
  padding: 0.1em 0.6em;
  border: 1px solid var(--line);
  border-radius: var(--radius-s) var(--radius-s) 0 0;
  border-block-end-color: transparent;
  /* The tab's outline fades with the scaffolding; its text never does. */
  border-inline-color: color-mix(in oklab, var(--line) calc(var(--code, 1) * 100%), transparent);
  border-block-start-color: color-mix(in oklab, var(--line) calc(var(--code, 1) * 100%), transparent);
}

.section__title {
  font-size: var(--step-5);
  color: var(--text);
}

@media (width >= 1100px) {
  .section--split .section__inner {
    grid-template-columns: minmax(16rem, 0.7fr) minmax(0, 1.6fr);
    align-items: start;
    column-gap: clamp(2.5rem, 5vw, 5rem);
  }

  .section--split .section__head {
    position: sticky;
    inset-block-start: calc(var(--header-h) + var(--space-l));
  }

  .section--split .section__title {
    font-size: clamp(2.4rem, 1.2rem + 2.6vw, 4rem);
  }

  .section--split .section__lede {
    font-size: var(--step-0);
  }
}

.section__lede {
  max-inline-size: var(--measure);
  font-size: var(--step-1);
  line-height: 1.5;
  color: var(--text-dim);
  text-wrap: pretty;
}
</style>
