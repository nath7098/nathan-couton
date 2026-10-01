<script setup lang="ts">
/**
 * Headings, with the {{ }} braces that are the site's signature.
 *
 * The braces are pseudo-elements (see `.nc-braces` in typography.css), so
 * assistive tech reads the text alone. They sit tight against the word and
 * fade with `--code` as the page compiles down into its finale.
 *
 * They used to slide in from the sides on a scroll signal that only reached
 * its end once the section was already leaving the screen — so at rest they
 * hung a hundred pixels off the name, at 65% opacity.
 */
const props = withDefaults(defineProps<{
  level?: 1 | 2 | 3
  braces?: boolean
  /** Visual size, if it should differ from the semantic level. */
  size?: 2 | 3 | 4 | 5 | 6
}>(), { level: 2, braces: true, size: undefined })

const tag = computed(() => `h${props.level}` as const)
const step = computed(() => `var(--step-${props.size ?? (props.level === 1 ? 6 : props.level === 2 ? 5 : 2)})`)
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
  color: var(--text);
}
</style>
