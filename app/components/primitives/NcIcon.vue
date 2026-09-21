<script setup lang="ts">
import type { IconName } from '~/utils/icon-names'

/**
 * The site's only icon component. Pulls from the generated sprite
 * (public/sprite.svg), inherits `currentColor`, and is decorative unless given
 * a label.
 */
const props = withDefaults(defineProps<{
  name: IconName
  /** Any CSS length; defaults to the current font size. */
  size?: string
  /** Announce the icon with this label. Omit for decoration. */
  label?: string
}>(), { size: '1em', label: undefined })

const decorative = computed(() => !props.label)
</script>

<template>
  <svg
    class="nc-icon"
    :style="{ '--icon-size': size }"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="label"
    focusable="false"
  >
    <use :href="`/sprite.svg#i-${name}`" />
  </svg>
</template>

<style scoped>
.nc-icon {
  inline-size: var(--icon-size);
  block-size: var(--icon-size);
  flex: 0 0 auto;
  /* Sits on the text baseline rather than hanging below it. */
  vertical-align: -0.125em;
}
</style>
