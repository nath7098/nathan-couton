<script setup lang="ts">
/**
 * Headings, with the {{ }} braces that are the site's signature.
 *
 * The braces are pseudo-elements so assistive tech reads the text alone, and
 * they animate in from the sides when the heading enters.
 */
const props = withDefaults(defineProps<{
  level?: 1 | 2 | 3
  braces?: boolean
  /** Visual size, if it should differ from the semantic level. */
  size?: 2 | 3 | 4
}>(), { level: 2, braces: true, size: undefined })

const tag = computed(() => `h${props.level}` as const)
const step = computed(() => `var(--step-${props.size ?? (props.level === 1 ? 4 : props.level === 2 ? 3 : 1)})`)
</script>

<template>
  <component
    :is="tag"
    class="nc-heading"
    :class="{ 'nc-braces': braces }"
    :style="{ '--heading-size': step }"
  >
    <slot />
  </component>
</template>

<style scoped>
.nc-heading {
  font-size: var(--heading-size);
  color: var(--primary-text);
  line-height: 1.1;
}

.nc-heading::before,
.nc-heading::after {
  display: inline-block;
  transition: transform var(--dur-slow) var(--ease-out-expo), opacity var(--dur-slow) var(--ease-out-expo);
}

/* Braces converge on the text as the scene sweeps in. */
.nc-heading::before {
  opacity: calc(0.3 + 0.7 * var(--scene-progress, 1));
  transform: translateX(calc((1 - var(--scene-progress, 1)) * -0.6em));
}

.nc-heading::after {
  opacity: calc(0.3 + 0.7 * var(--scene-progress, 1));
  transform: translateX(calc((1 - var(--scene-progress, 1)) * 0.6em));
}
</style>
