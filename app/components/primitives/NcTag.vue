<script setup lang="ts">
import type { TechKey } from '~/data/types'

/**
 * Tech pill. Monochrome: a stack is read, not colour-matched. The v1 tags
 * carried each technology's brand colour, and a row of them — sixteen in the
 * old projects filter — was a rainbow that fought the page for attention.
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
  /** What the label names. Kept for meaning and tests; it no longer colours the pill. */
  tech?: TechKey
  /** Explanatory text; makes the tag open a modal when present. */
  details?: string
  /** Present makes the tag a toggle button, and carries its state. */
  pressed?: boolean
  size?: 'sm' | 'md'
}>(), { tech: undefined, details: undefined, pressed: undefined, size: 'md' })

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
  padding: 0.2em 0.7em 0.25em;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.3;
  color: var(--text-dim);
  background: color-mix(in oklab, var(--text) 5%, transparent);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  white-space: nowrap;
  transition:
    color var(--dur-base) var(--ease-out-expo),
    border-color var(--dur-base) var(--ease-out-expo),
    background-color var(--dur-base) var(--ease-out-expo);
}

.nc-tag--sm {
  padding: 0.12em 0.6em 0.18em;
}

.nc-tag.is-interactive {
  cursor: pointer;
}

@media (hover: hover) {
  .nc-tag.is-interactive:hover {
    color: var(--brand-ink);
    border-color: var(--brand);
  }
}

/* A pressed toggle keeps its fill so the state survives the pointer leaving. */
.nc-tag[aria-pressed='true'] {
  color: var(--on-brand);
  background: var(--brand);
  border-color: var(--brand);
}
</style>
