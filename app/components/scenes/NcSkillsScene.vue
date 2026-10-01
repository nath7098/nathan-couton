<script setup lang="ts">
import { TIERS, skillYears, skillsIn } from '~/data/skills'

/**
 * Skills as `pom.xml` scopes — `compile`, `runtime`, `test` — which is to say:
 * what the job runs on every day, what has been used in production, and what
 * has been tried. Every skill is a word on the page (Ctrl+F finds "Kafka"),
 * with its years and the missions it was used in, linked into the Parcours.
 */
const { t } = useI18n()

const SCOPE = { daily: 'compile', solid: 'runtime', explored: 'test' } as const

function toCommit(event: MouseEvent, id: string) {
  const target = document.getElementById(`commit-${id}`)
  if (!target) return
  event.preventDefault()
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - margin, behavior: reduced ? 'instant' : 'smooth' })
}
</script>

<template>
  <div class="matrix">
    <section
      v-for="tier in TIERS"
      :key="tier"
      class="tier nc-reveal"
      :class="`tier--${tier}`"
      :aria-labelledby="`tier-${tier}`"
    >
      <header class="tier__head">
        <p
          class="tier__scope"
          aria-hidden="true"
        >
          &lt;scope&gt;{{ SCOPE[tier] }}&lt;/scope&gt;
        </p>
        <h3
          :id="`tier-${tier}`"
          class="tier__title"
        >
          {{ t(`skills.tiers.${tier}.title`) }}
        </h3>
      </header>

      <ul class="tier__list">
        <li
          v-for="skill in skillsIn(tier)"
          :key="skill.id"
          class="skill"
        >
          <NcIcon
            v-if="skill.icon"
            :name="skill.icon"
            class="skill__icon"
          />
          <span
            v-else
            class="skill__icon skill__icon--blank"
            aria-hidden="true"
          />
          <span class="skill__name">{{ skill.name }}</span>
          <span
            v-if="skillYears(skill)"
            class="skill__years"
          >{{ t('skills.years', skillYears(skill)!) }}</span>
          <span
            v-if="skill.usedIn?.length"
            class="skill__used"
          >
            <span class="nc-sr-only">{{ t('skills.usedIn') }}</span>
            <a
              v-for="id in skill.usedIn"
              :key="id"
              :href="`#commit-${id}`"
              @click="toCommit($event, id)"
            >{{ t(`parcours.${id}.short`) }}</a>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.matrix {
  display: grid;
  gap: var(--space-xl);
}

.tier {
  display: grid;
  gap: var(--space-s);
}

.tier__head {
  display: grid;
  gap: var(--space-3xs);
}

.tier__scope {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.tier__title {
  font-size: var(--step-3);
}

.tier--daily .tier__title {
  color: var(--brand-ink);
}

.tier__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
  gap: 0 var(--space-l);
  padding: 0;
  margin: 0;
  list-style: none;
}

.skill {
  display: grid;
  grid-template-columns: 1.4rem minmax(0, 1fr) auto;
  gap: 0.15rem var(--space-xs);
  align-items: baseline;
  padding-block: var(--space-xs);
  border-block-end: 1px solid var(--line);
}

.skill__icon {
  align-self: center;
  inline-size: 1.15rem;
  block-size: 1.15rem;
  color: var(--text-dim);
}

.tier--daily .skill__icon {
  color: var(--brand-ink);
}

.skill__name {
  font-weight: 600;
}

.tier--daily .skill__name {
  font-size: var(--step-1);
  font-family: var(--font-display);
  font-weight: 560;
}

.skill__years {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
  white-space: nowrap;
}

.skill__used {
  grid-column: 2 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.6rem;
  font-size: var(--step--2);
}

.skill__used a {
  color: var(--text-dim);
  text-decoration-color: var(--line-strong);
}

@media (hover: hover) {
  .skill__used a:hover {
    color: var(--brand-ink);
  }
}

.tier--explored .skill {
  padding-block: var(--space-2xs);
}

.tier--explored .skill__name {
  font-weight: 500;
  color: var(--text-dim);
}
</style>
