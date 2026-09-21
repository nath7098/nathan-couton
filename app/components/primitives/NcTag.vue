<script setup lang="ts">
import type { TechKey } from '~/data/types'

/**
 * Tech pill. Colour comes from the --tech-* token pair, so the palette stays in
 * one place. A tag with details is a button that opens the modal; one without is
 * plain text — never a button that does nothing.
 */
const props = withDefaults(defineProps<{
  label: string
  tech: TechKey
  /** Explanatory text; makes the tag interactive when present. */
  details?: string
  size?: 'sm' | 'md'
}>(), { details: undefined, size: 'md' })

const emit = defineEmits<{ open: [] }>()

const interactive = computed(() => Boolean(props.details?.trim()))
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    class="nc-tag"
    :class="[`nc-tag--${size}`, { 'is-interactive': interactive }]"
    :style="{
      '--tag-accent': `var(--tech-${tech}-accent)`,
      '--tag-bg': `var(--tech-${tech}-bg)`,
    }"
    :type="interactive ? 'button' : undefined"
    @click="interactive && emit('open')"
  >
    {{ label }}
  </component>
</template>

<style scoped>
.nc-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15em 0.65em 0.25em;
  font-size: var(--step--1);
  font-family: inherit;
  color: inherit;
  background: transparent;
  border: 2px solid var(--tag-accent, var(--surface-faint));
  border-radius: var(--radius-pill);
  transition:
    background-color var(--dur-base) var(--ease-out-expo),
    transform var(--dur-fast) var(--ease-spring);
}

.nc-tag--sm {
  font-size: 0.7rem;
  padding: 0.1em 0.5em 0.2em;
  border-width: 1.5px;
}

.nc-tag.is-interactive {
  cursor: pointer;
}

@media (hover: hover) {
  .nc-tag.is-interactive:hover {
    background: var(--tag-bg);
    transform: translateY(-1px);
  }
}

.nc-tag.is-interactive:active {
  transform: translateY(0);
}
</style>
