<script setup lang="ts">
/** Indeterminate progress ring. Replaces vue3-spinner. */
withDefaults(defineProps<{ size?: string, label?: string }>(), {
  size: '1.5rem',
  label: undefined,
})
</script>

<template>
  <span
    class="nc-spinner"
    :style="{ '--spinner-size': size }"
    :role="label ? 'status' : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
  >
    <svg viewBox="0 0 24 24">
      <circle
        class="nc-spinner__track"
        cx="12"
        cy="12"
        r="9.5"
      />
      <circle
        class="nc-spinner__head"
        cx="12"
        cy="12"
        r="9.5"
      />
    </svg>
  </span>
</template>

<style scoped>
.nc-spinner {
  display: inline-grid;
  inline-size: var(--spinner-size);
  block-size: var(--spinner-size);
}

.nc-spinner svg {
  inline-size: 100%;
  block-size: 100%;
  fill: none;
  stroke-width: 2.25;
  animation: nc-spin 900ms linear infinite;
}

.nc-spinner__track {
  stroke: var(--surface-faint);
}

.nc-spinner__head {
  stroke: var(--primary);
  stroke-linecap: round;
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
}

@keyframes nc-spin {
  to { transform: rotate(360deg); }
}

.nc-spinner svg {
  transform-origin: center;
}

/* Reduced motion: a static three-quarter ring still reads as "working". */
:root[data-motion='reduced'] .nc-spinner svg {
  animation: none;
}
</style>
