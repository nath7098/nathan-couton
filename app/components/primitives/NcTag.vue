<script setup lang="ts">
import type { TechKey } from '~/data/types'

/**
 * Tech pill. Colour comes from the --tech-* token pair, so the palette stays in
 * one place.
 *
 * Three shapes, and only three: a tag with `details` is a button that opens the
 * modal, a tag with `pressed` is a toggle button that reports its own state,
 * and a tag with neither is plain text — never a button that does nothing.
 *
 * The toggle exists because the projects filter used to fake one by passing a
 * single space as `details`. A space trims to nothing, so the pills rendered as
 * spans: not focusable, not clickable, and silently inert.
 */
const props = withDefaults(defineProps<{
  label: string
  tech: TechKey
  /** Explanatory text; makes the tag open a modal when present. */
  details?: string
  /** Present makes the tag a toggle button, and carries its state. */
  pressed?: boolean
  size?: 'sm' | 'md'
}>(), { details: undefined, pressed: undefined, size: 'md' })

const emit = defineEmits<{ open: [], toggle: [] }>()

const isToggle = computed(() => props.pressed !== undefined)
const hasDetails = computed(() => Boolean(props.details?.trim()))
const interactive = computed(() => isToggle.value || hasDetails.value)

function onClick() {
  if (isToggle.value) emit('toggle')
  else if (hasDetails.value) emit('open')
}
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
    :aria-pressed="isToggle ? String(pressed) : undefined"
    @click="onClick"
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

/* A pressed toggle keeps its fill so the state survives the pointer leaving. */
.nc-tag[aria-pressed='true'] {
  background: var(--tag-bg);
  box-shadow: 0 0 0 2px var(--tag-accent);
}
</style>
