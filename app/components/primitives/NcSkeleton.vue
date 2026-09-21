<script setup lang="ts">
/**
 * Loading placeholder. Sized by the caller so it occupies exactly what the real
 * content will — no layout shift when it resolves.
 */
withDefaults(defineProps<{
  variant?: 'text' | 'circle' | 'rect'
  width?: string
  height?: string
}>(), { variant: 'text', width: '100%', height: undefined })
</script>

<template>
  <span
    class="nc-skeleton"
    :class="`nc-skeleton--${variant}`"
    :style="{ '--skeleton-w': width, '--skeleton-h': height }"
    aria-hidden="true"
  />
</template>

<style scoped>
.nc-skeleton {
  display: block;
  inline-size: var(--skeleton-w);
  block-size: var(--skeleton-h, 1em);
  background:
    linear-gradient(
      90deg,
      var(--surface-faint) 0%,
      color-mix(in oklab, var(--surface-faint) 45%, var(--background)) 50%,
      var(--surface-faint) 100%
    );
  background-size: 200% 100%;
  border-radius: var(--radius-s);
  animation: nc-shimmer 1400ms linear infinite;
}

.nc-skeleton--circle {
  border-radius: 50%;
  block-size: var(--skeleton-h, var(--skeleton-w));
}

.nc-skeleton--rect {
  border-radius: var(--radius-m);
  block-size: var(--skeleton-h, 100%);
}

@keyframes nc-shimmer {
  to { background-position: -200% 0; }
}

:root[data-motion='reduced'] .nc-skeleton {
  animation: none;
  background: var(--surface-faint);
}
</style>
