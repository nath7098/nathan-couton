<script setup lang="ts">
import { EDUCATION } from '~/data/timeline'
</script>

<template>
  <NcTimeline
    :entries="EDUCATION"
    variant="compact"
    class="education"
  />
</template>

<style scoped>
/* Same component as Experience, read as a second movement: dotted line, and
   the cards sit a touch quieter. */
.education :deep(.timeline__line) {
  background: repeating-linear-gradient(
    to right,
    var(--surface-faint) 0 8px,
    transparent 8px 16px
  );
}
</style>
