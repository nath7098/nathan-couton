<script setup lang="ts">
import type { SkillFamily } from '~/data/skills'

/**
 * Wheel of skills — v1's most distinctive component, rebuilt.
 *
 * Positions are pure CSS (`rotate → translate → counter-rotate` off a per-icon
 * `--angle`); only the wheel's rotation is state. v1 rebuilt a transform string
 * per icon in JS on every click.
 *
 * Fixed from v1: the rotation now takes the shortest way round. v1 computed
 * `delta = index - prev` and, when negative, added the count — so going back one
 * step spun almost a full turn forwards.
 */
import { shortestStep } from '~/utils/wheel'

const props = defineProps<{ family: SkillFamily }>()

const { t } = useI18n()

const selected = ref(0)
/** Accumulated rotation in degrees; monotonic per gesture, never normalised. */
const rotation = ref(0)
const lastStep = ref(1)

const count = computed(() => props.family.skills.length)
const step = computed(() => 360 / count.value)
const current = computed(() => props.family.skills[selected.value]!)

function select(index: number) {
  if (index === selected.value) return

  const delta = shortestStep(selected.value, index, count.value)
  lastStep.value = Math.abs(delta)
  rotation.value -= delta * step.value
  selected.value = index
}

function move(direction: 1 | -1) {
  select((selected.value + direction + count.value) % count.value)
}

/** Duration follows the distance travelled, capped so it never drags. */
const duration = computed(() => `${Math.min(220 + lastStep.value * 110, 700)}ms`)
</script>

<template>
  <div
    class="wheel"
    :style="{ '--accent': `var(--${family.accent})`, '--count': count, '--duration': duration }"
  >
    <div
      class="wheel__ring"
      role="radiogroup"
      :aria-label="t(family.titleKey)"
      @keydown.right.prevent="move(1)"
      @keydown.left.prevent="move(-1)"
      @keydown.home.prevent="select(0)"
    >
      <p class="wheel__title">
        {{ t(family.titleKey) }}
      </p>

      <div
        class="wheel__orbit"
        :style="{ '--rotation': `${rotation}deg` }"
      >
        <button
          v-for="(skill, index) in family.skills"
          :key="skill.id"
          type="button"
          role="radio"
          class="wheel__icon"
          :class="{ 'is-selected': index === selected }"
          :style="{ '--angle': `${index * step}deg` }"
          :aria-checked="index === selected"
          :tabindex="index === selected ? 0 : -1"
          :title="skill.name"
          @click="select(index)"
        >
          <NcIcon
            :name="skill.icon"
            size="2.1rem"
          />
          <span class="nc-sr-only">{{ skill.name }}</span>
        </button>
      </div>
    </div>

    <div
      class="wheel__details"
      aria-live="polite"
    >
      <p class="wheel__name">
        {{ current.name }}
      </p>
      <p class="wheel__exp">
        {{ t('skills.experience') }} : {{ t('skills.exp', current.years) }}
      </p>

      <!-- The meter carries a text value too: level is never colour-only. -->
      <div
        class="wheel__level"
        role="meter"
        :aria-valuenow="current.level"
        aria-valuemin="0"
        aria-valuemax="5"
        :aria-label="t('skills.level', { n: current.level })"
      >
        <div
          class="wheel__level-fill"
          :style="{ '--value': current.level / 5 }"
        />
        <span
          v-for="tick in 4"
          :key="tick"
          class="wheel__level-tick"
          :style="{ '--at': tick / 5 }"
        />
      </div>
      <p class="wheel__level-value">
        {{ t('skills.level', { n: current.level }) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.wheel {
  display: grid;
  gap: var(--space-m);
  inline-size: clamp(15rem, 20vw, 18rem);
}

.wheel__ring {
  position: relative;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.wheel__title {
  font-size: var(--step-0);
  font-weight: 700;
  color: var(--surface);
  text-align: center;
}

.wheel__orbit {
  position: absolute;
  inset: 0;
  transform: rotate(var(--rotation));
  transition: transform var(--duration) var(--ease-spring);
}

/* Placed by angle, then counter-rotated so glyphs stay upright. */
.wheel__icon {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  display: grid;
  place-items: center;
  inline-size: 3rem;
  block-size: 3rem;
  margin: -1.5rem 0 0 -1.5rem;
  color: var(--surface-dim);
  background: var(--background);
  border-radius: 50%;
  transform:
    rotate(calc(var(--angle) - 90deg))
    translateX(calc(50% + 4.6rem))
    rotate(calc(90deg - var(--angle) - var(--rotation)));
  transition:
    color var(--dur-base) var(--ease-out-expo),
    transform var(--duration) var(--ease-spring),
    box-shadow var(--dur-base) var(--ease-out-expo);
}

.wheel__icon.is-selected {
  color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent);
}

@media (hover: hover) {
  .wheel__icon:not(.is-selected):hover {
    color: var(--surface);
  }
}

.wheel__details {
  display: grid;
  gap: var(--space-3xs);
}

.wheel__name {
  font-size: var(--step-1);
  font-weight: 700;
  color: var(--surface);
}

.wheel__exp {
  font-size: var(--step--1);
  color: var(--surface-dim);
}

.wheel__level {
  position: relative;
  block-size: 1rem;
  margin-block-start: var(--space-3xs);
  border: 2px solid var(--accent);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.wheel__level-fill {
  block-size: 100%;
  background: var(--accent);
  transform-origin: left center;
  transform: scaleX(var(--value));
  transition: transform var(--dur-slow) var(--ease-spring);
}

.wheel__level-tick {
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(var(--at) * 100%);
  inline-size: 1px;
  background: var(--background);
  opacity: 0.6;
}

.wheel__level-value {
  font-size: var(--step--1);
  color: var(--surface-dim);
}

:root[data-motion='reduced'] .wheel__orbit,
:root[data-motion='reduced'] .wheel__icon {
  transition-duration: 1ms;
}
</style>
