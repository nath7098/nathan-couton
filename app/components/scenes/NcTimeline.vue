<script setup lang="ts">
import type { TimelineEntry } from '~/data/timeline'
import type { Tag } from '~/data/types'

/**
 * Horizontal timeline — v1's vertical one, turned on its side.
 *
 * The line runs left to right and draws itself as the scene sweeps past; cards
 * alternate above and below it, keeping v1's left/right alternation. Entries
 * with sub-missions expand in place.
 */
withDefaults(defineProps<{
  entries: readonly TimelineEntry[]
  /** `compact` drops the expandable details (used by Education). */
  variant?: 'detailed' | 'compact'
}>(), { variant: 'detailed' })

const { t } = useI18n()

const expanded = ref<string | null>(null)
const activeTag = ref<{ tag: Tag, label: string } | null>(null)

function toggle(entry: TimelineEntry) {
  if (!entry.details?.length) return
  expanded.value = expanded.value === entry.id ? null : entry.id
}
</script>

<template>
  <div class="timeline">
    <!-- The rail line. Drawn with a gradient whose stop follows scene progress. -->
    <div
      class="timeline__line"
      aria-hidden="true"
    />

    <ol class="timeline__items">
      <li
        v-for="(entry, index) in entries"
        :key="entry.id"
        class="timeline__item"
        :class="[`is-${index % 2 === 0 ? 'above' : 'below'}`, { 'is-expanded': expanded === entry.id }]"
        :style="{
          '--accent': `var(--accent-${entry.accent})`,
          '--accent-text': `var(--accent-${entry.accent}-text)`,
          '--i': index,
        }"
      >
        <div class="timeline__dot-wrap">
          <span
            class="timeline__dot"
            aria-hidden="true"
          />
        </div>

        <component
          :is="variant === 'detailed' && entry.details?.length ? 'button' : 'div'"
          class="timeline__card"
          :class="{ 'is-clickable': variant === 'detailed' && entry.details?.length }"
          :type="variant === 'detailed' && entry.details?.length ? 'button' : undefined"
          :aria-expanded="variant === 'detailed' && entry.details?.length ? expanded === entry.id : undefined"
          @click="variant === 'detailed' && toggle(entry)"
        >
          <p class="timeline__date">
            {{ t(entry.dateKey) }}
          </p>
          <h3 class="timeline__title">
            {{ t(entry.titleKey) }}
          </h3>
          <p class="timeline__content">
            {{ t(entry.contentKey) }}
          </p>

          <span
            v-if="variant === 'detailed' && entry.details?.length"
            class="timeline__chevron"
            aria-hidden="true"
          >
            <NcIcon name="chevron-down" />
          </span>
        </component>

        <!-- grid-template-rows 0fr → 1fr animates height without measuring it. -->
        <div
          v-if="variant === 'detailed' && entry.details?.length"
          class="timeline__details"
        >
          <div class="timeline__details-inner">
            <div
              v-for="(detail, d) in entry.details"
              :key="d"
              class="timeline__detail"
            >
              <p
                v-if="detail.dateKey"
                class="timeline__detail-date"
              >
                {{ t(detail.dateKey) }}
              </p>
              <p
                v-if="detail.titleKey"
                class="timeline__detail-title"
              >
                {{ t(detail.titleKey) }}
              </p>
              <p class="timeline__detail-content">
                {{ t(detail.contentKey) }}
              </p>
              <div class="timeline__detail-tags">
                <NcTag
                  v-for="tag in detail.skills"
                  :key="tag.label"
                  size="sm"
                  :label="tag.label"
                  :tech="tag.tech"
                  :details="tag.detailsKey ? t(tag.detailsKey) : undefined"
                  @open="activeTag = { tag, label: tag.label }"
                />
              </div>
            </div>
          </div>
        </div>
      </li>
    </ol>

    <NcModal
      :open="activeTag !== null"
      :title="activeTag?.label ?? ''"
      :accent="activeTag ? `var(--tech-${activeTag.tag.tech}-accent)` : undefined"
      @close="activeTag = null"
    >
      <p>{{ activeTag?.tag.detailsKey ? t(activeTag.tag.detailsKey) : '' }}</p>
    </NcModal>
  </div>
</template>

<style scoped>
.timeline {
  position: relative;
  display: grid;
  align-content: center;
  inline-size: 100%;
}

.timeline__line {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 50%;
  block-size: 2px;
  background: var(--surface-faint);
  transform-origin: left center;
  /* Draws itself as the scene crosses the viewport. */
  scale: calc(0.05 + 0.95 * var(--scene-progress, 1)) 1;
}

.timeline__items {
  display: flex;
  gap: clamp(2rem, 6vw, 6rem);
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
}

.timeline__item {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  align-items: center;
  inline-size: clamp(16rem, 24vw, 22rem);
  min-block-size: 26rem;
}

.timeline__dot-wrap {
  grid-row: 2;
  display: grid;
  place-items: center;
  block-size: 2rem;
}

.timeline__dot {
  inline-size: 1.15rem;
  block-size: 1.15rem;
  background: var(--background);
  border: 3px solid var(--surface-faint);
  border-radius: 50%;
  transition: border-color var(--dur-base) var(--ease-out-expo), box-shadow var(--dur-base) var(--ease-out-expo);
}

.timeline__item:hover .timeline__dot,
.timeline__item.is-expanded .timeline__dot {
  border-color: var(--accent);
  box-shadow: 0 0 0 5px color-mix(in oklab, var(--accent) 22%, transparent);
}

.timeline__card {
  display: grid;
  gap: var(--space-3xs);
  justify-items: start;
  padding: var(--space-s);
  font: inherit;
  color: inherit;
  text-align: start;
  background: var(--editor);
  border: 1px solid var(--surface-faint);
  border-radius: var(--radius-m);
  transition: border-color var(--dur-base) var(--ease-out-expo), transform var(--dur-base) var(--ease-out-expo);
}

.timeline__card.is-clickable {
  cursor: pointer;
}

@media (hover: hover) {
  .timeline__card.is-clickable:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
}

.timeline__item.is-above .timeline__card {
  grid-row: 1;
  align-self: end;
  margin-block-end: var(--space-s);
}

.timeline__item.is-below .timeline__card {
  grid-row: 3;
  align-self: start;
  margin-block-start: var(--space-s);
}

/* The dot keeps the raw accent; the date needs the text-safe variant. */
.timeline__date {
  font-size: var(--step-0);
  color: var(--accent-text);
  font-weight: 700;
}

.timeline__title {
  font-size: var(--step-1);
  color: var(--surface);
}

.timeline__content {
  font-size: var(--step--1);
  color: var(--surface-dim);
  line-height: 1.5;
}

.timeline__chevron {
  margin-block-start: var(--space-3xs);
  color: var(--surface-dim);
  transition: transform var(--dur-base) var(--ease-spring);
}

.timeline__item.is-expanded .timeline__chevron {
  transform: rotate(180deg);
}

.timeline__details {
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  opacity: 0;
  transition: grid-template-rows var(--dur-slow) var(--ease-out-expo), opacity var(--dur-base) var(--ease-out-expo);
}

.timeline__item.is-above .timeline__details {
  grid-row: 3;
  margin-block-start: var(--space-s);
}

.timeline__item.is-below .timeline__details {
  grid-row: 1;
  align-self: end;
  margin-block-end: var(--space-s);
}

.timeline__item.is-expanded .timeline__details {
  grid-template-rows: 1fr;
  opacity: 1;
}

.timeline__details-inner {
  min-block-size: 0;
  display: grid;
  gap: var(--space-s);
}

.timeline__detail {
  display: grid;
  gap: var(--space-3xs);
}

.timeline__detail-date {
  font-size: var(--step--1);
  color: var(--accent-text);
}

.timeline__detail-title {
  font-size: var(--step-0);
  color: var(--surface);
}

.timeline__detail-content {
  font-size: var(--step--1);
  color: var(--surface-dim);
  line-height: 1.5;
}

.timeline__detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3xs);
  margin-block-start: var(--space-3xs);
}

/* Stacked layout: the line runs down the left edge instead. */
@media not all and (min-width: 1024px) {
  .timeline__items {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-l);
  }

  .timeline__line {
    inset-block: 0;
    inset-inline-start: 0.5rem;
    inline-size: 2px;
    block-size: auto;
    scale: 1 1;
  }

  .timeline__item {
    grid-template-rows: auto;
    grid-template-columns: 2rem 1fr;
    inline-size: auto;
    min-block-size: 0;
  }

  .timeline__dot-wrap {
    grid-row: 1;
    grid-column: 1;
  }

  .timeline__item.is-above .timeline__card,
  .timeline__item.is-below .timeline__card {
    grid-row: 1;
    grid-column: 2;
    margin-block: 0;
  }

  .timeline__item.is-above .timeline__details,
  .timeline__item.is-below .timeline__details {
    grid-row: 2;
    grid-column: 2;
    margin-block: 0;
  }
}
</style>
